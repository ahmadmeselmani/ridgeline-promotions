import { z } from "zod";
import { CentsSchema } from "../common/common.schema";

export const OverrideReasonSchema = z.enum([
  "customer_complaint",
  "wastage_or_error",
  "manager_goodwill",
  "deal_not_in_system",
  "other",
]);

// A manual price is allowed, but it is recorded separately from promotions so
// promotion reporting stays honest.
export const PriceOverrideSchema = z.object({
  overrideId: z.string(),
  venueId: z.string(),
  staffId: z.string(),
  productId: z.string(),
  quotedCents: CentsSchema,
  chargedCents: CentsSchema,
  discountCents: z.number().int(),
  reason: OverrideReasonSchema,
  note: z.string(),
  createdAt: z.iso.datetime(),
});
