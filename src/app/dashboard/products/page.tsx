import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { getProductsByUserId } from "@/lib/services/products";
import { ProductTable } from "@/components/products/product-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function ProductsPage() {
  const session = await auth();
  const products = session?.user?.id
    ? await getProductsByUserId(session.user.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage the products you&apos;re tracking.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <ProductTable products={products} />
      </div>
    </div>
  );
}