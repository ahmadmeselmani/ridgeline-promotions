import type { INestApplicationContext } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app.module";
import { useFreshDatabase } from "../testing/test-database";
import { RulebooksClient } from "./rulebooks.client";
import { PROPOSED_PROMOTIONS } from "../../prisma/seed/data/rulebook";

describe("RulebooksClient", () => {
  let app: INestApplicationContext;
  let client: RulebooksClient;

  beforeEach(async () => {
    useFreshDatabase();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = await moduleRef.init();
    client = moduleRef.get(RulebooksClient);
  });

  afterEach(async () => {
    await app.close();
  });

  it("round-trips the seeded promotions through SQLite unchanged, in order", async () => {
    const live = await client.findUnique("live");
    expect(live.promotions).toEqual(PROPOSED_PROMOTIONS);
  });

  it("stores null venue scope and nested JSON faithfully", async () => {
    const draft = await client.findUnique("draft");
    const cup = {
      ...draft.promotions[0]!,
      promotionId: "PRM-99",
      venueIds: ["VEN-1160"],
      schedule: { ...draft.promotions[0]!.schedule, validFrom: "2026-11-03", validTo: "2026-11-03" },
    };
    await client.save({ ...draft, name: "draft", promotions: [...draft.promotions, cup] });

    const saved = await client.findUnique("draft");
    expect(saved.promotions.at(-1)).toEqual(cup);
    expect(saved.promotions[0]?.venueIds).toBeNull();
  });

  it("never stores legacy: it's always read from Trestle", async () => {
    const legacy = await client.findUnique("legacy");
    expect(legacy.policy.resolution).toBe("priority");
    expect(legacy.promotions.find((p) => p.promotionId === "PRM-22")?.stacksWith).toEqual(["*"]);
  });
});
