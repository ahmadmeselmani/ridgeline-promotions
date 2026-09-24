import type { Promotion } from "@ridgeline/contracts/promotions";
import type { CatalogProduct } from "../scope";

export const PRODUCTS = {
  lagerPint: { productId: "PRD-0101", name: "Lager — pint", category: "beverage", priceCents: 1200 },
  palePint: { productId: "PRD-0102", name: "Pale Ale — pint", category: "beverage", priceCents: 1300 },
  lagerPot: { productId: "PRD-0109", name: "Lager — pot", category: "beverage", priceCents: 800 },
  schnitzel: { productId: "PRD-0201", name: "Chicken Schnitzel", category: "food", priceCents: 2600 },
  parma: { productId: "PRD-0202", name: "Parmigiana", category: "food", priceCents: 2900 },
} satisfies Record<string, CatalogProduct>;

export const CATALOG: ReadonlyMap<string, CatalogProduct> = new Map(
  Object.values(PRODUCTS).map((product) => [product.productId, product]),
);

export function promo(overrides: Partial<Promotion> & Pick<Promotion, "promotionId" | "name">): Promotion {
  return {
    description: "",
    type: "percent_off",
    value: 10,
    appliesTo: { kind: "all" },
    audience: "everyone",
    schedule: {
      days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      startsAt: "00:00",
      endsAt: "24:00",
      validFrom: null,
      validTo: null,
    },
    venueIds: null,
    venueOverrides: [],
    stacksWith: [],
    priority: 0,
    active: true,
    ...overrides,
  };
}

const WEEKDAYS: Promotion["schedule"]["days"] = ["mon", "tue", "wed", "thu", "fri"];

export const HAPPY_HOUR = promo({
  promotionId: "PRM-21",
  name: "Happy Hour",
  value: 15,
  appliesTo: { kind: "category", category: "beverage" },
  schedule: { days: WEEKDAYS, startsAt: "16:00", endsAt: "18:00", validFrom: null, validTo: null },
  priority: 10,
});

export const MEMBER = promo({
  promotionId: "PRM-22",
  name: "Member Discount",
  value: 10,
  audience: "member",
  priority: 5,
});

export const SCHNITZEL_TUESDAY = promo({
  promotionId: "PRM-23",
  name: "Schnitzel Tuesday",
  type: "bundle_price",
  value: 1800,
  appliesTo: {
    kind: "bundle",
    slots: [
      { label: "Chicken Schnitzel", productIds: ["PRD-0201"], quantity: 1 },
      { label: "Pot", productIds: ["PRD-0109"], quantity: 1 },
    ],
  },
  schedule: { days: ["tue"], startsAt: "11:00", endsAt: "21:00", validFrom: null, validTo: null },
  priority: 10,
});

export const STAFF = promo({
  promotionId: "PRM-24",
  name: "Staff Discount",
  value: 30,
  audience: "staff",
  priority: 20,
});

export const PARMA_AND_PINT = promo({
  promotionId: "PRM-25",
  name: "Parma & Pint for Two",
  type: "bundle_price",
  value: 5500,
  appliesTo: {
    kind: "bundle",
    slots: [
      { label: "Parmigiana", productIds: ["PRD-0202"], quantity: 2 },
      { label: "Lager pint", productIds: ["PRD-0101"], quantity: 2 },
    ],
  },
  schedule: { days: ["thu"], startsAt: "17:00", endsAt: "21:00", validFrom: null, validTo: null },
  priority: 15,
});

// What Trestle is configured with today: member stacks on anything, the
// schnitzel deal is a fixed price on the schnitzel alone, priority decides.
export const LEGACY_PROMOTIONS: Promotion[] = [
  HAPPY_HOUR,
  { ...MEMBER, stacksWith: ["*"] },
  promo({
    ...SCHNITZEL_TUESDAY,
    type: "fixed_price",
    appliesTo: { kind: "products", productIds: ["PRD-0201"] },
  }),
  STAFF,
  PARMA_AND_PINT,
];

export const PROPOSED_PROMOTIONS: Promotion[] = [
  HAPPY_HOUR,
  MEMBER,
  SCHNITZEL_TUESDAY,
  STAFF,
  PARMA_AND_PINT,
];
