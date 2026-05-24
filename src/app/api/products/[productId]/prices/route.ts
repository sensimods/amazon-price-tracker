import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getProductById } from "@/lib/services/products";
import { getPriceHistory, getPriceStats } from "@/lib/services/prices";
import { getPriceHistoryForUser } from "@/lib/services/prices";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const includeStats = searchParams.get("stats") === "true";

  // Verify ownership
  const product = await getProductById(productId, session.user.id);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const history = await getPriceHistory(productId);

  if (includeStats) {
    const stats = await getPriceStats(productId);
    return NextResponse.json({ history, stats });
  }

  return NextResponse.json(history);
}