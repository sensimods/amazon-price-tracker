import { z } from "zod";

const AMAZON_DOMAINS = [
  "amazon.com",
  "amazon.co.uk",
  "amazon.de",
  "amazon.fr",
  "amazon.ca",
  "amazon.co.jp",
  "amazon.in",
  "amazon.com.au",
  "amazon.it",
  "amazon.es",
  "amazon.nl",
  "amazon.sg",
  "amazon.ae",
  "amazon.sa",
  "amazon.se",
  "amazon.pl",
];

function isAmazonUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return AMAZON_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export const createProductSchema = z.object({
  url: z
    .string()
    .url("Must be a valid URL")
    .refine(isAmazonUrl, "Only Amazon URLs are supported"),
  name: z.string().min(1, "Name is required").optional(),
  checkInterval: z.coerce.number().int().min(300).max(86400).optional(),
});

export const updateProductSchema = z.object({
  url: z
    .string()
    .url("Must be a valid URL")
    .refine(isAmazonUrl, "Only Amazon URLs are supported")
    .optional(),
  name: z.string().min(1, "Name is required").optional(),
  isActive: z.boolean().optional(),
  checkInterval: z.coerce.number().int().min(300).max(86400).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
