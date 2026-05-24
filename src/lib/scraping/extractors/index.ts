import type { PriceExtractor } from "../types";
import { amazonExtractor } from "./amazon";
import { genericExtractor } from "./generic";

export const extractors: PriceExtractor[] = [
  amazonExtractor,
  genericExtractor,
];

export function getExtractorForUrl(url: string): PriceExtractor {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    // Find a specific extractor for this domain
    for (const extractor of extractors) {
      if (extractor.domains.includes("*")) continue; // Skip generic
      if (extractor.domains.some((d) => hostname.includes(d))) {
        return extractor;
      }
    }
  } catch {
    // Invalid URL — fall through to generic
  }

  return genericExtractor;
}

export { amazonExtractor } from "./amazon";
export { genericExtractor } from "./generic";