import { z } from "zod";
import {
  PricingPolicySchema,
  RulebookNameSchema,
  RulebookSchema,
} from "./rulebook.schema";

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
