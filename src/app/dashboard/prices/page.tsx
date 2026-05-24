import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { getPriceHistoryForUser } from "@/lib/services/prices";
import { PriceTable } from "@/components/prices/price-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PricesPage() {
  const session = await auth();
  const allPrices = session?.user?.id
    ? await getPriceHistoryForUser(session.user.id, 50)
    : [];

  // Group prices by product
  const grouped = new Map<string, typeof allPrices>();
  for (const record of allPrices) {
    const existing = grouped.get(record.productId) ?? [];
    existing.push(record);
    grouped.set(record.productId, existing);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Price Activity
        </h1>
        <p className="text-muted-foreground">
          Recent price checks across all your products.
        </p>
      </div>

      {grouped.size === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Package className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No price checks yet. Add products and run the scraper to see
            price history.
          </p>
          <Button asChild>
            <Link href="/dashboard/products/new">Add your first product</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([productId, records]) => (
            <Card key={productId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/products/${productId}`}
                    className="hover:underline"
                  >
                    {records[0]?.productName ?? "Unknown Product"}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PriceTable data={records} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}