"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProductForm } from "@/components/products/product-form";
import { AlertForm } from "@/components/alerts/alert-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell, CheckCircle } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const userPlan = "free"; // Default until we add plan fetch

  const handleCreated = (productId: string) => {
    setCreatedProductId(productId);
    setShowAlertModal(true);
  };

  const handleGoToProducts = () => {
    router.push("/dashboard/products");
    router.refresh();
  };

  return (
    <>
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Product</h1>
          <p className="text-muted-foreground">
            Enter an Amazon product URL to start tracking its price.
          </p>
        </div>

        <div className="rounded-md border p-6">
          <ProductForm mode="create" plan={userPlan} onCreated={handleCreated} />
        </div>
      </div>

      {/* Post-add success dialog */}
      <Dialog open={showAlertModal} onOpenChange={setShowAlertModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <DialogTitle>Product Added!</DialogTitle>
            </div>
            <DialogDescription>
              Set a price alert for this product so you never miss a deal.
            </DialogDescription>
          </DialogHeader>

          {createdProductId && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bell className="h-4 w-4" />
                <span>Configure your price alert below:</span>
              </div>
              <AlertForm
                productId={createdProductId}
                onSuccess={() => {
                  setShowAlertModal(false);
                  router.push("/dashboard/products");
                  router.refresh();
                }}
                onCancel={() => {
                  setShowAlertModal(false);
                  router.push("/dashboard/products");
                  router.refresh();
                }}
              />
            </div>
          )}

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={handleGoToProducts}
            >
              Skip — go to my products
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}