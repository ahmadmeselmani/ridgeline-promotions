import { z } from "zod";
import {
  CentsSchema,
  DaySchema,
  IsoDateSchema,
  LocalDateTimeSchema,
  TimeOfDaySchema,
} from "../common/common.schema";
import { AudienceSchema } from "../promotions/promotion.schema";
import { RulebookNameSchema } from "../rulebooks/rulebook.schema";
import {
  BasketLineSchema,
  CustomerSchema,
  PricedLineSchema,
  ResolvedCustomerSchema,
  TradingMomentSchema,
} from "./pricing.schema";

// Exactly one of localDateTime (venue wall clock, what a person types) or
// `at` (an instant with offset, what a till sends).
export const QuoteRequestSchema = z
  .object({
    rulebook: RulebookNameSchema.default("live"),
    venueId: z.string().min(1),
    localDateTime: LocalDateTimeSchema.optional(),
    at: z.iso.datetime({ offset: true }).optional(),
    customer: CustomerSchema,
    lines: z.array(BasketLineSchema).min(1),
  })
  .refine((value) => Boolean(value.localDateTime) !== Boolean(value.at), {
    message: "Send either localDateTime or at, not both",
    path: ["localDateTime"],
  });

export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;
export type QuoteRequestInput = z.input<typeof QuoteRequestSchema>;

export const QuoteResponseSchema = z.object({
  rulebook: RulebookNameSchema,
  venueId: z.string(),
  venueName: z.string(),
  timezone: z.string(),
  moment: TradingMomentSchema,
  customer: ResolvedCustomerSchema,
  lines: z.array(PricedLineSchema),
  subtotalCents: CentsSchema,
  discountCents: CentsSchema,
  totalCents: CentsSchema,
  notes: z.array(z.string()),
});

export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;

export const ImpactQuerySchema = z.object({
  from: RulebookNameSchema.default("live"),
  to: RulebookNameSchema.default("draft"),
});

export type ImpactQuery = z.infer<typeof ImpactQuerySchema>;

export const ImpactItemSchema = z.object({
  scenarioId: z.string(),
  title: z.string(),
  before: QuoteResponseSchema,
  after: QuoteResponseSchema,
  deltaCents: z.number().int(),
});

export const ImpactResponseSchema = z.object({
  from: RulebookNameSchema,
  to: RulebookNameSchema,
  scenarioCount: z.number().int(),
  changed: z.array(ImpactItemSchema),
});

export type ImpactItem = z.infer<typeof ImpactItemSchema>;
export type ImpactResponse = z.infer<typeof ImpactResponseSchema>;

export const ClashGridQuerySchema = z.object({
  venueId: z.string().min(1),
  rulebook: RulebookNameSchema.default("draft"),
  // Monday of the week to draw; date-limited deals (Melbourne Cup) only show
  // in the week they run.
  weekOf: IsoDateSchema,
});

export type ClashGridQuery = z.infer<typeof ClashGridQuerySchema>;

export const ClashSchema = z.object({
  promotionIds: z.tuple([z.string(), z.string()]),
  // competes: both could apply to the same item, the policy picks one.
  // stacks: both will be given together — a double discount.
  kind: z.enum(["competes", "stacks"]),
  message: z.string(),
});

export const ClashSlotSchema = z.object({
  startsAt: TimeOfDaySchema,
  endsAt: TimeOfDaySchema,
  open: z.boolean(),
  active: z.array(
    z.object({
      promotionId: z.string(),
      name: z.string(),
      audience: AudienceSchema,
    }),
  ),
  clashes: z.array(ClashSchema),
});

export const ClashDaySchema = z.object({
  day: DaySchema,
  tradingDate: IsoDateSchema,
  slots: z.array(ClashSlotSchema),
});

export const ClashGridResponseSchema = z.object({
  venueId: z.string(),
  rulebook: RulebookNameSchema,
  weekOf: IsoDateSchema,
  days: z.array(ClashDaySchema),
});

export type Clash = z.infer<typeof ClashSchema>;
export type ClashSlot = z.infer<typeof ClashSlotSchema>;
export type ClashDay = z.infer<typeof ClashDaySchema>;
export type ClashGridResponse = z.infer<typeof ClashGridResponseSchema>;
