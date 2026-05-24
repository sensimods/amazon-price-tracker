import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  name: text("name"),
  store: text("store"),
  imageUrl: text("image_url"),
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  isActive: boolean("is_active").default(true),
  checkInterval: integer("check_interval").default(3600),
  lastCheckedAt: timestamp("last_checked_at", { mode: "date" }),
  lastScrapeError: text("last_scrape_error"),
  cheapestSearchEnabled: boolean("cheapest_search_enabled").default(false),
  cheapestPrice: numeric("cheapest_price", { precision: 10, scale: 2 }),
  cheapestUrl: text("cheapest_url"),
  cheapestStore: text("cheapest_store"),
  cheapestTitle: text("cheapest_title"),
  cheapestCheckedAt: timestamp("cheapest_checked_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;