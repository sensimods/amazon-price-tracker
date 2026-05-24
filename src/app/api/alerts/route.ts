import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  getAlertsByUserId,
  createAlert,
} from "@/lib/services/alerts";
import { getProductById } from "@/lib/services/products";
import { createAlertSchema } from "@/lib/validators/alerts";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userAlerts = await getAlertsByUserId(session.user.id);
  return NextResponse.json(userAlerts);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createAlertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Verify the product belongs to this user
  const product = await getProductById(parsed.data.productId, session.user.id);
  if (!product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 },
    );
  }

  const alert = await createAlert(session.user.id, parsed.data);
  return NextResponse.json(alert, { status: 201 });
}