import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  getAlertById,
  updateAlert,
  deleteAlert,
} from "@/lib/services/alerts";
import { updateAlertSchema } from "@/lib/validators/alerts";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { alertId } = await params;
  const body = await request.json();
  const parsed = updateAlertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const alert = await updateAlert(alertId, session.user.id, parsed.data);

  if (!alert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(alert);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { alertId } = await params;
  const alert = await deleteAlert(alertId, session.user.id);

  if (!alert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}