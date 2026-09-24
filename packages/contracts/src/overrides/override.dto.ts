import { z } from "zod";
import { CentsSchema } from "../common/common.schema";
import { OverrideReasonSchema, PriceOverrideSchema } from "./override.schema";

export const CreateOverrideSchema = z
  .object({
    venueId: z.string().min(1),
    staffId: z.string().min(1),
    productId: z.string().min(1),
    quotedCents: CentsSchema,
    chargedCents: CentsSchema,
    reason: OverrideReasonSchema,
    note: z.string().trim().default(""),
  })
  .refine((value) => value.reason !== "other" || value.note.length > 0, {
    message: "Say what happened when the reason is 'other'",
    path: ["note"],
  });

export type CreateOverrideInput = z.infer<typeof CreateOverrideSchema>;

export const OverridesQuerySchema = z.object({
  venueId: z.string().min(1).optional(),
});

export type OverridesQuery = z.infer<typeof OverridesQuerySchema>;

export const OverrideResponseSchema = PriceOverrideSchema;

export type OverrideResponse = z.infer<typeof OverrideResponseSchema>;

export const OverrideSummarySchema = z.object({
  count: z.number().int(),
  discountCents: z.number().int(),
  byReason: z.array(
    z.object({
      reason: OverrideReasonSchema,
      count: z.number().int(),
      discountCents: z.number().int(),
    }),
  ),
  byStaff: z.array(
    z.object({
      staffId: z.string(),
      count: z.number().int(),
      discountCents: z.number().int(),
    }),
  ),
});

export type OverrideSummary = z.infer<typeof OverrideSummarySchema>;
