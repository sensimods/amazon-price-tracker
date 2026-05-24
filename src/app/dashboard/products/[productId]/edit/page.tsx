import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema/subscriptions";
import { eq } from "drizzle-orm";
import { getProductById } from "@/lib/services/products";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const session = await auth();
  const { productId } = await params;

  const product =
    session?.user?.id
      ? await getProductById(productId, session.user.id)
      : null;

  if (!product) {
    notFound();
  }

  const sub = session?.user?.id
    ? await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, session.user.id))
        .then((rows) => rows[0])
    : null;

  const plan = sub?.plan ?? "free";

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/products/${productId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">
            Update product details for {product.name ?? "this product"}.
          </p>
        </div>
      </div>

      <div className="rounded-md border p-6">
        <ProductForm
          mode="edit"
          productId={productId}
          plan={plan}
          defaultValues={{
            url: product.url,
            name: product.name ?? "",
            checkInterval: String(product.checkInterval ?? (plan === "free" ? 43200 : 3600)),
          }}
        />
      </div>
    </div>
  );
}