"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Loader2, Bell, BellOff } from "lucide-react";
import Link from "next/link";

interface AlertWithProduct {
  alert: {
    id: string;
    productId: string;
    targetPrice: string;
    condition: string | null;
    isActive: boolean | null;
    lastTriggered: Date | string | null;
    createdAt: Date | string;
  };
  product: {
    id: string;
    name: string | null;
    url: string;
    currentPrice: string | null;
    currency: string | null;
    store: string | null;
  };
}

interface AlertCardProps {
  data: AlertWithProduct;
}

function formatPrice(price: string | null, currency: string | null) {
  if (!price) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
    }).format(Number(price));
  } catch {
    return `$${price}`;
  }
}

export function AlertCard({ data }: AlertCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const { alert, product } = data;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/alerts/${alert.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      await fetch(`/api/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !alert.isActive }),
      });
      router.refresh();
    } finally {
      setToggling(false);
    }
  };

  const conditionLabel =
    alert.condition === "below" ? "Drops below" : "Goes above";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium">
              <Link
                href={`/dashboard/products/${product.id}`}
                className="hover:underline"
              >
                {product.name ?? "Unnamed Product"}
              </Link>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {conditionLabel}{" "}
              <span className="font-medium">
                {formatPrice(alert.targetPrice, product.currency)}
              </span>
            </p>
          </div>
          <Badge
            variant={alert.isActive ? "default" : "secondary"}
            className="ml-2 shrink-0"
          >
            {alert.isActive ? "Active" : "Paused"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              Current:{" "}
              <span className="font-medium text-foreground">
                {formatPrice(product.currentPrice, product.currency)}
              </span>
            </p>
            {alert.lastTriggered && (
              <p>
                Last triggered:{" "}
                {formatDistanceToNow(new Date(alert.lastTriggered), {
                  addSuffix: true,
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggle}
              disabled={toggling}
            >
              {toggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : alert.isActive ? (
                <BellOff className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              <span className="sr-only">
                {alert.isActive ? "Pause" : "Activate"}
              </span>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Delete</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Alert</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this alert?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleting(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleting}
                    onClick={handleDelete}
                  >
                    {deleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}