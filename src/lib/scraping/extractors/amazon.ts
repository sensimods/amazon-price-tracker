import * as cheerio from "cheerio";
import type { PriceExtractor, ScrapeResult } from "../types";

const AMAZON_SELECTORS = [
  // Standard Amazon product page
  ".a-price .a-offscreen",
  "#priceblock_ourprice",
  "#priceblock_dealprice",
  ".a-price-whole",
  // CorePrice feature (newer pages)
  ".corePriceDisplay .a-price .a-offscreen",
  '[data-a-size="xl"] .a-price .a-offscreen',
  // Dynamic price element
  "#corePrice_desktop .a-price .a-offscreen",
  // Fallback: any element with price text
  '[cel_widget_id="MAIN-TOP_BANNER"] .a-price',
];

export const amazonExtractor: PriceExtractor = {
  name: "amazon",
  domains: ["amazon.com", "amazon.co.uk", "amazon.de", "amazon.fr",
    "amazon.ca", "amazon.co.jp", "amazon.in", "amazon.com.au"],

  extract($: cheerio.CheerioAPI, url: string): ScrapeResult | null {
    const hostname = new URL(url).hostname;
    let price: number | null = null;
    let currency = "USD";

    // Map TLD to currency
    const currencyMap: Record<string, string> = {
      "amazon.co.uk": "GBP",
      "amazon.de": "EUR",
      "amazon.fr": "EUR",
      "amazon.co.jp": "JPY",
      "amazon.ca": "CAD",
      "amazon.in": "INR",
      "amazon.com.au": "AUD",
    };
    const tld = Object.keys(currencyMap).find((k) => hostname.includes(k));
    if (tld) currency = currencyMap[tld];

    // Try each selector
    for (const selector of AMAZON_SELECTORS) {
      const text = $(selector).first().text().trim();
      if (!text) continue;

      const cleaned = text.replace(/[^0-9.,]/g, "").replace(/,/g, "");
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        price = parsed;
        break;
      }
    }

    // Try from whole + fraction
    if (!price) {
      const whole = $(".a-price-whole").first().text().trim();
      const fraction = $(".a-price-fraction").first().text().trim();
      if (whole) {
        price = parseFloat(`${whole.replace(/,/g, "")}.${fraction || "00"}`);
      }
    }

    // Check if product is available
    const availabilityText = $("#availability span").first().text().toLowerCase();
    const outOfStock = availabilityText.includes("currently unavailable") ||
      availabilityText.includes("out of stock");

    return {
      price,
      currency,
      isAvailable: !outOfStock && price !== null,
      rawData: {
        title: $("#productTitle").first().text().trim(),
        availability: availabilityText,
        selectorsTried: AMAZON_SELECTORS.length,
      },
      scrapedAt: new Date().toISOString(),
      store: "amazon",
    };
  },
};