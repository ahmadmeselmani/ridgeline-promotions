import type { Promotion } from "@ridgeline/contracts/promotions";
import type { PricingPolicy } from "@ridgeline/contracts/rulebooks";
import { UnknownProductError, priceBasket } from "./engine";
import {
  CATALOG,
  HAPPY_HOUR,
  LEGACY_PROMOTIONS,
  PRODUCTS,
  PARMA_AND_PINT,
  PROPOSED_PROMOTIONS,
  SCHNITZEL_TUESDAY,
  promo,
} from "./testing/builders";
import { tradingMomentFromLocal } from "./time";

const BEST_PRICE: PricingPolicy = { resolution: "best_price" };
const PRIORITY: PricingPolicy = { resolution: "priority" };

// 2026-09-22 is a Tuesday.
const TUE_7PM = "2026-09-22T19:00";
const WED_430PM = "2026-09-23T16:30";
const THU_530PM = "2026-09-24T17:30";
const THU_630PM = "2026-09-24T18:30";

function quote(options: {
  at: string;
  lines: Array<[string, number]>;
  audience?: "member" | "staff" | null;
  promotions: Promotion[];
  policy: PricingPolicy;
  venueId?: string;
}) {
  return priceBasket({
    venueId: options.venueId ?? "VEN-0233",
    moment: tradingMomentFromLocal(options.at),
    audience: options.audience ?? null,
    lines: options.lines.map(([productId, quantity]) => ({ productId, quantity })),
    catalog: CATALOG,
    promotions: options.promotions,
    policy: options.policy,
  });
}

describe("priceBasket — today's Trestle config (legacy)", () => {
  it("gives Ray $16.20: schnitzel at $18 with his 10% stacked on top", () => {
    const result = quote({
      at: TUE_7PM,
      audience: "member",
      lines: [[PRODUCTS.schnitzel.productId, 1]],
      promotions: LEGACY_PROMOTIONS,
      policy: PRIORITY,
    });

    expect(result.totalCents).toBe(1620);
    expect(result.lines[0]?.applied.map((a) => [a.name, a.role])).toEqual([
      ["Schnitzel Tuesday", "primary"],
      ["Member Discount", "stacked"],
    ]);
  });

  it("gives a member two discounts on the same beer at happy hour", () => {
    const result = quote({
      at: WED_430PM,
      audience: "member",
      lines: [[PRODUCTS.lagerPint.productId, 1]],
      promotions: LEGACY_PROMOTIONS,
      policy: PRIORITY,
    });

    // $12.00 - 15% = $10.20, then - 10% = $9.18
    expect(result.totalCents).toBe(918);
  });

  it("charges staff more for Parma & Pint than a walk-in, because staff has higher priority", () => {
    const result = quote({
      at: THU_630PM,
      audience: "staff",
      lines: [
        [PRODUCTS.parma.productId, 2],
        [PRODUCTS.lagerPint.productId, 2],
      ],
      promotions: LEGACY_PROMOTIONS,
      policy: PRIORITY,
    });

    expect(result.totalCents).toBe(5740);
    const parma = result.lines.find((line) => line.productId === PRODUCTS.parma.productId);
    expect(parma?.skipped).toContainEqual(
      expect.objectContaining({
        name: "Parma & Pint for Two",
        reason: "Lower priority than Staff Discount",
      }),
    );
  });
});

