import {
  Package,
  TrendingUp,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "Tracked Products",
    value: "0",
    description: "Products you&apos;re watching",
    icon: Package,
  },
  {
    title: "Price Changes",
    value: "0",
    description: "Changes in the last 30 days",
    icon: TrendingUp,
  },
  {
    title: "Active Alerts",
    value: "0",
    description: "Price drop alerts configured",
    icon: Bell,
  },
  {
    title: "Checks Today",
    value: "0 / 10",
    description: "Remaining daily checks",
    icon: AlertTriangle,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Price Tracker. Monitor your products and price drops.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Placeholder sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Price Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No price changes recorded yet. Add products to start tracking.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No alerts triggered yet. Configure price drop alerts for your
              products.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}