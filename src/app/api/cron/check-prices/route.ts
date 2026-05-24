import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema/products";
import { prices } from "@/lib/db/schema/prices";
import { eq } from "drizzle-orm";
import { scrapeProduct } from "@/lib/scraping";

/**
 * Simple cron endpoint to check all active product prices.
 * Can be called by:
 *   - Vercel Cron Jobs (config in vercel.json)
 *   - External cron service
 *   - curl for manual testing
 *
 * Protected by CRON_SECRET for non-Vercel environments.
 */

export async function GET(request: NextRequest) {
  // Verify cron secret in non-Vercel environments
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const expected = `Bearer ${cronSecret}`;
    const querySecret = request.nextUrl.searchParams.get("secret");

    if (authHeader !== expected && querySecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Fetch all active products
  const activeProducts = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true));

  if (activeProducts.length === 0) {
    return NextResponse.json({
      checked: 0,
      errors: 0,
      total: 0,
      message: "No active products to check",
    });
  }

  const results: Array<{
    productId: string;
    productName: string | null;
    price: number | null;
    error?: string;
  }> = [];

  for (const product of activeProducts) {
    try {
      const scrapeResult = await scrapeProduct({
        productId: product.id,
        url: product.url,
        store: product.store,
      });

      if (scrapeResult.price !== null) {
        await db.insert(prices).values({
          productId: product.id,
          price: String(scrapeResult.price),
          currency: scrapeResult.currency,
          isAvailable: scrapeResult.isAvailable,
          rawData: scrapeResult.rawData,
        });

        await db
          .update(products)
          .set({
            currentPrice: String(scrapeResult.price),
            lastCheckedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));
      } else {
        await db
          .update(products)
          .set({
            lastCheckedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));
      }

      results.push({
        productId: product.id,
        productName: product.name,
        price: scrapeResult.price,
      });
    } catch (error) {
      results.push({
        productId: product.id,
        productName: product.name,
        price: null,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const successful = results.filter((r) => r.price !== null).length;
  const errors = results.filter((r) => r.error).length;

  return NextResponse.json({
    checked: successful,
    errors,
    total: activeProducts.length,
    results,
  });
}