describe("priceBasket — best single deal (proposed)", () => {
  it("gives Ray $18 for schnitzel and pot, and says why his 10% wasn't added", () => {
    const result = quote({
      at: TUE_7PM,
      audience: "member",
      lines: [
        [PRODUCTS.schnitzel.productId, 1],
        [PRODUCTS.lagerPot.productId, 1],
      ],
      promotions: PROPOSED_PROMOTIONS,
      policy: BEST_PRICE,
    });

    expect(result.totalCents).toBe(1800);
    expect(result.discountCents).toBe(1600);
    const schnitzel = result.lines.find((line) => line.productId === PRODUCTS.schnitzel.productId);
    expect(schnitzel?.skipped[0]).toMatchObject({
      name: "Member Discount",
      reason: expect.stringContaining("cheaper as a bundle"),
    });
  });

  it.each([
    ["guest", null, 1800],
    ["member", "member", 1800],
  ] as const)(
    "keeps a %s's schnitzel without a pot at today's $18, and says the bundle needs a pot",
    (_label, audience, totalCents) => {
      const result = quote({
        at: TUE_7PM,
        audience,
        lines: [[PRODUCTS.schnitzel.productId, 1]],
        promotions: PROPOSED_PROMOTIONS,
        policy: BEST_PRICE,
      });

      expect(result.totalCents).toBe(totalCents);
      expect(result.lines[0]?.applied.map((a) => a.name)).toEqual(["Schnitzel Tuesday — no pot"]);
      expect(result.lines[0]?.skipped).toContainEqual(
        expect.objectContaining({
          name: "Schnitzel Tuesday",
          reason: "Needs 1× Chicken Schnitzel + 1× Pot",
        }),
      );
    },
  );

  it("still prices schnitzel and pot as the bundle, not the no-pot deal plus a full-price pot", () => {
    const result = quote({
      at: TUE_7PM,
      lines: [
        [PRODUCTS.schnitzel.productId, 1],
        [PRODUCTS.lagerPot.productId, 1],
      ],
      promotions: PROPOSED_PROMOTIONS,
      policy: BEST_PRICE,
    });

    expect(result.totalCents).toBe(1800);
    const schnitzel = result.lines.find((line) => line.productId === PRODUCTS.schnitzel.productId);
    expect(schnitzel?.applied.map((a) => a.name)).toEqual(["Schnitzel Tuesday"]);
    expect(schnitzel?.skipped).toContainEqual(
      expect.objectContaining({
        name: "Schnitzel Tuesday — no pot",
        reason: expect.stringContaining("cheaper as a bundle"),
      }),
    );
  });

  it("gives a member happy hour on their beer, not happy hour plus 10%", () => {
    const result = quote({
      at: WED_430PM,
      audience: "member",
      lines: [[PRODUCTS.lagerPint.productId, 1]],
      promotions: PROPOSED_PROMOTIONS,
      policy: BEST_PRICE,
    });

    expect(result.totalCents).toBe(1020);
    expect(result.lines[0]?.skipped[0]?.reason).toBe(
      "One deal per item — Happy Hour is cheaper ($10.20 vs $10.80)",
    );
  });

  it("gives staff the $55 bundle when it beats their 30%", () => {
    const result = quote({
      at: THU_630PM,
      audience: "staff",
      lines: [
        [PRODUCTS.parma.productId, 2],
        [PRODUCTS.lagerPint.productId, 2],
      ],
      promotions: PROPOSED_PROMOTIONS,
      policy: BEST_PRICE,
    });

    expect(result.totalCents).toBe(5500);
  });

  it("splits the bundle price across lines so reporting adds up exactly", () => {
    const result = quote({
      at: THU_530PM,
      lines: [
        [PRODUCTS.parma.productId, 2],
        [PRODUCTS.lagerPint.productId, 3],
      ],
      promotions: PROPOSED_PROMOTIONS,
      policy: BEST_PRICE,
    });

    const bundled = result.lines.filter((line) => line.bundleGroup !== null);
    expect(bundled.reduce((total, line) => total + line.finalCents, 0)).toBe(5500);
    // The third pint isn't in the bundle and gets happy hour instead.
    const extraPint = result.lines.find(
      (line) => line.productId === PRODUCTS.lagerPint.productId && line.bundleGroup === null,
    );
    expect(extraPint).toMatchObject({ quantity: 1, finalCents: 1020 });
  });

  it("never charges a 'deal' price above the menu price", () => {
    const result = quote({
      at: TUE_7PM,
      lines: [[PRODUCTS.lagerPot.productId, 1]],
      promotions: [
        promo({ promotionId: "X", name: "Silly", type: "fixed_price", value: 5000, appliesTo: { kind: "all" } }),
      ],
      policy: BEST_PRICE,
    });

    expect(result.totalCents).toBe(800);
  });

  it("stacks only where a rule explicitly allows it", () => {
    const memberOnFood = promo({
      ...PROPOSED_PROMOTIONS[1]!,
      stacksWith: ["PRM-23"],
    });
    const result = quote({
      at: TUE_7PM,
      audience: "member",
      lines: [
        [PRODUCTS.schnitzel.productId, 1],
        [PRODUCTS.lagerPot.productId, 1],
      ],
      promotions: [HAPPY_HOUR, memberOnFood, PROPOSED_PROMOTIONS[2]!],
      policy: BEST_PRICE,
    });

    expect(result.totalCents).toBe(1620);
  });

  it("counts deals allowed on top when choosing the best deal", () => {
    // 20% off beats 15% off on its own, but members may add their 10% only
    // to the 15%: $26 → $22.10 → $19.89 is cheaper than $26 → $20.80.
    const fifteen = promo({
      promotionId: "PRM-30",
      name: "Fifteen off",
      value: 15,
      appliesTo: { kind: "products", productIds: [PRODUCTS.schnitzel.productId] },
    });
    const twenty = promo({
      promotionId: "PRM-31",
      name: "Twenty off",
      value: 20,
      appliesTo: { kind: "products", productIds: [PRODUCTS.schnitzel.productId] },
    });
    const memberOnFifteen = promo({ ...PROPOSED_PROMOTIONS[1]!, stacksWith: ["PRM-30"] });

    const result = quote({
      at: WED_430PM,
      audience: "member",
      lines: [[PRODUCTS.schnitzel.productId, 1]],
      promotions: [fifteen, twenty, memberOnFifteen],
      policy: BEST_PRICE,
    });

    expect(result.totalCents).toBe(1989);
    expect(result.lines[0]?.applied.map((a) => [a.name, a.role, a.discountCents])).toEqual([
      ["Fifteen off", "primary", 390],
      ["Member Discount", "stacked", 221],
    ]);
    expect(result.lines[0]?.skipped).toEqual([
      {
        promotionId: "PRM-31",
        name: "Twenty off",
        reason: "One deal per item — Fifteen off is cheaper ($19.89 vs $20.80)",
      },
    ]);
  });

  it("counts deals allowed on top when deciding whether a bundle is cheaper", () => {
    // $32 bundle vs $30.60 with the member's 10%: the bundle only wins because
    // the member's 10% may go on top of it ($32 → $28.80).
    const bundle = promo({ ...SCHNITZEL_TUESDAY, value: 3200 });
    const memberOnBundle = promo({ ...PROPOSED_PROMOTIONS[1]!, stacksWith: ["PRM-23"] });

    const result = quote({
      at: TUE_7PM,
      audience: "member",
      lines: [
        [PRODUCTS.schnitzel.productId, 1],
        [PRODUCTS.lagerPot.productId, 1],
      ],
      promotions: [bundle, memberOnBundle],
      policy: BEST_PRICE,
    });

    expect(result.totalCents).toBe(2880);
    for (const line of result.lines) {
      expect(line.applied.map((a) => [a.name, a.role])).toEqual([
        ["Schnitzel Tuesday", "bundle"],
        ["Member Discount", "stacked"],
      ]);
    }
  });

  it("rejects products the venue doesn't sell", () => {
    expect(() =>
      quote({ at: TUE_7PM, lines: [["PRD-9999", 1]], promotions: [], policy: BEST_PRICE }),
    ).toThrow(UnknownProductError);
  });
});

