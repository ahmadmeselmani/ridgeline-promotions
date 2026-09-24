import { z } from "zod";
import { PromotionSchema } from "../promotions/promotion.schema";

// legacy = what Trestle is configured with today (read-only, from fixtures).
// live   = what the tills price with once published through this tool.
// draft  = Tania's work in progress; publishing copies it to live.
export const RulebookNameSchema = z.enum(["legacy", "live", "draft"]);

// best_price: the customer gets the single cheapest deal (what Tania asked for).
// priority:   the higher `priority` wins (what Trestle does today).
export const ResolutionPolicySchema = z.enum(["best_price", "priority"]);

export const PricingPolicySchema = z.object({
  resolution: ResolutionPolicySchema,
});

export const RulebookSchema = z.object({
  name: RulebookNameSchema,
  policy: PricingPolicySchema,
  promotions: z.array(PromotionSchema),
  updatedAt: z.iso.datetime(),
});
