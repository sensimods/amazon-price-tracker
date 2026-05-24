import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema/subscriptions";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  CreditCard,
  Bell,
  Activity,
  ExternalLink,
} from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  const sub = session?.user?.id
    ? await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, session.user.id))
        .then((rows) => rows[0])
    : null;

  const plan = sub?.plan ?? "free";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and subscription preferences.
        </p>
      </div>

      {/* Account Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">
                {session?.user?.name ?? "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {session?.user?.email ?? "Not set"}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Account settings and profile management coming soon.
          </p>
        </CardContent>
      </Card>

      {/* Subscription Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Current plan:</p>
            <Badge variant="default" className="capitalize">
              {plan}
            </Badge>
          </div>

          {plan === "free" ? (
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm">
                You&apos;re on the <strong>Free</strong> plan. Upgrade to unlock
                more products, faster checks, and the cheapest-price finder.
              </p>
              <Button size="sm" className="mt-3" asChild>
                <Link href="/dashboard/billing">View Plans</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm">
                You&apos;re on the <strong className="capitalize">{plan}</strong> plan.
                Manage your subscription in the Paddle customer portal.
              </p>
              <Button size="sm" variant="outline" className="mt-3" asChild>
                <a
                  href="https://sandbox-checkout.paddle.com/subscriptions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Manage Subscription
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Email notifications for price drop alerts are configured per product
            in the alerts section.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/alerts">Manage Alerts</Link>
          </Button>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Price Tracker v0.1 &mdash; Amazon Price Tracker SaaS</p>
          <p>Tracks product prices on Amazon and finds cheaper alternatives.</p>
        </CardContent>
      </Card>
    </div>
  );
}