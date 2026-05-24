"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Product {
  id: string;
  url: string;
  name: string | null;
  store: string | null;
  currentPrice: string | null;
  currency: string | null;
  isActive: boolean | null;
  lastCheckedAt: string | Date | null;
  lastScrapeError: string | null;
  createdAt: string | Date;
}

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    setScrapeError(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setScrapeError(data.message ?? "Scrape failed");
      } else if (!data.result?.price) {
        setScrapeError(
          "Could not extract a price. The store may be blocking the request.",
        );
      }

      router.refresh();
    } catch {
      setScrapeError("Network error — could not reach the scraper");
    } finally {
      setRefreshingId(null);
      // Clear the error toast after a few seconds
      if (scrapeError) {
        setTimeout(() => setScrapeError(null), 5000);
      }
    }
  };

  const formatPrice = (price: string | null, currency: string | null) => {
    if (!price) return "—";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency ?? "USD",
      }).format(Number(price));
    } catch {
      return `$${price}`;
    }
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-sm text-muted-foreground">No products yet.</p>
        <Button asChild>
          <Link href="/dashboard/products/new">Add your first product</Link>
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      {/* Scrape error toast */}
      {scrapeError && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{scrapeError}</span>
          <button
            className="ml-auto text-destructive/70 hover:text-destructive"
            onClick={() => setScrapeError(null)}
          >
            ×
          </button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Current Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Checked</TableHead>
            <TableHead className="w-44">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {product.name ?? "Unnamed Product"}
                  </span>
                  <span className="max-w-[250px] truncate text-xs text-muted-foreground">
                    {product.url}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {product.store ? (
                  <Badge variant="secondary" className="capitalize">
                    {product.store}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {formatPrice(product.currentPrice, product.currency)}
                  </span>
                  {product.lastScrapeError && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">{product.lastScrapeError}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={product.isActive ? "default" : "secondary"}
                  >
                    {product.isActive ? "Active" : "Paused"}
                  </Badge>
                  {product.lastScrapeError && (
                    <Badge variant="destructive" className="shrink-0">
                      Scrape Error
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {product.lastCheckedAt
                  ? formatDistanceToNow(new Date(product.lastCheckedAt), {
                      addSuffix: true,
                    })
                  : "Never"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/dashboard/products/${product.id}`}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View details</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit product</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={refreshingId === product.id}
                        onClick={() => handleRefresh(product.id)}
                      >
                        {refreshingId === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="sr-only">Refresh price</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Force check price</TooltipContent>
                  </Tooltip>

                  <Dialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Delete product</TooltipContent>
                    </Tooltip>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete{" "}
                          <strong>
                            {product.name ?? "this product"}
                          </strong>
                          ? This action cannot be undone and will remove
                          all price history.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setDeletingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={deletingId === product.id}
                          onClick={() => handleDelete(product.id)}
                        >
                          {deletingId === product.id && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">Open URL</span>
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open in new tab</TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}