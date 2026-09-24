import { z } from "zod";
import {
  PromotionInputShape,
  PromotionSchema,
  checkPromotionConsistency,
} from "./promotion.schema";
import { RulebookNameSchema } from "../rulebooks/rulebook.schema";

export const CreatePromotionSchema = PromotionInputShape.superRefine(
  checkPromotionConsistency,
);

export type CreatePromotionInput = z.infer<typeof CreatePromotionSchema>;

// Partial update; the merged result is re-validated against PromotionSchema
// by the service, so cross-field rules still hold.
export const UpdatePromotionSchema = PromotionInputShape.partial();

export type UpdatePromotionInput = z.infer<typeof UpdatePromotionSchema>;

export const PromotionsQuerySchema = z.object({
  rulebook: RulebookNameSchema.default("draft"),
});

export type PromotionsQuery = z.infer<typeof PromotionsQuerySchema>;

export const PromotionResponseSchema = PromotionSchema;

export type PromotionResponse = z.infer<typeof PromotionResponseSchema>;
