"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
} from "recharts";

interface PricePoint {
  price: string;
  scrapedAt: Date | string;
  currency?: string | null;
}

interface PriceChartProps {
  data: PricePoint[];
  currency?: string | null;
}

function formatDate(dateStr: string | Date) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTooltipDate(dateStr: string | Date) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload as PricePoint & { displayPrice: string };
  return (
    <div className="rounded-md border bg-background p-3 shadow-md">
      <p className="text-xs text-muted-foreground">
        {formatTooltipDate(data.scrapedAt)}
      </p>
      <p className="text-lg font-bold">{data.displayPrice}</p>
    </div>
  );
}

export function PriceChart({ data, currency }: PriceChartProps) {
  const chartData = useMemo(() => {
    return [...data]
      .reverse() // chronological order (oldest → newest)
      .map((point) => {
        const price = parseFloat(point.price);
        const displayPrice = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: point.currency ?? currency ?? "USD",
        }).format(price);

        return {
          scrapedAt: point.scrapedAt,
          price,
          displayPrice,
        };
      });
  }, [data, currency]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No price history yet
      </div>
    );
  }

  const prices = chartData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const yMin = Math.max(0, minPrice - priceRange * 0.1);
  const yMax = maxPrice + priceRange * 0.1;

  const formatYAxis = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
          <XAxis
            dataKey="scrapedAt"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3, className: "fill-primary" }}
            activeDot={{ r: 5, className: "fill-primary" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}