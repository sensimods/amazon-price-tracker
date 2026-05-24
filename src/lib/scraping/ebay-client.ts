/**
 * eBay Browse API client with automatic OAuth token management.
 * Tokens are cached in-memory and refreshed when expired (2-hour lifetime).
 *
 * Uses the eBay Browse API to fetch item prices instead of scraping HTML,
 * which is both more reliable and eBay-approved.
 */

let cachedToken: {
  accessToken: string;
  expiresAt: number;
} | null = null;

function getBaseUrl(): string {
  return "https://api.ebay.com";
}

function getCredentials(): { clientId: string; clientSecret: string } {
  return {
    clientId: process.env.EBAY_APP_ID ?? "",
    clientSecret: process.env.EBAY_CERT_ID ?? "",
  };
}

/**
 * Throws a sanitized error (short message, no raw HTML bodies).
 */
function apiError(prefix: string, status: number, body: string): Error {
  const snippet = body.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const msg = `${prefix} (${status}): ${snippet.slice(0, 200)}`;
  return new Error(msg);
}

/**
 * Get an OAuth Application Access Token using the client credentials grant.
 * Caches the token and reuses it until it expires (2 hours).
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }

  const { clientId, clientSecret } = getCredentials();

  if (!clientId || !clientSecret) {
    throw new Error(
      "eBay credentials not configured. Set EBAY_APP_ID and EBAY_CERT_ID in .env.local",
    );
  }

  const base64 = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(
    `${getBaseUrl()}/identity/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${base64}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "https://api.ebay.com/oauth/api_scope",
      }),
    },
  );

  if (!response.ok) {
    throw apiError("eBay OAuth failed", response.status, await response.text());
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  // Cache with 5-minute safety buffer before 2-hour expiry
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

/**
 * Extract an eBay item ID from a product URL.
 *
 * Supports formats:
 *   https://www.ebay.com/itm/123456789012
 *   https://www.ebay.com/itm/123456789012?hash=item...
 *   https://www.ebay.com/p/123456789012
 *   https://www.ebay.com/sch/i.html?_nkw=... (returns null)
 */
export function extractItemId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.replace(/\/+$/, "").split("/");

    for (let i = 0; i < parts.length - 1; i++) {
      if (parts[i] === "itm" || parts[i] === "p") {
        return parts[i + 1].split("?")[0].split("&")[0];
      }
    }

    // Fallback: any segment that looks like a 9+ digit ID
    const numeric = parts.filter((p) => /^\d{9,}$/.test(p));
    return numeric.length > 0 ? numeric[0] : null;
  } catch {
    return null;
  }
}

export interface EbayItemResult {
  itemId: string;
  title: string;
  price: { value: string; currency: string };
  image?: { imageUrl: string };
  condition?: string;
  itemWebUrl?: string;
  seller?: { username: string };
}

export interface EbaySearchResult {
  itemId: string;
  title: string;
  price: { value: string; currency: string };
  itemWebUrl?: string;
  image?: { imageUrl: string };
  seller?: { username: string };
  condition?: string;
}

/**
 * Search eBay for items matching a query, returning the cheapest result.
 * Used by the price comparison feature to find better deals.
 * Results are sorted by price ascending.
 *
 * @param query - Search keywords
 * @param minPrice - Minimum price filter (excludes accessories)
 * @param maxPrice - Maximum price filter (excludes unrelated expensive items)
 * @param excludeUrl - Optional hostname to exclude (user's own listing)
 */
