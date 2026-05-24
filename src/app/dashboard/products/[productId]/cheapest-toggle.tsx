"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign } from "lucide-react";

interface CheapestToggleProps {
  productId: string;
  enabled: boolean;
}

export function CheapestToggle({ productId, enabled }: CheapestToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/compare`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: checked }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="cheapest-search"
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={loading}
      />
      <Label htmlFor="cheapest-search" className="flex items-center gap-1.5 text-sm cursor-pointer">
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <DollarSign className="h-3.5 w-3.5 text-green-500" />
        )}
        Auto-find cheapest price
      </Label>
    </div>
  );
}