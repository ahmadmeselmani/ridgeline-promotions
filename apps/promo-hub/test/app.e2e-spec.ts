import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { useFreshDatabase } from "../src/testing/test-database";

describe("Promo hub (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    useFreshDatabase();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer() as Server;

  it("POST /pricing/quote returns the price and the reasons in the envelope", async () => {
    const response = await request(server())
      .post("/pricing/quote")
      .send({
        venueId: "VEN-0233",
        localDateTime: "2026-09-23T16:30",
        customer: { kind: "member", memberNumber: "M-004183" },
        lines: [{ productId: "PRD-0101", quantity: 2 }],
      })
      .expect(200);

    const body = response.body as { data: { totalCents: number; lines: Array<{ skipped: unknown[] }> } };
    expect(body.data.totalCents).toBe(2040);
    expect(body.data.lines[0]?.skipped).toHaveLength(1);
  });

  it("rejects a quote with both a wall-clock time and an instant", async () => {
    await request(server())
      .post("/pricing/quote")
      .send({
        venueId: "VEN-0233",
        localDateTime: "2026-09-23T16:30",
        at: "2026-09-23T07:00:00Z",
        customer: { kind: "guest" },
        lines: [{ productId: "PRD-0101", quantity: 1 }],
      })
      .expect(400);
  });

  it.each(["2026-09-23T99:99", "2026-02-30T16:30"])(
    "rejects the invalid venue-local time %s",
    async (localDateTime) => {
      await request(server())
        .post("/pricing/quote")
        .send({
          venueId: "VEN-0233",
          localDateTime,
          customer: { kind: "guest" },
          lines: [{ productId: "PRD-0101", quantity: 1 }],
        })
        .expect(400);
    },
  );

  // The editor shows `message` as the error toast, so it must say what's wrong.
  it("PATCH /promotions/:id validates the merged promotion with a readable message", async () => {
    const response = await request(server())
      .patch("/promotions/PRM-21")
      .send({ value: 150 })
      .expect(400);

    const body = response.body as { message: string; issues: { properties?: Record<string, unknown> } };
    expect(body.message).toBe("value: A percentage can't be over 100");
    expect(body.issues.properties).toHaveProperty("value");
  });

  it("a malformed request body names the field that's wrong", async () => {
    const response = await request(server())
      .patch("/promotions/PRM-21")
      .send({ schedule: { days: [], startsAt: "16:00", endsAt: "18:00", validFrom: null, validTo: null } })
      .expect(400);

    const body = response.body as { message: string };
    expect(body.message).toMatch(/^schedule\.days: /);
  });

  it("rejects impossible promotion schedules", async () => {
    const startsAt = await request(server())
      .patch("/promotions/PRM-21")
      .send({
        schedule: {
          days: ["mon"],
          startsAt: "24:00",
          endsAt: "01:00",
          validFrom: null,
          validTo: null,
        },
      })
      .expect(400);
    expect((startsAt.body as { message: string }).message).toMatch(/^schedule\.startsAt: /);

    const dates = await request(server())
      .patch("/promotions/PRM-21")
      .send({
        schedule: {
          days: ["mon"],
          startsAt: "16:00",
          endsAt: "18:00",
          validFrom: "2026-12-31",
          validTo: "2026-01-01",
        },
      })
      .expect(400);
    expect((dates.body as { message: string }).message).toMatch(/^schedule\.validTo: /);
  });

  it("GET /rulebooks/draft/status and POST /promotions/:id/restore work over HTTP", async () => {
    await request(server()).delete("/promotions/PRM-25").expect(204);

    const before = await request(server()).get("/rulebooks/draft/status").expect(200);
    const deals = (before.body as { data: { deals: Array<{ promotionId: string; status: string }> } }).data.deals;
    expect(deals).toContainEqual({ promotionId: "PRM-25", status: "removed" });

    await request(server()).post("/promotions/PRM-25/restore").expect(201);
    const after = await request(server()).get("/rulebooks/draft/status").expect(200);
    expect((after.body as { data: { removed: unknown[] } }).data.removed).toEqual([]);

    // "draft/status" must not be swallowed by GET /rulebooks/:name.
    await request(server()).get("/rulebooks/draft").expect(200);
  });

  it("an unknown product is refused with a readable message", async () => {
    const response = await request(server())
      .patch("/promotions/PRM-21")
      .send({ appliesTo: { kind: "products", productIds: ["PRD-9999"] } })
      .expect(400);

    expect((response.body as { message: string }).message).toBe("Unknown product PRD-9999");
  });
});
