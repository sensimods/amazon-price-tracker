import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

/**
 * POST /api/billing/portal
 * Returns the customer portal URL from Paddle.
 * Note: Paddle's customer portal is accessed via Paddle.js:
 *   Paddle.CustomerPortal.open({ subscriptionId })
 *
 * For now, redirect users to the Paddle dashboard URL
 * configured in Paddle Checkout settings.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Paddle customer portal is handled client-side via Paddle.js:
  // Paddle.CustomerPortal.open({
  //   subscriptionId: "sub_01..." // optional, opens portal for specific sub
  // })

  return NextResponse.json({
    message:
      "Customer portal is opened client-side using Paddle.CustomerPortal.open()",
    // The frontend handles this with:
    // Paddle.Initialize({ token: PADDLE_CLIENT_TOKEN })
    // Paddle.CustomerPortal.open({ subscriptionId })
  });
}