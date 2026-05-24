import type { CheerioAPI } from "cheerio";

export interface ScrapeResult {
  price: number | null;
  currency: string;
  isAvailable: boolean;
  rawData: Record<string, unknown>;
  scrapedAt: string;
  store: string | null;
}

export interface PriceExtractor {
  /** Human-readable name of the extractor */
  name: string;
  /** Domains this extractor can handle */
  domains: string[];
  /** Extract price from page HTML content */
  extract($: CheerioAPI, url: string): ScrapeResult | null;
}

export interface PageContent {
  html: string;
  url: string;
  status: number;
}

export interface ScrapeRequest {
  productId: string;
  url: string;
  store?: string | null;
}

export type FetchMethod = "http" | "browser" | "api";

export function detectStore(url: string): string | null {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes("amazon")) return "amazon";
  return null;
}

export function determineFetchMethod(store: string | null): FetchMethod {
  return "browser"; // Amazon needs Playwright for reliable scraping
}