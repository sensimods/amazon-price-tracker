import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getProductById } from "@/lib/services/products";
import { scrapeProduct } from "@/lib/scraping";
import { db } from "@/lib/db";
import { prices } from "@/lib/db/schema/prices";
import { products } from "@/lib/db/schema/products";
import { eq } from "drizzle-orm";
import { z } from "zod";

const scrapeRequestSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = scrapeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { productId } = parsed.data;

  // Verify the product belongs to the current user
  const product = await getProductById(productId, session.user.id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    // Run the scraper
    const result = await scrapeProduct({
      productId,
      url: product.url,
      store: product.store,
    });

    // Store the price in the database
    if (result.price !== null) {
      await db.insert(prices).values({
        productId,
        price: String(result.price),
        currency: result.currency,
        isAvailable: result.isAvailable,
        rawData: result.rawData,
      });

      // Update the product's current price and last checked timestamp
      await db
        .update(products)
        .set({
          currentPrice: String(result.price),
          lastCheckedAt: new Date(),
          lastScrapeError: null, // Clear any previous error
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));
    } else {
      // Price extraction failed — store the error
      const errorMessage = result.rawData?.error
        ? String(result.rawData.error)
        : "Price extraction returned no result. The store may have blocked the request or the page structure may have changed.";

      await db
        .update(products)
        .set({
          lastCheckedAt: new Date(),
          lastScrapeError: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));
    }

    // Re-fetch the updated product to return fresh state
    const updatedProduct = await getProductById(productId, session.user.id);

    return NextResponse.json({
      success: true,
      productId,
      result,
      product: updatedProduct,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error during scraping";

    await db
      .update(products)
      .set({
        lastScrapeError: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    return NextResponse.json(
      {
        success: false,
        error: "Scraping failed",
        message: errorMessage,
        productId,
      },
      { status: 500 },
    );
  }
}