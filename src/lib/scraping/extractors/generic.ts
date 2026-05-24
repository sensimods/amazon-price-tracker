import * as cheerio from "cheerio";
import type { PriceExtractor, ScrapeResult } from "../types";
import { extractPriceFromText, getText } from "../fetcher";

const PRICE_SELECTORS = [
  // Common e-commerce price selectors
  '[class*="price"]',
  '[class*="Price"]',
  '[id*="price"]',
  '[id*="Price"]',
  '[itemprop="price"]',
  ".product-price",
  ".sale-price",
  ".offer-price",
  ".current-price",
  // Meta tags
  'meta[property="product:price:amount"]',
  'meta[property="og:price:amount"]',
];

const TITLE_SELECTORS = [
  'meta[property="og:title"]',
  'meta[name="twitter:title"]',
  "h1",
  ".product-title",
  ".product-name",
  '[class*="productName"]',
];

const AVAILABILITY_SELECTORS = [
  '[itemprop="availability"]',
  ".availability",
  ".stock-status",
  "#availability",
];

export const genericExtractor: PriceExtractor = {
  name: "generic",
  domains: ["*"], // Matches any domain

  extract($: cheerio.CheerioAPI, url: string): ScrapeResult | null {
    let price: number | null = null;

    // 1. Try meta tags first (most reliable)
    const metaPrice =
      $('meta[property="product:price:amount"]').attr("content") ??
      $('meta[property="og:price:amount"]').attr("content") ??
      $('meta[name="price"]').attr("content");

    if (metaPrice) {
      const parsed = parseFloat(metaPrice);
      if (!isNaN(parsed) && parsed > 0) price = parsed;
    }

    // 2. Try common CSS selectors
    if (!price) {
      for (const selector of PRICE_SELECTORS) {
        const text = getText($, selector);
        if (!text) continue;

        const parsed = extractPriceFromText(text);
        if (parsed) {
          price = parsed;
          break;
        }
      }
    }

    // 3. Scan the entire page text for price patterns
    if (!price) {
      const bodyText = $("body").text();
      price = extractPriceFromText(bodyText);
    }

    // Extract title
    let title: string | null = null;
    for (const selector of TITLE_SELECTORS) {
      if (selector.startsWith("meta")) {
        title = $(selector).attr("content") ?? null;
      } else {
        title = getText($, selector);
      }
      if (title) break;
    }

    // Detect currency from URL or meta
    let currency = "USD";
    const currencyMeta = $('meta[property="product:price:currency"]').attr("content");
    if (currencyMeta) currency = currencyMeta;

    const currencyPattern = $("body").text().match(/[€£¥]/);
    if (currencyPattern) {
      if (currencyPattern[0] === "€") currency = "EUR";
      else if (currencyPattern[0] === "£") currency = "GBP";
      else if (currencyPattern[0] === "¥") currency = "JPY";
    }

    // Availability check
    let isAvailable = price !== null;
    for (const selector of AVAILABILITY_SELECTORS) {
      const text = getText($, selector)?.toLowerCase() ?? "";
      if (text.includes("out of stock") || text.includes("sold out")) {
        isAvailable = false;
        break;
      }
    }

    return {
      price,
      currency,
      isAvailable,
      rawData: {
        title,
        url,
      },
      scrapedAt: new Date().toISOString(),
      store: null,
    };
  },
};