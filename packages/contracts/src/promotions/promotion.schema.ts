import { z } from "zod";
import {
  DaySchema,
  IsoDateSchema,
  StartTimeOfDaySchema,
  TimeOfDaySchema,
} from "../common/common.schema";

export const PromotionTypeSchema = z.enum([
  "percent_off",
  "fixed_price",
  "bundle_price",
]);

// Who the deal is for. A customer is exactly one of guest, member or staff.
export const AudienceSchema = z.enum(["everyone", "member", "staff"]);

export const BundleSlotSchema = z.object({
  label: z.string().min(1),
  // Any of these products fills the slot, e.g. "any pot".
  productIds: z.array(z.string().min(1)).min(1),
  quantity: z.number().int().min(1),
});

export const AppliesToSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("all") }),
  z.object({ kind: z.literal("category"), category: z.string().min(1) }),
  z.object({
    kind: z.literal("products"),
    productIds: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    kind: z.literal("bundle"),
    slots: z.array(BundleSlotSchema).min(1),
  }),
]);

// Window is [startsAt, endsAt) in venue-local time. endsAt earlier than
// startsAt means the window runs past midnight. `days` are trading days, so
// 12:30am after a Tuesday night still counts as Tuesday.
export const ScheduleSchema = z
  .object({
    days: z.array(DaySchema).min(1),
    startsAt: StartTimeOfDaySchema,
    endsAt: TimeOfDaySchema,
    validFrom: IsoDateSchema.nullable(),
    validTo: IsoDateSchema.nullable(),
  })
  .superRefine((schedule, ctx) => {
    if (schedule.validFrom && schedule.validTo && schedule.validFrom > schedule.validTo) {
      ctx.addIssue({
        code: "custom",
        path: ["validTo"],
        message: "Last day must be on or after first day",
      });
    }
  });

export const VenueOverrideSchema = z.object({
  venueId: z.string().min(1),
  enabled: z.boolean(),
  days: z.array(DaySchema).min(1).optional(),
  startsAt: StartTimeOfDaySchema.optional(),
  endsAt: TimeOfDaySchema.optional(),
});

// Wildcard for stacksWith: stacks on top of any other deal. Only the legacy
// Trestle `stackable: true` flag maps to this.
export const STACKS_WITH_ANY = "*";

const PromotionShape = z.object({
  promotionId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  type: PromotionTypeSchema,
  // percent_off: whole percent. fixed_price / bundle_price: cents.
  value: z.number().int().min(0),
  appliesTo: AppliesToSchema,
  audience: AudienceSchema,
  schedule: ScheduleSchema,
  // null = every venue in the group.
  venueIds: z.array(z.string().min(1)).nullable(),
  venueOverrides: z.array(VenueOverrideSchema),
  // Deals this one may be added on top of. Empty = best single deal only.
  stacksWith: z.array(z.string().min(1)),
  // Only used by the "priority" policy and to break exact price ties.
  priority: z.number().int(),
  active: z.boolean(),
});

type PromotionShapeValue = z.infer<typeof PromotionShape>;

function checkPromotionConsistency(
  promotion: Pick<PromotionShapeValue, "type" | "value" | "appliesTo">,
  ctx: z.RefinementCtx,
): void {
  const isBundleScope = promotion.appliesTo.kind === "bundle";
  if (promotion.type === "bundle_price" && !isBundleScope) {
    ctx.addIssue({
      code: "custom",
      path: ["appliesTo"],
      message: "A bundle price needs bundle slots",
    });
  }
  if (promotion.type !== "bundle_price" && isBundleScope) {
    ctx.addIssue({
      code: "custom",
      path: ["type"],
      message: "Bundle slots only work with a bundle price",
    });
  }
  if (promotion.type === "percent_off" && promotion.value > 100) {
    ctx.addIssue({
      code: "custom",
      path: ["value"],
      message: "A percentage can't be over 100",
    });
  }
}

export const PromotionSchema = PromotionShape.superRefine(
  checkPromotionConsistency,
);

export const PromotionInputShape = PromotionShape.omit({ promotionId: true });

export { checkPromotionConsistency };