describe("priceBasket — a bundle never costs more than its items", () => {
  const overpricedBundle = promo({ ...PARMA_AND_PINT, value: 10000 });
  const exactBundle = promo({ ...PARMA_AND_PINT, value: 8200 });

  it.each([
    ["priority", PRIORITY, overpricedBundle, "Bundle price isn't below the menu price ($100.00 vs $82.00)"],
    ["best price", BEST_PRICE, overpricedBundle, "Bundle price isn't below the menu price ($100.00 vs $82.00)"],
    ["priority", PRIORITY, exactBundle, "Bundle price isn't below the menu price ($82.00 vs $82.00)"],
  ] as const)("skips a bundle priced at or above the menu (%s policy)", (_label, policy, bundle, reason) => {
    const result = quote({
      at: THU_630PM,
      lines: [
        [PRODUCTS.parma.productId, 2],
        [PRODUCTS.lagerPint.productId, 2],
      ],
      promotions: [bundle],
      policy,
    });

    expect(result.totalCents).toBe(8200);
    expect(result.discountCents).toBe(0);
    for (const line of result.lines) {
      expect(line.bundleGroup).toBeNull();
      expect(line.skipped).toEqual([{ promotionId: "PRM-25", name: "Parma & Pint for Two", reason }]);
    }
  });

  it("still forms a bundle priced below the menu under the priority policy", () => {
    const result = quote({
      at: THU_630PM,
      lines: [
        [PRODUCTS.parma.productId, 2],
        [PRODUCTS.lagerPint.productId, 2],
      ],
      promotions: [promo({ ...PARMA_AND_PINT, value: 8199 })],
      policy: PRIORITY,
    });

    expect(result.totalCents).toBe(8199);
  });
});

