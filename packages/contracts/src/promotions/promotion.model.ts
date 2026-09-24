import { z } from "zod";
import {
  AppliesToSchema,
  AudienceSchema,
  BundleSlotSchema,
  PromotionSchema,
  PromotionTypeSchema,
  ScheduleSchema,
  VenueOverrideSchema,
} from "./promotion.schema";

export type PromotionType = z.infer<typeof PromotionTypeSchema>;
export type Audience = z.infer<typeof AudienceSchema>;
export type BundleSlot = z.infer<typeof BundleSlotSchema>;
export type AppliesTo = z.infer<typeof AppliesToSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type VenueOverride = z.infer<typeof VenueOverrideSchema>;
export type Promotion = z.infer<typeof PromotionSchema>;
