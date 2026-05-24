import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getProductById } from "@/lib/services/products";
import {
  findCheaperAlternative,
  toggleCheapestSearch,
} from "@/lib/services/price-comparison";

/**
 * GET /api/products/[productId]/compare
 * Triggers a cheapest-price search and returns the result.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;

  // Verify ownership
  const product = await getProductById(productId, session.user.id);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await findCheaperAlternative(productId, session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Search failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/products/[productId]/compare
 * Toggles the cheapest-search feature on/off.
 * Body: { enabled: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;
  const body = await request.json();

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { error: "enabled must be a boolean" },
      { status: 400 },
    );
  }

  // Verify ownership
  const product = await getProductById(productId, session.user.id);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await toggleCheapestSearch(productId, session.user.id, body.enabled);

  // If enabling, immediately run the search
  if (body.enabled) {
    try {
      const result = await findCheaperAlternative(productId, session.user.id);
      return NextResponse.json({ enabled: true, result });
    } catch {
      return NextResponse.json({ enabled: true, result: null });
    }
  }

  return NextResponse.json({ enabled: false });
}