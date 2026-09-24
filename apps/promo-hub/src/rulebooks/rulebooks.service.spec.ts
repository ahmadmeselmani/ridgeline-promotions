import { type INestApplicationContext, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { DealStatus, DraftStatusResponse } from "@ridgeline/contracts/rulebooks";
import { AppModule } from "../app.module";
import { PricingService } from "../pricing/pricing.service";
import { PromotionsService } from "../promotions/promotions.service";
import { useFreshDatabase } from "../testing/test-database";
import { RulebooksService } from "./rulebooks.service";

describe("RulebooksService — deal status", () => {
  let app: INestApplicationContext;
  let rulebooks: RulebooksService;
  let promotions: PromotionsService;
  let pricing: PricingService;

  beforeEach(async () => {
    useFreshDatabase();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = await moduleRef.init();
    rulebooks = moduleRef.get(RulebooksService);
    promotions = moduleRef.get(PromotionsService);
    pricing = moduleRef.get(PricingService);
  });

  afterEach(async () => {
    await app.close();
  });

  const statuses = (status: DraftStatusResponse): Record<string, DealStatus> =>
    Object.fromEntries(status.deals.map((deal) => [deal.promotionId, deal.status]));

  it("shows every seeded deal as published when the draft matches the tills", async () => {
    const status = await rulebooks.draftStatus();
    expect(new Set(Object.values(statuses(status)))).toEqual(new Set(["published"]));
    expect(status.removed).toEqual([]);
    expect(status.policyChanged).toBe(false);
  });

  it("marks an edited deal as changed and leaves the rest published", async () => {
    await promotions.update("PRM-21", {
      venueOverrides: [{ venueId: "VEN-0907", enabled: true, startsAt: "17:00", endsAt: "19:00" }],
    });

    const status = statuses(await rulebooks.draftStatus());
    expect(status["PRM-21"]).toBe("changed");
    expect(status["PRM-24"]).toBe("published");
  });

  it("marks a deal that only exists in the draft as new", async () => {
    const cup = await promotions.create({
      ...(await promotions.findOne("draft", "PRM-21")),
      name: "Melbourne Cup",
      venueIds: ["VEN-1160", "VEN-1207"],
    });

    expect(statuses(await rulebooks.draftStatus())[cup.promotionId]).toBe("new");
  });

  it("marks a published deal switched off in the draft as turned off, even with other edits", async () => {
    await promotions.update("PRM-22", { active: false });
    expect(statuses(await rulebooks.draftStatus())["PRM-22"]).toBe("turned_off");

    await promotions.update("PRM-22", { value: 12 });
    expect(statuses(await rulebooks.draftStatus())["PRM-22"]).toBe("turned_off");
  });

  it("previews who a turned-off deal affects before it reaches New rules", async () => {
    await promotions.update("PRM-22", { active: false });

    const impact = await pricing.impact({ from: "live", to: "draft" });
    // Only the late pint moves: the other members already get a better deal.
    expect(impact.changed.map((item) => [item.scenarioId, item.deltaCents])).toEqual([["late-friday", 130]]);
  });

  it("treats switching a deal back on before publishing as published again", async () => {
    await promotions.update("PRM-22", { active: false });
    await promotions.update("PRM-22", { active: true });

    expect(statuses(await rulebooks.draftStatus())["PRM-22"]).toBe("published");
  });

  it("keeps a removed deal visible, with its live version, until it's published", async () => {
    const live = await promotions.findOne("live", "PRM-25");
    await promotions.remove("PRM-25");

    const status = await rulebooks.draftStatus();
    expect(statuses(status)["PRM-25"]).toBe("removed");
    expect(status.removed).toEqual([live]);

    await rulebooks.publish();
    const after = await rulebooks.draftStatus();
    expect(statuses(after)["PRM-25"]).toBeUndefined();
    expect(after.removed).toEqual([]);
  });

  it("shows everything as published once the draft is published", async () => {
    await promotions.update("PRM-22", { active: false });
    await promotions.update("PRM-21", { value: 20 });
    await rulebooks.publish();

    const status = statuses(await rulebooks.draftStatus());
    expect(status["PRM-21"]).toBe("published");
    expect(status["PRM-22"]).toBe("published");
  });

  it("flags a changed clash rule separately, since it isn't part of any one deal", async () => {
    await rulebooks.updateDraftPolicy({ resolution: "priority" });

    const status = await rulebooks.draftStatus();
    expect(status.policyChanged).toBe(true);
    expect(new Set(Object.values(statuses(status)))).toEqual(new Set(["published"]));
  });
});

describe("PromotionsService.restore — undo for one deal", () => {
  let app: INestApplicationContext;
  let rulebooks: RulebooksService;
  let promotions: PromotionsService;

  beforeEach(async () => {
    useFreshDatabase();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = await moduleRef.init();
    rulebooks = moduleRef.get(RulebooksService);
    promotions = moduleRef.get(PromotionsService);
  });

  afterEach(async () => {
    await app.close();
  });

  const statusOf = async (promotionId: string) =>
    (await rulebooks.draftStatus()).deals.find((deal) => deal.promotionId === promotionId)?.status;

  it("brings back a removed deal exactly as the tills run it", async () => {
    const live = await promotions.findOne("live", "PRM-25");
    await promotions.remove("PRM-25");

    await promotions.restore("PRM-25");

    expect(await promotions.findOne("draft", "PRM-25")).toEqual(live);
    expect(await statusOf("PRM-25")).toBe("published");
  });

  it("drops unpublished edits to one deal and leaves other edits alone", async () => {
    await promotions.update("PRM-21", { value: 20 });
    await promotions.update("PRM-22", { active: false });

    await promotions.restore("PRM-21");

    expect((await promotions.findOne("draft", "PRM-21")).value).toBe(15);
    expect(await statusOf("PRM-21")).toBe("published");
    expect(await statusOf("PRM-22")).toBe("turned_off");
  });

  it("doesn't bring back a stacking link to a deal that's no longer in the draft", async () => {
    await promotions.update("PRM-22", { stacksWith: ["PRM-23"] });
    await rulebooks.publish();
    await promotions.remove("PRM-23");
    await promotions.remove("PRM-22");

    const restored = await promotions.restore("PRM-22");

    expect(restored.stacksWith).toEqual([]);
    // Not identical to the published New rules, so it still needs publishing.
    expect(await statusOf("PRM-22")).toBe("changed");
  });

  it("restores published deals that stacked on a removed deal", async () => {
    await promotions.update("PRM-22", { stacksWith: ["PRM-23"] });
    await rulebooks.publish();

    await promotions.remove("PRM-23");
    expect((await promotions.findOne("draft", "PRM-22")).stacksWith).toEqual(["PRM-23"]);

    await promotions.restore("PRM-23");

    expect((await promotions.findOne("draft", "PRM-22")).stacksWith).toEqual(["PRM-23"]);
    expect(await statusOf("PRM-22")).toBe("published");
    expect(await statusOf("PRM-23")).toBe("published");
  });

  it("doesn't restore an incoming stacking link that was separately edited", async () => {
    await promotions.update("PRM-22", { stacksWith: ["PRM-23"] });
    await rulebooks.publish();

    await promotions.update("PRM-22", { stacksWith: [] });
    await promotions.remove("PRM-23");
    await promotions.restore("PRM-23");

    expect((await promotions.findOne("draft", "PRM-22")).stacksWith).toEqual([]);
    expect(await statusOf("PRM-22")).toBe("changed");
    expect(await statusOf("PRM-23")).toBe("published");
  });

  it("allows unrelated edits while a preserved stacking target is deleted", async () => {
    await promotions.update("PRM-22", { stacksWith: ["PRM-23"] });
    await rulebooks.publish();

    await promotions.remove("PRM-23");
    const updated = await promotions.update("PRM-22", { description: "Updated copy" });

    expect(updated.description).toBe("Updated copy");
    expect(updated.stacksWith).toEqual(["PRM-23"]);
  });

  it("removes dangling stacking links when a deletion is published", async () => {
    await promotions.update("PRM-22", { stacksWith: ["PRM-23"] });
    await rulebooks.publish();

    await promotions.remove("PRM-23");
    await rulebooks.publish();

    expect((await promotions.findOne("live", "PRM-22")).stacksWith).toEqual([]);
    expect((await promotions.findOne("draft", "PRM-22")).stacksWith).toEqual([]);
    expect((await rulebooks.findAll()).find((item) => item.name === "draft")?.hasUnpublishedChanges).toBe(false);
  });

  it("refuses to restore a deal that was never published", async () => {
    const cup = await promotions.create({
      ...(await promotions.findOne("draft", "PRM-21")),
      name: "Melbourne Cup",
    });

    await expect(promotions.restore(cup.promotionId)).rejects.toThrow(NotFoundException);
  });
});
