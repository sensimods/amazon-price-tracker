import { z } from "zod";

export const createAlertSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  targetPrice: z.coerce.number().positive("Price must be positive"),
  condition: z.enum(["below", "above", "percentage_drop"]).default("below"),
});

export const updateAlertSchema = z.object({
  targetPrice: z.coerce.number().positive("Price must be positive").optional(),
  condition: z.enum(["below", "above", "percentage_drop"]).optional(),
  isActive: z.boolean().optional(),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;