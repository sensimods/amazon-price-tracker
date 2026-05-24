import * as cheerio from "cheerio";
import { getExtractorForUrl } from "./extractors";
import { fetchWithBrowser } from "./browser";
import { detectStore } from "./types";
import type { ScrapeResult, ScrapeRequest } from "./types";

/**
 * Scrape an Amazon product page and extract price information.
 * Always uses Playwright (browser) for reliable Amazon scraping.
 */
export async function scrapeProduct(
  request: ScrapeRequest,
): Promise<ScrapeResult> {
  const store = "amazon";

  // Fetch the page content using Playwright
  const pageContent = await fetchWithBrowser(request.url);

  if (pageContent.status >= 400) {
    return {
      price: null,
      currency: "USD",
      isAvailable: false,
      rawData: { error: `HTTP ${pageContent.status}`, url: request.url },
      scrapedAt: new Date().toISOString(),
      store,
    };
  }

  // Parse HTML and run the Amazon extractor
  const $ = cheerio.load(pageContent.html);
  const extractor = getExtractorForUrl(request.url);
  const result = extractor.extract($, request.url);

  return (
    result ?? {
      price: null,
      currency: "USD",
      isAvailable: false,
      rawData: { error: "Extractor returned no result", url: request.url },
      scrapedAt: new Date().toISOString(),
      store,
    }
  );
}

/**
 * Scrape multiple product pages concurrently.
 */
export async function scrapeProducts(
  requests: ScrapeRequest[],
): Promise<Map<string, ScrapeResult>> {
  const results = new Map<string, ScrapeResult>();

  const promises = requests.map(async (req) => {
    try {
      const result = await scrapeProduct(req);
      results.set(req.productId, result);
    } catch (error) {
      results.set(req.productId, {
        price: null,
        currency: "USD",
        isAvailable: false,
        rawData: {
          error: error instanceof Error ? error.message : "Unknown error",
          url: req.url,
        },
        scrapedAt: new Date().toISOString(),
        store: "amazon",
      });
    }
  });

  await Promise.all(promises);
  return results;
}