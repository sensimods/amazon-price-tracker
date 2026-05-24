import * as cheerio from "cheerio";
import type { PageContent } from "./types";

export async function fetchWithHttp(url: string): Promise<PageContent> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    const html = await response.text();
    return {
      html,
      url,
      status: response.status,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse common price patterns from HTML text.
 * Returns the first match found, or null.
 */
export function extractPriceFromText(text: string): number | null {
  // Match patterns like $19.99, $1,299.00, 19.99€, etc.
  const patterns = [
    /\$([0-9,]+\.?\d{0,2})/,
    /EUR\s*([0-9,]+\.?\d{0,2})/i,
    /([0-9,]+\.?\d{0,2})\s*€/,
    /£([0-9,]+\.?\d{0,2})/,
    /price[:\s]*\$?([0-9,]+\.?\d{0,2})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = match[1].replace(/,/g, "");
      const price = parseFloat(cleaned);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
  }

  return null;
}

/**
 * Get the text content of the first element matching a CSS selector.
 */
export function getText($: cheerio.CheerioAPI, selector: string): string | null {
  const el = $(selector).first();
  return el.length > 0 ? el.text().trim() : null;
}