import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, TrendingDown, Bell, Zap } from "lucide-react";

const features = [
  {
    title: "Track Any Product",
    description:
      "Add any product URL and we'll automatically track its price over time. Supports Amazon, Best Buy, Walmart, and more.",
    icon: Activity,
  },
  {
    title: "Price Drop Alerts",
    description:
      "Set target prices and get notified when prices drop. Never miss a deal again.",
    icon: Bell,
  },
  {
    title: "Price History Charts",
    description:
      "Visualize price trends with interactive charts. See the best time to buy.",
    icon: TrendingDown,
  },
  {
    title: "Automated Checking",
    description:
      "Prices are checked automatically on a schedule. No manual refresh needed.",
    icon: Zap,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Activity className="h-5 w-5 text-primary" />
            <span>Price Tracker</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1">
        <div className="container mx-auto px-4 py-20 text-center lg:py-32">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Track Prices.
            <br />
            <span className="text-primary">Save Money.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Monitor product prices across multiple stores, get alerted on price
            drops, and make informed purchasing decisions.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">Start Tracking Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/50 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Everything you need to track prices
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            A simple, powerful tool to monitor product prices and save money.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-lg border bg-background p-6"
                >
                  <Icon className="h-8 w-8 text-primary" />
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Price Tracker SaaS &mdash; Built with Next.js
        </div>
      </footer>
    </div>
  );
}