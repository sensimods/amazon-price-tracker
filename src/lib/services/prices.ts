import { db } from "@/lib/db";
import { prices } from "@/lib/db/schema/prices";
import { products } from "@/lib/db/schema/products";
import { eq, desc, and, inArray } from "drizzle-orm";

export function getPriceHistory(productId: string, limit = 50) {
  return db
    .select()
    .from(prices)
    .where(eq(prices.productId, productId))
    .orderBy(desc(prices.scrapedAt))
    .limit(limit);
}

export async function getPriceHistoryForUser(
  userId: string,
  limit = 100,
) {
  const userProducts = await db
    .select({ id: products.id, name: products.name, url: products.url })
    .from(products)
    .where(eq(products.userId, userId));

  if (userProducts.length === 0) return [];

  const productIds = userProducts.map((p) => p.id);

  const priceRecords = await db
    .select()
    .from(prices)
    .where(inArray(prices.productId, productIds))
    .orderBy(desc(prices.scrapedAt))
    .limit(limit);

  // Attach product name to each price record
  const productMap = new Map(userProducts.map((p) => [p.id, p]));
  return priceRecords.map((record) => ({
    ...record,
    productName: productMap.get(record.productId)?.name ?? "Unknown",
    productUrl: productMap.get(record.productId)?.url ?? "",
  }));
}

export function getLatestPrice(productId: string) {
  return db
    .select()
    .from(prices)
    .where(eq(prices.productId, productId))
    .orderBy(desc(prices.scrapedAt))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export async function getPriceStats(productId: string) {
  const history = await db
    .select()
    .from(prices)
    .where(eq(prices.productId, productId))
    .orderBy(desc(prices.scrapedAt));

  if (history.length === 0) return null;

  const numericPrices = history
    .map((p) => parseFloat(p.price))
    .filter((p) => !isNaN(p));

  return {
    lowest: Math.min(...numericPrices),
    highest: Math.max(...numericPrices),
    average:
      numericPrices.reduce((a, b) => a + b, 0) / numericPrices.length,
    count: history.length,
    firstChecked: history[history.length - 1].scrapedAt,
    lastChecked: history[0].scrapedAt,
  };
}