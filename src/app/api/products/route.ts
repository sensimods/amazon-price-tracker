import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createProduct, getProductById, getProductsByUserId } from "@/lib/services/products";
import { createProductSchema } from "@/lib/validators/products";
import { scrapeProduct } from "@/lib/scraping";
import { db } from "@/lib/db";
import { prices } from "@/lib/db/schema/prices";
import { products } from "@/lib/db/schema/products";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await getProductsByUserId(session.user.id);
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Create the product
  const product = await createProduct(session.user.id, parsed.data);

  // Run an immediate price scrape and return the updated product.
  // This makes the create request take a few seconds, but the user
  // sees the price immediately instead of "—".
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
          lastScrapeError: null,
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id));
    } else {
      const errorMessage = scrapeResult.rawData?.error
        ? String(scrapeResult.rawData.error)
        : "Initial price check could not extract a price.";

      await db
        .update(products)
        .set({
          lastCheckedAt: new Date(),
          lastScrapeError: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id));
    }
  } catch (error) {
    // Scrape failed — product still created, just without price data
    await db
      .update(products)
      .set({
        lastScrapeError:
          error instanceof Error ? error.message : "Scraping failed",
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id));
  }

  // Return the fully updated product
  const updatedProduct = await getProductById(product.id, session.user.id);
  return NextResponse.json(updatedProduct, { status: 201 });
}