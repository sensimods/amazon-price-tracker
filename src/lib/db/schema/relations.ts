import { relations } from "drizzle-orm";
import { alerts } from "./alerts";
import { prices } from "./prices";
import { products } from "./products";
import { subscriptions } from "./subscriptions";
import { users } from "./users";

// ── User relations ──────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  alerts: many(alerts),
  subscriptions: many(subscriptions),
}));

// ── Product relations ───────────────────────────────────────────────────────
export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
  prices: many(prices),
  alerts: many(alerts),
}));

// ── Price relations ─────────────────────────────────────────────────────────
export const pricesRelations = relations(prices, ({ one }) => ({
  product: one(products, {
    fields: [prices.productId],
    references: [products.id],
  }),
}));

// ── Alert relations ─────────────────────────────────────────────────────────
export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [alerts.productId],
    references: [products.id],
  }),
}));

// ── Subscription relations ──────────────────────────────────────────────────
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));
