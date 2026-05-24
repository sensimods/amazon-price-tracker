"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Search, Tag } from "lucide-react";

interface CheaperAlternativeProps {
  productId: string;
  enabled: boolean;
  cheapestPrice: string | null;
  cheapestUrl: string | null;
  cheapestStore: string | null;
  cheapestTitle: string | null;
  currentPrice: string | null;
  currency: string | null;
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

export function CheaperAlternative({
  productId,
  enabled,
  cheapestPrice,
  cheapestUrl,
  cheapestStore,
  cheapestTitle,
  currentPrice,
  currency,
}: CheaperAlternativeProps) {
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<{
    isCheaper: boolean;
    savings: string | null;
  } | null>(null);

  if (!enabled) return null;

  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await fetch(`/api/products/${productId}/compare`);
      const data = await res.json();
      setResult(data);
      router.refresh();
    } finally {
      setSearching(false);
    }
  };

  // Show existing result from DB
  if (cheapestPrice && cheapestUrl) {
    const current = currentPrice ? parseFloat(currentPrice) : null;
    const cheapest = parseFloat(cheapestPrice);
    const isCheaper = current !== null && !isNaN(cheapest) && cheapest < current;
    const savings =
      current !== null && isCheaper
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency ?? "USD",
          }).format(current - cheapest)
        : null;

    return (
      <Card className={isCheaper ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/10" : ""}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">
                  {isCheaper ? "Cheaper option found!" : "Price checked on eBay"}
                </span>
                <Badge variant="secondary" className="text-xs capitalize">
                  {cheapestStore}
                </Badge>
              </div>
              {cheapestTitle && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {cheapestTitle}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3">
                <span className="text-lg font-bold text-green-600">
                  {formatPrice(cheapestPrice, currency)}
                </span>
                {currentPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(currentPrice, currency)}
                  </span>
                )}
              </div>
              {savings && (
                <p className="mt-1 text-sm font-medium text-green-600">
                  Save {savings}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <a href={cheapestUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                View Deal
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No result yet — show search button
  if (!cheapestPrice && !result) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSearch}
          disabled={searching}
        >
          {searching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          {searching ? "Searching..." : "Find cheaper alternatives"}
        </Button>
      </div>
    );
  }

  // Show real-time search result
  if (result) {
    return (
      <Card
        className={
          result.isCheaper
            ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/10"
            : ""
        }
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-green-500" />
            {result.isCheaper ? (
              <span className="text-sm font-medium text-green-600">
                Cheaper option available! Save {result.savings}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                No cheaper alternative found at this time.
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Search again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}