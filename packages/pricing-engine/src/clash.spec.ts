import { buildClashGrid } from "./clash";
import { CATALOG, LEGACY_PROMOTIONS, PROPOSED_PROMOTIONS } from "./testing/builders";

const TRADING_HOURS = {
  mon: ["11:00", "23:00"],
  tue: ["11:00", "23:00"],
  wed: ["11:00", "23:00"],
  thu: ["11:00", "00:30"],
  fri: ["11:00", "01:00"],
  sat: ["11:00", "01:00"],
  sun: ["11:00", "22:00"],
} as const satisfies Record<string, [string, string]>;

function slotAt(promotions: typeof LEGACY_PROMOTIONS, resolution: "best_price" | "priority", time: string) {
  const grid = buildClashGrid({
    venueId: "VEN-0233",
    weekOf: "2026-09-21",
    tradingHours: { ...TRADING_HOURS },
    promotions,
    catalog: [...CATALOG.values()],
    policy: { resolution },
  });
  const monday = grid[0];
  return monday?.slots.find((slot) => slot.startsAt === time);
}

describe("buildClashGrid", () => {
  it("flags today's member discount stacking on happy hour as a double discount", () => {
    const slot = slotAt(LEGACY_PROMOTIONS, "priority", "16:00");
    expect(slot?.clashes).toContainEqual(
      expect.objectContaining({ kind: "stacks", promotionIds: ["PRM-21", "PRM-22"] }),
    );
  });

  it("shows the same overlap as a clean 'best deal wins' under the proposed rules", () => {
    const slot = slotAt(PROPOSED_PROMOTIONS, "best_price", "16:00");
    expect(slot?.clashes.every((clash) => clash.kind === "competes")).toBe(true);
    expect(slot?.clashes).toContainEqual(
      expect.objectContaining({
        promotionIds: ["PRM-21", "PRM-22"],
        message: expect.stringContaining("customer gets whichever is cheaper"),
      }),
    );
  });

  it("never pairs member and staff deals — a customer is one or the other", () => {
    const slot = slotAt(PROPOSED_PROMOTIONS, "best_price", "12:00");
    expect(slot?.active.map((a) => a.promotionId)).toEqual(["PRM-22", "PRM-24"]);
    expect(slot?.clashes).toEqual([]);
  });

  it("marks late trading as open on the day it belongs to", () => {
    const grid = buildClashGrid({
      venueId: "VEN-0233",
      weekOf: "2026-09-21",
      tradingHours: { ...TRADING_HOURS },
      promotions: [],
      catalog: [...CATALOG.values()],
      policy: { resolution: "best_price" },
    });
    const friday = grid[4];
    expect(friday?.slots.find((slot) => slot.startsAt === "00:30")?.open).toBe(true);
    expect(friday?.slots.find((slot) => slot.startsAt === "01:00")?.open).toBe(false);
  });
});
