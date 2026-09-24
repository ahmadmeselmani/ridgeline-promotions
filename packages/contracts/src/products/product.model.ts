import { z } from "zod";
import { ProductSchema } from "./product.schema";

export type Product = z.infer<typeof ProductSchema>;
