import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPriceId } from "@/lib/billing/plans";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema/subscriptions";
import { eq } from "drizzle-orm";
import { z } from "zod";

const checkoutSchema = z.object({
  plan: z.enum(["personal", "pro"]),
});

async function getCheckoutData(plan: string, session: { user: { id: string; email: string } }) {
  const parsed = checkoutSchema.safeParse({ plan });
  if (!parsed.success) {
    return { error: "Invalid plan. Choose 'personal' or 'pro'.", status: 400 };
  }

  const priceId = getPriceId(parsed.data.plan);
  if (!priceId) {
    return { error: "Pricing not configured. Contact support.", status: 501 };
  }

  // Find or create a local subscription record
  let sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .then((rows) => rows[0]);

  if (!sub) {
    sub = await db
      .insert(subscriptions)
      .values({
        userId: session.user.id,
        plan: plan,
      })
      .returning()
      .then((rows) => rows[0]);
  }

  return {
    priceId,
    customerEmail: session.user.email,
    customerId: session.user.id,
    plan,
  };
}

/**
 * GET /api/billing/checkout?plan=personal
 * Returns checkout configuration for the given plan.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = request.nextUrl.searchParams.get("plan") ?? "";
  const data = await getCheckoutData(plan, session as { user: { id: string; email: string } });
  
  if ("error" in data) {
    return NextResponse.json({ error: data.error }, { status: data.status });
  }

  return NextResponse.json(data);
}

/**
 * POST /api/billing/checkout
 * Generates a Paddle checkout configuration for the given plan.
 * Body: { plan: "personal" | "pro" }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = await getCheckoutData(body.plan, session as { user: { id: string; email: string } });

  if ("error" in data) {
    return NextResponse.json({ error: data.error }, { status: data.status });
  }

  return NextResponse.json(data);
}