export async function searchEbayCheapest(
  query: string,
  minPrice?: number,
  maxPrice?: number,
  excludeUrl?: string,
): Promise<{
  found: boolean;
  result?: EbaySearchResult;
  error?: string;
}> {
  const token = await getAccessToken();
  const encodedQuery = encodeURIComponent(query);

  // Build the filter string with price range
  let filter = `priceCurrency:USD`;
  if (minPrice !== undefined && maxPrice !== undefined) {
    filter = `price:[${minPrice}..${maxPrice}],${filter}`;
  }

  const response = await fetch(
    `${getBaseUrl()}/buy/browse/v1/item_summary/search?q=${encodedQuery}&limit=5&sort=price&filter=${encodeURIComponent(filter)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    },
  );

  if (!response.ok) {
    return {
      found: false,
      error: `eBay search failed (${response.status})`,
    };
  }

  const data = (await response.json()) as {
    itemSummaries?: EbaySearchResult[];
  };

  if (!data.itemSummaries || data.itemSummaries.length === 0) {
    return { found: false };
  }

  // Filter out results that are likely accessories (title doesn't match well)
  const queryTerms = query.toLowerCase().split(/\s+/);
  const relevantResults = data.itemSummaries.filter((item) => {
    const title = item.title.toLowerCase();

    // Count how many key query terms appear in the title
    const matchCount = queryTerms.filter((term) =>
      term.length > 3 && title.includes(term),
    ).length;

    // Require at least 2 key terms or 50% of key terms to match
    const keyTerms = queryTerms.filter((t) => t.length > 3);
    const threshold = Math.max(2, Math.ceil(keyTerms.length * 0.4));
    return matchCount >= threshold;
  });

  if (relevantResults.length === 0) {
    return { found: false };
  }

  // Results are sorted by price ascending — cheapest first
  let cheapest = relevantResults[0];

  // If the cheapest result matches the user's own store, try the next one
  if (
    excludeUrl &&
    cheapest.itemWebUrl &&
    cheapest.itemWebUrl.includes(excludeUrl) &&
    relevantResults.length > 1
  ) {
    cheapest = relevantResults[1];
  }

  return {
    found: true,
    result: cheapest,
  };
}

/**
 * Fetch item details from the eBay Browse API.
 * Tries the direct /item/{itemId} endpoint first, then falls back to
 * get_item_by_legacy_id if the first approach fails.
 */
export async function fetchEbayItem(
  legacyItemId: string,
): Promise<EbayItemResult> {
  const token = await getAccessToken();
  const baseHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
  };

  // Strategy 1: try get_item_by_legacy_id (handles numeric IDs from URLs)
  const url1 = `${getBaseUrl()}/buy/browse/v1/item/get_item_by_legacy_id?legacy_item_id=${legacyItemId}`;

  const res1 = await fetch(url1, { headers: baseHeaders });

  if (res1.ok) {
    return (await res1.json()) as EbayItemResult;
  }

  // If 404, the legacy ID wasn't found — try other approaches
  if (res1.status !== 404) {
    throw apiError(
      "eBay get_item_by_legacy_id failed",
      res1.status,
      await res1.text(),
    );
  }

  // Strategy 2: try the direct /item/{id} endpoint (for modern IDs)
  const url2 = `${getBaseUrl()}/buy/browse/v1/item/${encodeURIComponent(legacyItemId)}`;

  const res2 = await fetch(url2, { headers: baseHeaders });

  if (res2.ok) {
    return (await res2.json()) as EbayItemResult;
  }

  throw apiError(
    "eBay getItem failed",
    res2.status,
    await res2.text(),
  );
}

/**
 * Fetch price information for an eBay product URL.
 * This is the main entry point called by the scraping orchestrator.
 */
export async function fetchEbayPrice(
  url: string,
): Promise<{
  price: number | null;
  currency: string;
  isAvailable: boolean;
  rawData: Record<string, unknown>;
}> {
  const itemId = extractItemId(url);

  if (!itemId) {
    return {
      price: null,
      currency: "USD",
      isAvailable: false,
      rawData: { error: "Could not extract eBay item ID from URL", url },
    };
  }

  try {
    const item = await fetchEbayItem(itemId);

    const priceValue = item.price?.value
      ? parseFloat(item.price.value)
      : null;

    return {
      price: priceValue,
      currency: item.price?.currency ?? "USD",
      isAvailable: priceValue !== null,
      rawData: {
        title: item.title,
        condition: item.condition,
        imageUrl: item.image?.imageUrl,
        seller: item.seller?.username,
        itemId: item.itemId,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown eBay API error";

    // Keep error messages short enough to display in the UI
    const shortMessage = message.length > 120
      ? `${message.slice(0, 120)}...`
      : message;

    return {
      price: null,
      currency: "USD",
      isAvailable: false,
      rawData: {
        error: shortMessage,
        itemId,
        url,
      },
    };
  }
}