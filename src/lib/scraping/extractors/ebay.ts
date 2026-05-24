import type { PriceExtractor, ScrapeResult } from "../types";
import { fetchEbayPrice, extractItemId } from "../ebay-client";

export const ebayExtractor: PriceExtractor = {
  name: "ebay",
  domains: ["ebay.com", "ebay.co.uk", "ebay.de", "ebay.fr",
    "ebay.ca", "ebay.com.au", "ebay.in", "ebay.it", "ebay.es"],

  extract(_$, url: string): ScrapeResult | null {
    // The eBay extractor uses the API, not cheerio HTML parsing.
    // This method is synchronous by contract, but API calls are async.
    // Instead, the orchestrator handles eBay via the "api" fetch method
    // and calls fetchEbayPrice directly. This method validates that the
    // URL looks like an eBay product page.
    const itemId = extractItemId(url);
    if (!itemId) {
      return {
        price: null,
        currency: "USD",
        isAvailable: false,
        rawData: { error: "Could not extract eBay item ID from URL", url },
        scrapedAt: new Date().toISOString(),
        store: "ebay",
      };
    }

    // Return a placeholder that signals "use API" to the caller
    return {
      price: null,
      currency: "USD",
      isAvailable: false,
      rawData: { itemId, requiresApi: true, url },
      scrapedAt: new Date().toISOString(),
      store: "ebay",
    };
  },
};