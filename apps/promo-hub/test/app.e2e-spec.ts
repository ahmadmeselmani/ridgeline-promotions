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

  it("PATCH /promotions/:id validates the merged promotion", async () => {
    await request(server())
      .patch("/promotions/PRM-21")
      .send({ value: 150 })
      .expect(400);
  });
});
