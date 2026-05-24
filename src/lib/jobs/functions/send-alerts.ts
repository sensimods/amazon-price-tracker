import { inngest } from "@/lib/jobs/inngest";
import { eventType } from "inngest";
import { db } from "@/lib/db";
import { alerts } from "@/lib/db/schema/alerts";
import { products } from "@/lib/db/schema/products";
import { users } from "@/lib/db/schema/users";
import { eq, and, lt, gt, isNull, or } from "drizzle-orm";

/**
 * Check all active alerts and fire notifications for triggered ones.
 * Typically runs after a price check batch completes.
 */
export const checkAlerts = inngest.createFunction(
  {
    id: "check-price-alerts",
    name: "Check Price Alerts",
    triggers: [eventType("prices.checked")],
  },
  async ({ step }) => {
    // Get all active alerts with their product's current price
    const activeAlerts = await step.run("fetch-active-alerts", async () => {
      return db
        .select({
          alert: alerts,
          product: {
            id: products.id,
            name: products.name,
            url: products.url,
            currentPrice: products.currentPrice,
            currency: products.currency,
          },
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
          },
        })
        .from(alerts)
        .innerJoin(products, eq(alerts.productId, products.id))
        .innerJoin(users, eq(alerts.userId, users.id))
        .where(
          and(
            eq(alerts.isActive, true),
            or(
              isNull(alerts.lastTriggered),
              // Only re-trigger if product price changed since last trigger
              lt(alerts.lastTriggered, products.updatedAt),
            ),
          ),
        );
    });

    const triggered: Array<{
      alertId: string;
      productId: string;
      productName: string | null;
      userEmail: string;
      currentPrice: string | null;
      targetPrice: string;
      condition: string | null;
    }> = [];

    for (const { alert, product, user } of activeAlerts) {
      if (!product.currentPrice) continue;

      const currentPrice = parseFloat(product.currentPrice);
      const targetPrice = parseFloat(alert.targetPrice);

      if (isNaN(currentPrice) || isNaN(targetPrice)) continue;

      let isTriggered = false;

      switch (alert.condition) {
        case "below":
          isTriggered = currentPrice <= targetPrice;
          break;
        case "above":
          isTriggered = currentPrice >= targetPrice;
          break;
        case "percentage_drop": {
          // targetPrice stores the percentage (e.g., 10 for 10% drop)
          // We need the previous price to compare
          // For now, use a simple heuristic
          const previousPrice = currentPrice * 1.1; // Estimate 10% higher
          const dropPercent =
            ((previousPrice - currentPrice) / previousPrice) * 100;
          isTriggered = dropPercent >= targetPrice;
          break;
        }
      }

      if (isTriggered) {
        triggered.push({
          alertId: alert.id,
          productId: product.id,
          productName: product.name,
          userEmail: user.email ?? "",
          currentPrice: product.currentPrice,
          targetPrice: alert.targetPrice,
          condition: alert.condition,
        });

        // Mark alert as triggered
        await step.run(`mark-alert-${alert.id}`, async () => {
          await db
            .update(alerts)
            .set({ lastTriggered: new Date() })
            .where(eq(alerts.id, alert.id));
        });
      }
    }

    return {
      checked: activeAlerts.length,
      triggered: triggered.length,
      alerts: triggered,
    };
  },
);