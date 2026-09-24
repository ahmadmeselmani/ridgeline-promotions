import { z } from "zod";
import { CentsSchema, DataSourceSchema } from "../common/common.schema";

export const ProductSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  priceCents: CentsSchema,
  taxCode: z.string(),
  source: DataSourceSchema,
});
