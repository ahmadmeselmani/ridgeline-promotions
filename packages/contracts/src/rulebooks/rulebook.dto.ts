import { z } from "zod";
import {
  PricingPolicySchema,
  RulebookNameSchema,
  RulebookSchema,
} from "./rulebook.schema";
import { PromotionSchema } from "../promotions/promotion.schema";

export const RulebookResponseSchema = RulebookSchema;

export type RulebookResponse = z.infer<typeof RulebookResponseSchema>;

export const RulebookSummarySchema = z.object({
  name: RulebookNameSchema,
  policy: PricingPolicySchema,
  promotionCount: z.number().int(),
  updatedAt: z.iso.datetime(),
  // Only meaningful for draft: does it differ from live?
  hasUnpublishedChanges: z.boolean(),
});

export type RulebookSummary = z.infer<typeof RulebookSummarySchema>;

export const RulebookParamsSchema = z.object({
  name: RulebookNameSchema,
});

export const UpdatePolicySchema = PricingPolicySchema;

export type UpdatePolicyInput = z.infer<typeof UpdatePolicySchema>;

// Where each deal in the draft stands against what the tills run (live).
// Worked out on every read by comparing draft with live, never stored.
//   published   the tills run exactly this version
//   changed     published, but the draft has edits the tills don't have yet
//   new         only in the draft
//   turned_off  switched off in the draft, still running on the tills
//   removed     deleted from the draft, still running on the tills
export const DealStatusSchema = z.enum([
  "published",
  "changed",
  "new",
  "turned_off",
  "removed",
]);

export type DealStatus = z.infer<typeof DealStatusSchema>;

export const DraftStatusResponseSchema = z.object({
  // Every deal in the draft, plus every removed one, keyed by promotionId.
  deals: z.array(
    z.object({ promotionId: z.string(), status: DealStatusSchema }),
  ),
  // Live versions of removed deals, so they can still be shown and undone.
  removed: z.array(PromotionSchema),
  // The clash rule (best price / priority) isn't part of any one deal.
  policyChanged: z.boolean(),
});

export type DraftStatusResponse = z.infer<typeof DraftStatusResponseSchema>;
