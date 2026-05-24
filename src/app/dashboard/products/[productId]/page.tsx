import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { getProductById } from "@/lib/services/products";
import { getPriceHistory, getPriceStats } from "@/lib/services/prices";
import { getAlertsByProductId } from "@/lib/services/alerts";
import { AlertCard } from "@/components/alerts/alert-card";
import { AlertForm } from "@/components/alerts/alert-form";
import { PriceChart } from "@/components/prices/price-chart";
import { PriceTable } from "@/components/prices/price-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, ExternalLink, RefreshCw, ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import { RefreshPriceButton } from "./refresh-button";
import { CheapestToggle } from "./cheapest-toggle";
import { CheaperAlternative } from "./cheaper-alternative";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
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

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const session = await auth();
  const { productId } = await params;

  const product =
    session?.user?.id
      ? await getProductById(productId, session.user.id)
      : null;

  if (!product) {
    notFound();
  }

  const priceHistory = session?.user?.id
    ? await getPriceHistory(productId, 100)
    : [];

  const stats = session?.user?.id
    ? await getPriceStats(productId)
    : null;

  const productAlerts = session?.user?.id
    ? await getAlertsByProductId(productId, session.user.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/dashboard/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
            {product.name ?? "Unnamed Product"}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {product.url}
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <RefreshPriceButton productId={product.id} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={product.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">View on Store</span>
              </a>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/dashboard/products/${product.id}/edit`}>
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Cheapest price toggle */}
      <div className="flex flex-wrap items-center gap-4">
        <CheapestToggle
          productId={product.id}
          enabled={product.cheapestSearchEnabled ?? false}
        />
      </div>

      {/* Cheaper alternative card */}
      <CheaperAlternative
        productId={product.id}
        enabled={product.cheapestSearchEnabled ?? false}
        cheapestPrice={product.cheapestPrice}
        cheapestUrl={product.cheapestUrl}
        cheapestStore={product.cheapestStore}
        cheapestTitle={product.cheapestTitle}
        currentPrice={product.currentPrice}
        currency={product.currency}
      />

      {/* Stats cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatPrice(product.currentPrice, product.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Store
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="capitalize">
              {product.store ?? "Unknown"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge variant={product.isActive ? "default" : "secondary"}>
              {product.isActive ? "Active" : "Paused"}
            </Badge>
            {product.lastScrapeError && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                <span className="max-w-[200px] truncate" title={product.lastScrapeError}>
                  {product.lastScrapeError}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.count ?? 0}</div>
          </CardContent>
        </Card>

        {stats && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  <TrendingDown className="h-3 w-3 text-green-500" />
                  Lowest Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">
                  {formatPrice(String(stats.lowest), product.currency)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-red-500" />
                  Highest Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600">
                  {formatPrice(String(stats.highest), product.currency)}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
        </CardHeader>
        <CardContent>
          <PriceChart data={priceHistory} currency={product.currency} />
        </CardContent>
      </Card>

      {/* Price Table + Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceTable data={priceHistory} limit={10} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts ({productAlerts.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {productAlerts.length > 0 ? (
              <div className="space-y-3">
                {productAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    data={{
                      alert: {
                        id: alert.id,
                        productId: alert.productId,
                        targetPrice: alert.targetPrice,
                        condition: alert.condition,
                        isActive: alert.isActive,
                        lastTriggered: alert.lastTriggered,
                        createdAt: alert.createdAt,
                      },
                      product: {
                        id: product.id,
                        name: product.name,
                        url: product.url,
                        currentPrice: product.currentPrice,
                        currency: product.currency,
                        store: product.store,
                      },
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No alerts configured for this product.
              </p>
            )}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">
                Add alert
              </summary>
              <div className="mt-3">
                <AlertForm productId={product.id} />
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}