describe("priceBasket — venues, dates and late trading", () => {
  const BISTRO = "VEN-0907";
  const bistroHappyHour = promo({
    ...HAPPY_HOUR,
    venueOverrides: [{ venueId: BISTRO, enabled: true, startsAt: "17:00", endsAt: "19:00" }],
  });

  it("runs the bistro's happy hour 5–7 while pubs keep 4–6", () => {
    const at = (time: string, venueId: string) =>
      quote({
        at: `2026-09-21T${time}`,
        venueId,
        lines: [[PRODUCTS.lagerPint.productId, 1]],
        promotions: [bistroHappyHour],
        policy: BEST_PRICE,
      });

    expect(at("16:30", BISTRO).totalCents).toBe(1200);
    expect(at("16:30", BISTRO).lines[0]?.skipped[0]?.reason).toBe("Runs 5pm–7pm at this venue");
    expect(at("18:30", BISTRO).totalCents).toBe(1020);
    expect(at("16:30", "VEN-0233").totalCents).toBe(1020);
    expect(at("18:30", "VEN-0233").totalCents).toBe(1200);
  });

  it("runs a one-day deal only on its date (Melbourne Cup)", () => {
    const cup = promo({
      promotionId: "CUP",
      name: "Melbourne Cup",
      value: 20,
      schedule: { days: ["tue"], startsAt: "11:00", endsAt: "19:00", validFrom: "2026-11-03", validTo: "2026-11-03" },
    });
    const at = (date: string) =>
      quote({
        at: `${date}T15:00`,
        lines: [[PRODUCTS.lagerPint.productId, 1]],
        promotions: [cup],
        policy: BEST_PRICE,
      });

    expect(at("2026-10-27").totalCents).toBe(1200);
    expect(at("2026-10-27").lines[0]?.skipped[0]?.reason).toBe("Starts Tue 3 Nov");
    expect(at("2026-11-03").totalCents).toBe(960);
  });

  it("counts 12:30am as the previous night's trading day", () => {
    const lateTuesday = promo({
      promotionId: "LATE",
      name: "Tuesday Late",
      schedule: { days: ["tue"], startsAt: "21:00", endsAt: "02:00", validFrom: null, validTo: null },
    });
    const result = quote({
      at: "2026-09-23T00:30",
      lines: [[PRODUCTS.lagerPint.productId, 1]],
      promotions: [lateTuesday],
      policy: BEST_PRICE,
    });

    expect(result.totalCents).toBe(1080);
    expect(result.notes[0]).toContain("Tuesday");
  });

  it("ignores switched-off deals and deals for other customer types", () => {
    const result = quote({
      at: TUE_7PM,
      lines: [[PRODUCTS.lagerPint.productId, 1]],
      promotions: [
        promo({ promotionId: "OFF", name: "Off", active: false }),
        promo({ promotionId: "STAFF", name: "Staff", audience: "staff" }),
      ],
      policy: BEST_PRICE,
    });

    expect(result.totalCents).toBe(1200);
    expect(result.lines[0]?.skipped).toEqual([]);
  });
});
