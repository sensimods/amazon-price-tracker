import { boolean, jsonb, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { products } from "./products";

export const prices = pgTable("prices", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  isAvailable: boolean("is_available").default(true),
  rawData: jsonb("raw_data"),
  scrapedAt: timestamp("scraped_at", { mode: "date" }).defaultNow().notNull(),
});

export type Price = typeof prices.$inferSelect;
export type NewPrice = typeof prices.$inferInsert;