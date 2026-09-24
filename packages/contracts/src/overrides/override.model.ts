import { z } from "zod";
import { OverrideReasonSchema, PriceOverrideSchema } from "./override.schema";

export type OverrideReason = z.infer<typeof OverrideReasonSchema>;
export type PriceOverride = z.infer<typeof PriceOverrideSchema>;
