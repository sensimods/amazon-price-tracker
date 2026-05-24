"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, AlertCircle } from "lucide-react";

interface RefreshPriceButtonProps {
  productId: string;
}

export function RefreshPriceButton({ productId }: RefreshPriceButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Scrape failed");
      } else if (!data.result?.price) {
        setError(
          "Could not extract a price. The store may be blocking the request.",
        );
      }

      router.refresh();
    } catch {
      setError("Network error — could not reach the scraper");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {loading ? "Checking..." : "Refresh Price"}
      </Button>
      {error && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          <span className="max-w-[250px] truncate">{error}</span>
        </div>
      )}
    </div>
  );
}