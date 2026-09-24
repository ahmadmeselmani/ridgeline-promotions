import type { Promotion } from "@ridgeline/contracts/promotions";
import type { PricingPolicy } from "@ridgeline/contracts/rulebooks";

// The rules as Tania described them on the call, not as Trestle has them.
// Every difference from the legacy config is a decision, and the ones still
// waiting on Tania say so in their description.

export const PROPOSED_POLICY: PricingPolicy = { resolution: "best_price" };

const EVERY_DAY: Promotion["schedule"]["days"] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const PROPOSED_PROMOTIONS: Promotion[] = [
  {
    promotionId: "PRM-21",
    name: "Happy Hour",
    description: "15% off all drinks on weekdays. Venues can run their own hours as a venue exception.",
    type: "percent_off",
    value: 15,
    appliesTo: { kind: "category", category: "beverage" },
    audience: "everyone",
    schedule: { days: ["mon", "tue", "wed", "thu", "fri"], startsAt: "16:00", endsAt: "18:00", validFrom: null, validTo: null },
    venueIds: null,
    venueOverrides: [],
    stacksWith: [],
    priority: 10,
    active: true,
  },
  {
    promotionId: "PRM-22",
    name: "Member Discount",
    description:
      "10% off for members when there's no better deal. Doesn't stack — 'only ever the best single deal'. Waiting on Tania about regulars like Ray.",
    type: "percent_off",
    value: 10,
    appliesTo: { kind: "all" },
    audience: "member",
    schedule: { days: EVERY_DAY, startsAt: "00:00", endsAt: "24:00", validFrom: null, validTo: null },
    venueIds: null,
    venueOverrides: [],
    stacksWith: [],
    priority: 5,
    active: true,
  },
  {
    promotionId: "PRM-23",
    name: "Schnitzel Tuesday",
    description: "$18 for a schnitzel and a pot. Pot products are assumed — Trestle's catalogue has none.",
    type: "bundle_price",
    value: 1800,
    appliesTo: {
      kind: "bundle",
      slots: [
        { label: "Chicken Schnitzel", productIds: ["PRD-0201"], quantity: 1 },
        { label: "Pot", productIds: ["PRD-0109", "PRD-0110"], quantity: 1 },
      ],
    },
    audience: "everyone",
    schedule: { days: ["tue"], startsAt: "11:00", endsAt: "21:00", validFrom: null, validTo: null },
    venueIds: null,
    venueOverrides: [],
    stacksWith: [],
    priority: 10,
    active: true,
  },
  {
    promotionId: "PRM-26",
    name: "Schnitzel Tuesday — no pot",
    description:
      "Keeps today's $18 for a schnitzel ordered without a pot, so nobody pays more while we wait on Tania (question 3). Remove it if she says the pot is part of the deal.",
    type: "fixed_price",
    value: 1800,
    appliesTo: { kind: "products", productIds: ["PRD-0201"] },
    audience: "everyone",
    schedule: { days: ["tue"], startsAt: "11:00", endsAt: "21:00", validFrom: null, validTo: null },
    venueIds: null,
    venueOverrides: [],
    stacksWith: [],
    priority: 10,
    active: true,
  },
  {
    promotionId: "PRM-24",
    name: "Staff Discount",
    description: "30% off for staff, unless a deal is cheaper.",
    type: "percent_off",
    value: 30,
    appliesTo: { kind: "all" },
    audience: "staff",
    schedule: { days: EVERY_DAY, startsAt: "00:00", endsAt: "24:00", validFrom: null, validTo: null },
    venueIds: null,
    venueOverrides: [],
    stacksWith: [],
    priority: 20,
    active: true,
  },
  {
    promotionId: "PRM-25",
    name: "Parma & Pint for Two",
    description: "Two parmas and two pints for $55 on Thursdays. Lager only, as configured today — any pint? (question 4).",
    type: "bundle_price",
    value: 5500,
    appliesTo: {
      kind: "bundle",
      slots: [
        { label: "Parmigiana", productIds: ["PRD-0202"], quantity: 2 },
        { label: "Lager pint", productIds: ["PRD-0101"], quantity: 2 },
      ],
    },
    audience: "everyone",
    schedule: { days: ["thu"], startsAt: "17:00", endsAt: "21:00", validFrom: null, validTo: null },
    venueIds: null,
    venueOverrides: [],
    stacksWith: [],
    priority: 15,
    active: true,
  },
];
