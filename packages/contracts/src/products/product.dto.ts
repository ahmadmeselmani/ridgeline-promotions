import { z } from "zod";
import { ProductSchema } from "./product.schema";

export const ProductsQuerySchema = z.object({
  venueId: z.string().min(1),
});

export type ProductsQuery = z.infer<typeof ProductsQuerySchema>;

export const ProductResponseSchema = ProductSchema;

export type ProductResponse = z.infer<typeof ProductResponseSchema>;
