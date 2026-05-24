import { db } from "@/lib/db";
import { products } from "@/lib/db/schema/products";
import { eq } from "drizzle-orm";
import { searchEbayCheapest } from "@/lib/scraping/ebay-client";

interface ComparisonResult {
  cheapestPrice: string | null;
  cheapestUrl: string | null;
  cheapestStore: string | null;
  cheapestTitle: string | null;
  isCheaper: boolean;
  savings: string | null;
}

/**
 * Extract an ASIN from an Amazon product URL.
 * Amazon URLs use /dp/ASIN/ format.
 */
function extractASIN(url: string): string | null {
  try {
    const match = url.match(/\/dp\/([A-Z0-9]{10})/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Extract key model identifiers from a product name.
 * Picks out things like "RTX 3090", "GeForce", model numbers, etc.
 */
function extractModelTokens(name: string): string[] {
  // Pattern: capture GPU models, CPU models, product codes
  const patterns = [
    /\b(RTX\s+\d+)\b/i,
    /\b(GTX\s+\d+)\b/i,
    /\b(Radeon\s+RX\s+\d+)\b/i,
    /\b(Core\s+i\d[\-]?\d+)\b/i,
    /\b(Ryzen\s+\d+)\b/i,
    /\b([A-Z0-9]{3,}[\-\s]?\d{3,}[A-Z0-9]*)\b/,
    /\b(\d+\s*GB)\b/i,
    /\b(\d+TB)\b/i,
  ];

  const tokens: string[] = [];
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      tokens.push(match[1].trim());
    }
  }

  return tokens;
}

/**
 * Build a focused search query from the product name.
 * Strips generic words and prioritizes model identifiers.
 */
function buildSearchQuery(name: string): string {
  // Known brand names to keep
  const brands = [
    "ASUS", "NVIDIA", "AMD", "Intel", "Samsung", "LG", "Sony",
    "Gigabyte", "MSI", "EVGA", "Corsair", "Seasonic", "Western Digital",
    "Seagate", "Sapphire", "Zotac", "PNY", "XFX", "PowerColor",
  ];

  const modelTokens = extractModelTokens(name);
  const foundBrand = brands.find((b) =>
    name.toUpperCase().includes(b.toUpperCase()),
  );

  const parts: string[] = [];
  if (foundBrand) parts.push(foundBrand);
  parts.push(...modelTokens);

  // If we have very few tokens, add key nouns from the title
  if (parts.length < 3) {
    const words = name.split(/\s+/);
    const keyWords = words
      .filter(
        (w) =>
          w.length > 3 &&
          !["with", "and", "for", "the", "graphics", "displayport", "bearings"].includes(w.toLowerCase()),
      )
      .slice(0, 5);
    parts.push(...keyWords);
  }

  return parts.join(" ");
}

/**
 * Search for a cheaper alternative for a given product.
 * Uses ASIN, model numbers, brand, and price-range filters
 * to ensure true like-for-like comparison.
 */
export async function findCheaperAlternative(
  productId: string,
  userId: string,
): Promise<ComparisonResult> {
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .then((rows) => rows[0]);

  if (!product || product.userId !== userId) {
    throw new Error("Product not found");
  }

  const productName = product.name ?? "";
  const currentPrice = product.currentPrice
    ? parseFloat(product.currentPrice)
    : null;

  // Build the search query
  const asin = extractASIN(product.url);
  const modelQuery = buildSearchQuery(productName);

  // Combine ASIN (if available) with model query for maximum relevance
  const searchQuery = asin ? `${asin} ${modelQuery}` : modelQuery;

  // Set a price range: 30% to 150% of current price
  // This automatically filters out cheap accessories ($10 fan for a $1300 GPU)
  const minPrice = currentPrice !== null ? Math.round(currentPrice * 0.3) : undefined;
  const maxPrice = currentPrice !== null ? Math.round(currentPrice * 1.5) : undefined;

  const excludeHostname = new URL(product.url).hostname;

  // First attempt: search with ASIN + model + price range
  let searchResult = await searchEbayCheapest(
    searchQuery,
    minPrice,
    maxPrice,
    excludeHostname,
  );

  // Second attempt: if ASIN was used and nothing found, try without ASIN
  if (!searchResult.found && asin) {
    searchResult = await searchEbayCheapest(
      modelQuery,
      minPrice,
      maxPrice,
      excludeHostname,
    );
  }

  if (!searchResult.found || !searchResult.result) {
    // Store "no result" in the DB
    await db
      .update(products)
      .set({
        cheapestPrice: null,
        cheapestUrl: null,
        cheapestStore: null,
        cheapestTitle: null,
        cheapestCheckedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    return {
      cheapestPrice: null,
      cheapestUrl: null,
      cheapestStore: null,
      cheapestTitle: null,
      isCheaper: false,
      savings: null,
    };
  }

  const cheapestPriceVal = searchResult.result.price.value;
  const cheapest = parseFloat(cheapestPriceVal);

  let isCheaper = false;
  let savings: string | null = null;

  if (currentPrice !== null && !isNaN(cheapest)) {
    if (cheapest < currentPrice) {
      isCheaper = true;
      const diff = currentPrice - cheapest;
      savings = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: searchResult.result.price.currency,
      }).format(diff);
    }
  }

  // Store the results on the product record
  await db
    .update(products)
    .set({
      cheapestPrice: cheapestPriceVal,
      cheapestUrl: searchResult.result.itemWebUrl,
      cheapestStore: "ebay",
      cheapestTitle: searchResult.result.title,
      cheapestCheckedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  return {
    cheapestPrice: cheapestPriceVal,
    cheapestUrl: searchResult.result.itemWebUrl ?? null,
    cheapestStore: "ebay",
    cheapestTitle: searchResult.result.title,
    isCheaper,
    savings,
  };
}

/**
 * Toggle the cheapest-search feature for a product.
 */
export async function toggleCheapestSearch(
  productId: string,
  userId: string,
  enabled: boolean,
) {
  await db
    .update(products)
    .set({
      cheapestSearchEnabled: enabled,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));
}