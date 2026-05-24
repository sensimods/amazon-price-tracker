import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { getAlertsByUserId } from "@/lib/services/alerts";
import { AlertCard } from "@/components/alerts/alert-card";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";

export default async function AlertsPage() {
  const session = await auth();
  const userAlerts = session?.user?.id
    ? await getAlertsByUserId(session.user.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">
            Manage your price drop alerts.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products">
            <Plus className="mr-2 h-4 w-4" />
            New Alert
          </Link>
        </Button>
      </div>

      {userAlerts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Bell className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No alerts configured yet.
          </p>
          <Button asChild>
            <Link href="/dashboard/products">
              Browse products to add alerts
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {userAlerts.map((item) => (
            <AlertCard key={item.alert.id} data={item} />
          ))}
        </div>
      )}
    </div>
  );
}