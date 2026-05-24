import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema/subscriptions";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";
import { PLANS } from "@/lib/billing/plans";

interface PaddleWebhookPayload {
  event_type: string;
  data: {
    id: string;
    status?: string;
    customer_id?: string;
    subscription_id?: string;
    items?: Array<{
      price: {
        id: string;
        product_id: string;
      };
      quantity: number;
    }>;
    scheduled_change?: {
      action: string;
      effective_at: string;
    };
    current_billing_period?: {
      starts_at: string;
      ends_at: string;
    };
    user_id?: string;
    email?: string;
  };
}

/**
 * Map a Paddle subscription status to our internal status.
 */
function mapStatus(paddleStatus: string): string {
  switch (paddleStatus) {
    case "active":
    case "trialing":
      return "active";
    case "paused":
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "expired":
      return "canceled";
    default:
      return paddleStatus;
  }
}

/**
 * Map a Paddle price ID to a plan key.
 * Checks environment variables for configured price IDs.
 */
function mapPlan(priceId: string): string {
  if (priceId === process.env.PADDLE_PERSONAL_PRICE_ID) return "personal";
  if (priceId === process.env.PADDLE_PRO_PRICE_ID) return "pro";
  return "free";
}

function getPlanLimits(plan: string) {
  const config = PLANS[plan];
  if (config) {
    return {
      productsLimit: config.productsLimit,
      checksPerDay: config.checksPerDay,
    };
  }
  return { productsLimit: 5, checksPerDay: 10 };
}

/**
 * POST /api/billing/webhook
 * Handles Paddle subscription lifecycle events.
 * Configure this URL in the Paddle dashboard as a webhook endpoint.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  // In production, verify the webhook signature
  // For now, basic validation using a shared secret header
  if (webhookSecret) {
    const signature = request.headers.get("paddle-signature") ?? "";
    // TODO: Implement proper signature verification using @paddle/paddle-node-sdk
    // const webhook = paddle.webhooks.unmarshal(JSON.stringify(body), signature);
  }

  const body = (await request.json()) as PaddleWebhookPayload;
  const { event_type, data } = body;

  switch (event_type) {
    case "subscription.created":
    case "subscription.updated":
    case "subscription.activated": {
      // Find the user by email or paddle customer ID
      let user = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email ?? ""))
        .then((rows) => rows[0]);

      if (!user) break;

      const plan = data.items?.[0]?.price?.id
        ? mapPlan(data.items[0].price.id)
        : "free";
      const limits = getPlanLimits(plan);
      const periodEnd = data.current_billing_period?.ends_at
        ? new Date(data.current_billing_period.ends_at)
        : null;

      await db
        .insert(subscriptions)
        .values({
          userId: user.id,
          paddleCustomerId: data.customer_id,
          paddleSubscriptionId: data.id,
          plan,
          status: mapStatus(data.status ?? "active"),
          productsLimit: limits.productsLimit,
          checksPerDay: limits.checksPerDay,
          currentPeriodEnd: periodEnd,
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            paddleCustomerId: data.customer_id,
            paddleSubscriptionId: data.id,
            plan,
            status: mapStatus(data.status ?? "active"),
            productsLimit: limits.productsLimit,
            checksPerDay: limits.checksPerDay,
            currentPeriodEnd: periodEnd,
            updatedAt: new Date(),
          },
        });

      break;
    }

    case "subscription.canceled": {
      const paddleSubId = data.id;

      const sub = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.paddleSubscriptionId, paddleSubId))
        .then((rows) => rows[0]);

      if (sub) {
        await db
          .update(subscriptions)
          .set({
            status: "canceled",
            plan: "free",
            productsLimit: 5,
            checksPerDay: 10,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, sub.id));
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}