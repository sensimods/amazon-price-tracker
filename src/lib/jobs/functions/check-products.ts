import { inngest } from "@/lib/jobs/inngest";
import { cron } from "inngest";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema/products";
import { prices } from "@/lib/db/schema/prices";
import { eq, and } from "drizzle-orm";
import { scrapeProduct } from "@/lib/scraping";

export const checkProductPrices = inngest.createFunction(
  {
    id: "check-product-prices",
    name: "Check Product Prices",
    concurrency: 5,
    triggers: [cron("0 */2 * * *")],
  },
  async ({ step }) => {
    // Fetch all active products
    const activeProducts = await step.run("fetch-active-products", async () => {
      return db
        .select()
        .from(products)
        .where(eq(products.isActive, true));
    });

    if (activeProducts.length === 0) {
      return { checked: 0, message: "No active products to check" };
    }

    let checked = 0;
    let errors = 0;

    // Check each product
    for (const product of activeProducts) {
      const result = await step.run(
        `scrape-product-${product.id}`,
        async () => {
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
            // Still update lastCheckedAt
            await db
              .update(products)
              .set({
                lastCheckedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(products.id, product.id));
          }

          return scrapeResult;
        },
      );

      if (result.price !== null) {
        checked++;
      } else {
        errors++;
      }
    }

    return {
      checked,
      errors,
      total: activeProducts.length,
    };
  },
);