/**
 * Plan definitions for Price Tracker SaaS.
 *
 * To activate billing:
 * 1. Create products and prices in the Paddle dashboard (sandbox or live)
 * 2. Set PADDLE_PERSONAL_PRICE_ID and PADDLE_PRO_PRICE_ID in .env.local
 * 3. Ensure paddleSubscriptionId fields reference actual Paddle price IDs
 */

export interface PlanConfig {
  key: "free" | "personal" | "pro";
  name: string;
  price: number;
  currency: string;
  productsLimit: number;
  checksPerDay: number;
  checkIntervalMinutes: number;
  priceHistoryDays: number;
  cheapestSearch: boolean;
  manualRefreshPerDay: number;
  exportData: boolean;
  apiAccess: boolean;
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    key: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    productsLimit: 5,
    checksPerDay: 10,
    checkIntervalMinutes: 720, // every 12h
    priceHistoryDays: 30,
    cheapestSearch: false,
    manualRefreshPerDay: 5,
    exportData: false,
    apiAccess: false,
  },
  personal: {
    key: "personal",
    name: "Personal",
    price: 499, // $4.99 in cents
    currency: "USD",
    productsLimit: 25,
    checksPerDay: 100,
    checkIntervalMinutes: 120, // every 2h
    priceHistoryDays: 365,
    cheapestSearch: true,
    manualRefreshPerDay: 50,
    exportData: true,
    apiAccess: false,
  },
  pro: {
    key: "pro",
    name: "Pro",
    price: 1299, // $12.99 in cents
    currency: "USD",
    productsLimit: 100,
    checksPerDay: 500,
    checkIntervalMinutes: 30,
    priceHistoryDays: 0, // unlimited
    cheapestSearch: true,
    manualRefreshPerDay: 0, // unlimited
    exportData: true,
    apiAccess: true,
  },
};

/**
 * Get the Paddle price ID for a plan from environment variables.
 */
export function getPriceId(plan: string): string | null {
  switch (plan) {
    case "personal":
      return process.env.PADDLE_PERSONAL_PRICE_ID ?? null;
    case "pro":
      return process.env.PADDLE_PRO_PRICE_ID ?? null;
    default:
      return null;
  }
}

/**
 * Get the minimum allowed check interval in seconds for a given plan.
 */
export function getMinCheckInterval(plan: string): number {
  const config = PLANS[plan];
  if (!config) return 43200; // Free default: every 12h
  return config.checkIntervalMinutes * 60;
}