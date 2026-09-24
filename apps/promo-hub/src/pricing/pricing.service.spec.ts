import { BadRequestException, type INestApplicationContext } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { QuoteRequest } from "@ridgeline/contracts/pricing";
import { AppModule } from "../app.module";
import { PromotionsService } from "../promotions/promotions.service";
import { RulebooksService } from "../rulebooks/rulebooks.service";
import { useFreshDatabase } from "../testing/test-database";
import { PricingService } from "./pricing.service";

describe("PricingService", () => {
  let app: INestApplicationContext;
  let pricing: PricingService;
  let promotions: PromotionsService;
  let rulebooks: RulebooksService;

  beforeEach(async () => {
    useFreshDatabase();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = await moduleRef.init();
    pricing = moduleRef.get(PricingService);
    promotions = moduleRef.get(PromotionsService);
    rulebooks = moduleRef.get(RulebooksService);
  });

  afterEach(async () => {
    await app.close();
  });

  const raysTuesday = (rulebook: QuoteRequest["rulebook"]): QuoteRequest => ({
    rulebook,
    venueId: "VEN-0233",
    localDateTime: "2026-09-22T19:00",
    customer: { kind: "member", memberNumber: "M-004182" },
    lines: [{ productId: "PRD-0201", quantity: 1 }],
  });

  it("reproduces today's till from the Trestle fixtures: Ray pays $16.20", async () => {
    expect((await pricing.quote(raysTuesday("legacy"))).totalCents).toBe(1620);
  });

  it("prices Ray's schnitzel and pot at $18 under the published rules", async () => {
    const quote = await pricing.quote({
      ...raysTuesday("live"),
      lines: [
        { productId: "PRD-0201", quantity: 1 },
        { productId: "PRD-0109", quantity: 1 },
      ],
    });
    expect(quote.totalCents).toBe(1800);
    expect(quote.customer.label).toBe("R. Castellano (gold member)");
  });

  it("converts a till timestamp to venue time before pricing", async () => {
    // 07:00Z on 23 Sep = 4:30pm in Adelaide (+09:30): happy hour.
    const quote = await pricing.quote({
      rulebook: "live",
      venueId: "VEN-0233",
      at: "2026-09-23T07:00:00Z",
      customer: { kind: "guest" },
      lines: [{ productId: "PRD-0101", quantity: 1 }],
    });
    expect(quote.moment.localDateTime).toBe("2026-09-23T16:30");
    expect(quote.totalCents).toBe(1020);
  });

  it("prices a lapsed member as a guest and says so", async () => {
    const quote = await pricing.quote({
      ...raysTuesday("live"),
      customer: { kind: "member", memberNumber: "M-003920" },
    });
    expect(quote.customer.audience).toBeNull();
    expect(quote.notes[0]).toContain("inactive");
  });

  it("rejects products the venue doesn't sell", async () => {
    await expect(
      pricing.quote({ ...raysTuesday("live"), lines: [{ productId: "PRD-9999", quantity: 1 }] }),
    ).rejects.toThrow(BadRequestException);
  });

  it("shows what changes from today's till to the new rules", async () => {
    const impact = await pricing.impact({ from: "legacy", to: "live" });
    const ids = impact.changed.map((item) => item.scenarioId);
    expect(ids).toEqual(
      expect.arrayContaining(["ray-tuesday", "member-happy-hour", "staff-parma"]),
    );
    const staff = impact.changed.find((item) => item.scenarioId === "staff-parma");
    expect(staff?.deltaCents).toBe(5500 - 5740);
  });

  it("previews the bistro's 5–7 happy hour, persists it, and publishes it", async () => {
    await promotions.update("PRM-21", {
      venueOverrides: [{ venueId: "VEN-0907", enabled: true, startsAt: "17:00", endsAt: "19:00" }],
    });

    const impact = await pricing.impact({ from: "live", to: "draft" });
    expect(impact.changed.map((item) => item.scenarioId)).toEqual(["bistro-630pm"]);
    expect(impact.changed[0]?.deltaCents).toBe(-180);

    // Nothing reaches the tills until it's published.
    const summaries = await rulebooks.findAll();
    expect(summaries.find((r) => r.name === "draft")?.hasUnpublishedChanges).toBe(true);
    await rulebooks.publish();
    expect((await pricing.impact({ from: "live", to: "draft" })).changed).toEqual([]);
    const live = await rulebooks.findOne("live");
    expect(live.promotions.find((p) => p.promotionId === "PRM-21")?.venueOverrides).toHaveLength(1);
  });

  it("refuses to publish when there's nothing to publish", async () => {
    await expect(rulebooks.publish()).rejects.toThrow(BadRequestException);
  });

  it("flags today's double discounts in the clash grid", async () => {
    const grid = await pricing.clashGrid({ venueId: "VEN-0233", rulebook: "legacy", weekOf: "2026-09-21" });
    const monday4pm = grid.days[0]?.slots.find((slot) => slot.startsAt === "16:00");
    expect(monday4pm?.clashes.some((clash) => clash.kind === "stacks")).toBe(true);
  });
});
