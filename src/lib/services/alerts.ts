import { db } from "@/lib/db";
import { alerts } from "@/lib/db/schema/alerts";
import { products } from "@/lib/db/schema/products";
import { eq, and, desc } from "drizzle-orm";
import type { CreateAlertInput, UpdateAlertInput } from "@/lib/validators/alerts";

export function getAlertsByUserId(userId: string) {
  return db
    .select({
      alert: alerts,
      product: {
        id: products.id,
        name: products.name,
        url: products.url,
        currentPrice: products.currentPrice,
        currency: products.currency,
        store: products.store,
      },
    })
    .from(alerts)
    .innerJoin(products, eq(alerts.productId, products.id))
    .where(eq(alerts.userId, userId))
    .orderBy(desc(alerts.createdAt));
}

export function getAlertsByProductId(productId: string, userId: string) {
  return db
    .select()
    .from(alerts)
    .where(
      and(eq(alerts.productId, productId), eq(alerts.userId, userId)),
    )
    .orderBy(desc(alerts.createdAt));
}

export function getAlertById(id: string, userId: string) {
  return db
    .select()
    .from(alerts)
    .where(and(eq(alerts.id, id), eq(alerts.userId, userId)))
    .then((rows) => rows[0] ?? null);
}

export function createAlert(userId: string, input: CreateAlertInput) {
  return db
    .insert(alerts)
    .values({
      userId,
      productId: input.productId,
      targetPrice: String(input.targetPrice),
      condition: input.condition ?? "below",
    })
    .returning()
    .then((rows) => rows[0]);
}

export function updateAlert(
  id: string,
  userId: string,
  input: UpdateAlertInput,
) {
  return db
    .update(alerts)
    .set({
      ...input,
      targetPrice: input.targetPrice ? String(input.targetPrice) : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(alerts.id, id), eq(alerts.userId, userId)))
    .returning()
    .then((rows) => rows[0] ?? null);
}

export function deleteAlert(id: string, userId: string) {
  return db
    .delete(alerts)
    .where(and(eq(alerts.id, id), eq(alerts.userId, userId)))
    .returning()
    .then((rows) => rows[0] ?? null);
}