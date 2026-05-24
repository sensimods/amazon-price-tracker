"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const productFormSchema = z.object({
  url: z.string().url("Please enter a valid Amazon URL"),
  name: z.string().min(1, "Name is required"),
  checkInterval: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const ALL_INTERVALS = [
  { value: "3600", label: "Every hour", minPlan: "personal" },
  { value: "10800", label: "Every 3 hours", minPlan: "personal" },
  { value: "21600", label: "Every 6 hours", minPlan: "personal" },
  { value: "43200", label: "Every 12 hours", minPlan: "free" },
  { value: "86400", label: "Once daily", minPlan: "free" },
];

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues>;
  productId?: string;
  mode: "create" | "edit";
  /** Current user's plan key: "free", "personal", or "pro" */
  plan?: string;
  /** Called after successful creation with the new product's ID */
  onCreated?: (productId: string) => void;
}

export function ProductForm({
  defaultValues,
  productId,
  mode,
  plan = "free",
  onCreated,
}: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter intervals based on plan
  const availableIntervals = ALL_INTERVALS.filter(
    (i) => i.minPlan === "free" || plan !== "free",
  );

  // Set a plan-appropriate default
  const defaultCheckInterval = plan === "free" ? "43200" : "3600";

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      url: "",
      name: "",
      checkInterval: defaultCheckInterval,
      ...defaultValues,
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url =
        mode === "create"
          ? "/api/products"
          : `/api/products/${productId}`;

      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: data.url,
          name: data.name,
          checkInterval: data.checkInterval
            ? Number(data.checkInterval)
            : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Something went wrong");
      }

      const createdProduct = await res.json();

      if (mode === "create" && onCreated) {
        onCreated(createdProduct.id);
      } else {
        router.push("/dashboard/products");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">Amazon</Badge>
          <span>Amazon-only price tracker</span>
        </div>

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amazon Product URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://www.amazon.com/dp/..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="My Tracked Product"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="checkInterval"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Check Interval</FormLabel>
                <Badge variant="outline" className="text-xs capitalize">
                  {plan} plan
                </Badge>
              </div>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableIntervals.map((interval) => (
                    <SelectItem key={interval.value} value={interval.value}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
              {plan === "free" && (
                <p className="text-xs text-muted-foreground">
                  Upgrade to Personal ($4.99/mo) for hourly and 3-hour check intervals.
                </p>
              )}
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === "create" ? "Add Product" : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}