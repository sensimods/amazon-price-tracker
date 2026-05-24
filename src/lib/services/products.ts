import { db } from "@/lib/db";
import { products } from "@/lib/db/schema/products";
import { eq, desc, and } from "drizzle-orm";
import type { CreateProductInput, UpdateProductInput } from "@/lib/validators/products";

export function getProductById(id: string, userId: string) {
  return db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.userId, userId)))
    .then((rows) => rows[0] ?? null);
}

export function getProductsByUserId(userId: string) {
  return db
    .select()
    .from(products)
    .where(eq(products.userId, userId))
    .orderBy(desc(products.createdAt));
}

export function createProduct(userId: string, input: CreateProductInput) {
  return db
    .insert(products)
    .values({
      userId,
      url: input.url,
      name: input.name ?? null,
      store: "amazon",
      checkInterval: input.checkInterval ?? 3600,
    })
    .returning()
    .then((rows) => rows[0]);
}

export function updateProduct(id: string, userId: string, input: UpdateProductInput) {
  return db
    .update(products)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, id), eq(products.userId, userId)))
    .returning()
    .then((rows) => rows[0] ?? null);
}

export function deleteProduct(id: string, userId: string) {
  return db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.userId, userId)))
    .returning()
    .then((rows) => rows[0] ?? null);
}
