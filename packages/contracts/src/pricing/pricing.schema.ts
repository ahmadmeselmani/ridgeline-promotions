import { z } from "zod";
import {
  CentsSchema,
  DaySchema,
  IsoDateSchema,
  LocalDateTimeSchema,
  TimeOfDaySchema,
} from "../common/common.schema";
import { AudienceSchema } from "../promotions/promotion.schema";

export const CustomerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("guest") }),
  z.object({ kind: z.literal("member"), memberNumber: z.string().min(1) }),
  z.object({ kind: z.literal("staff"), staffId: z.string().min(1) }),
]);

export const BasketLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const AppliedPromotionSchema = z.object({
  promotionId: z.string(),
  name: z.string(),
  // primary: the one deal the item got. stacked: added on top (only where a
  // rule explicitly allows it). bundle: the item is part of a bundle price.
  role: z.enum(["primary", "stacked", "bundle"]),
  discountCents: z.number().int(),
});

export const SkippedPromotionSchema = z.object({
  promotionId: z.string(),
  name: z.string(),
  reason: z.string(),
});

export const PricedLineSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number().int(),
  unitListCents: CentsSchema,
  listCents: CentsSchema,
  finalCents: CentsSchema,
  discountCents: CentsSchema,
  bundleGroup: z.string().nullable(),
  applied: z.array(AppliedPromotionSchema),
  skipped: z.array(SkippedPromotionSchema),
});

export const TradingMomentSchema = z.object({
  localDateTime: LocalDateTimeSchema,
  tradingDate: IsoDateSchema,
  tradingDay: DaySchema,
  timeOfDay: TimeOfDaySchema,
  afterMidnight: z.boolean(),
});

export const ResolvedCustomerSchema = z.object({
  kind: z.enum(["guest", "member", "staff"]),
  audience: AudienceSchema.exclude(["everyone"]).nullable(),
  label: z.string(),
  note: z.string().nullable(),
});
