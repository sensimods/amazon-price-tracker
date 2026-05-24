import * as cheerio from "cheerio";
import type { PriceExtractor, ScrapeResult } from "../types";

const BESTBUY_SELECTORS = [
  // Primary price elements
  '[data-testid="customer-price"]',
  ".priceView-customer-price span",
  ".pricing-price .priceView-customer-price",
  // Alternative selectors
  ".sku-price",
  '[content*="price"] [itemprop="price"]',
  ".price_FHDfG",
  // Fallback
  '[class*="price"] [data Automation*="price"]',
];

export const bestbuyExtractor: PriceExtractor = {
  name: "bestbuy",
  domains: ["bestbuy.com", "bestbuy.ca"],

  extract($: cheerio.CheerioAPI, url: string): ScrapeResult | null {
    let price: number | null = null;

    for (const selector of BESTBUY_SELECTORS) {
      const text = $(selector).first().text().trim();
      if (!text) continue;

      const cleaned = text.replace(/[^0-9.,]/g, "").replace(/,/g, "");
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        price = parsed;
        break;
      }
    }

    // Also check meta tags
    if (!price) {
      const metaPrice = $('meta[itemprop="price"]').attr("content");
      if (metaPrice) {
        const parsed = parseFloat(metaPrice);
        if (!isNaN(parsed) && parsed > 0) price = parsed;
      }
    }

    const buttonText = $(".add-to-cart-button").first().text().toLowerCase();
    const isSoldOut = buttonText.includes("sold out");

    return {
      price,
      currency: "USD",
      isAvailable: !isSoldOut && price !== null,
      rawData: {
        title: $("h1").first().text().trim(),
        buttonText,
        selectorsTried: BESTBUY_SELECTORS.length,
      },
      scrapedAt: new Date().toISOString(),
      store: "bestbuy",
    };
  },
};