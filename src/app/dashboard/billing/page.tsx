"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check } from "lucide-react";

interface PlanConfig {
  key: string;
  name: string;
  price: number;
  productsLimit: number;
  checksPerDay: number;
  checkIntervalMinutes: number;
  priceHistoryDays: number;
  cheapestSearch: boolean;
  manualRefreshPerDay: number;
  exportData: boolean;
  apiAccess: boolean;
}

const PLANS: Record<string, PlanConfig> = {
  free: {
    key: "free", name: "Free", price: 0, productsLimit: 5, checksPerDay: 10,
    checkIntervalMinutes: 720, priceHistoryDays: 30, cheapestSearch: false,
    manualRefreshPerDay: 5, exportData: false, apiAccess: false,
  },
  personal: {
    key: "personal", name: "Personal", price: 499, productsLimit: 25, checksPerDay: 100,
    checkIntervalMinutes: 120, priceHistoryDays: 365, cheapestSearch: true,
    manualRefreshPerDay: 50, exportData: true, apiAccess: false,
  },
  pro: {
    key: "pro", name: "Pro", price: 1299, productsLimit: 100, checksPerDay: 500,
    checkIntervalMinutes: 30, priceHistoryDays: 0, cheapestSearch: true,
    manualRefreshPerDay: 0, exportData: true, apiAccess: true,
  },
};

const planOrder = ["free", "personal", "pro"];

export default function BillingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [paddle, setPaddle] = useState<Paddle | undefined>();
  const [activePlan] = useState("free");
  const [loading] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  // Initialize Paddle.js once on mount
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const environment = (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ?? "sandbox") as "sandbox" | "production";
    if (!token) return;

    initializePaddle({
      environment,
      token,
    }).then((p) => {
      if (p) setPaddle(p);
    });
  }, []);

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Checkout failed");
        return;
      }

      const data = await res.json();

      if (!paddle) {
        alert("Payment system not ready. Please try again.");
        return;
      }

      paddle.Checkout.open({
        items: [{ priceId: data.priceId, quantity: 1 }],
        customer: { email: data.customerEmail },
        settings: {
          displayMode: "overlay",
          theme: "light",
          allowLogout: false,
          showAddDiscounts: false,
        },
      });
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and plan.
          {activePlan !== "free" && (
            <span>
              {" "}
              Current plan:{" "}
              <Badge variant="default" className="capitalize">
                {activePlan}
              </Badge>
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {planOrder.map((key) => {
          const plan = PLANS[key];
          const isCurrent = activePlan === key;
          const isFree = key === "free";

          return (
            <Card
              key={key}
              className={`flex flex-col ${isCurrent ? "border-primary ring-1 ring-primary" : ""}`}
            >
              <CardHeader>
                <CardTitle className="capitalize">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">
                    {isFree ? "$0" : `$${(plan.price / 100).toFixed(2)}`}
                  </span>
                  {!isFree && (
                    <span className="text-sm text-muted-foreground">
                      /month
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="flex-1 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {plan.productsLimit} tracked products
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {plan.checksPerDay} checks per day
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {plan.checkIntervalMinutes >= 60
                      ? `Every ${plan.checkIntervalMinutes / 60}h`
                      : `Every ${plan.checkIntervalMinutes}min`}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {plan.priceHistoryDays === 0
                      ? "Unlimited"
                      : `${plan.priceHistoryDays}-day`}{" "}
                    price history
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {plan.cheapestSearch ? "Cheapest-price finder" : "Manual price search"}
                  </li>
                  {plan.exportData && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Export data
                    </li>
                  )}
                  {plan.apiAccess && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      API access
                    </li>
                  )}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : isFree ? (
                    <Button className="w-full" variant="outline" disabled>
                      Downgrade (contact support)
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      disabled={upgrading === key}
                      onClick={() => handleUpgrade(key)}
                    >
                      {upgrading === key ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Upgrade to {plan.name}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}