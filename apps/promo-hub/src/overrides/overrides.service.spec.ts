import { ForbiddenException, type INestApplicationContext } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app.module";
import { useFreshDatabase } from "../testing/test-database";
import { OverridesService } from "./overrides.service";

describe("OverridesService", () => {
  let app: INestApplicationContext;
  let service: OverridesService;

  beforeEach(async () => {
    useFreshDatabase();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = await moduleRef.init();
    service = moduleRef.get(OverridesService);
  });

  afterEach(async () => {
    await app.close();
  });

  const base = {
    venueId: "VEN-0233",
    productId: "PRD-0201",
    quotedCents: 1800,
    chargedCents: 1620,
    reason: "customer_complaint" as const,
    note: "Ray",
  };

  it("refuses a manual price from a casual without override permission", async () => {
    await expect(service.create({ ...base, staffId: "STF-11" })).rejects.toThrow(ForbiddenException);
  });

  it("records a supervisor's override with its reason, separately from promotions", async () => {
    const first = await service.create({ ...base, staffId: "STF-21" });
    await service.create({ ...base, staffId: "STF-51", reason: "wastage_or_error", chargedCents: 0 });

    expect(first).toMatchObject({ overrideId: "OVR-1", discountCents: 180 });
    expect(await service.summary("VEN-0233")).toEqual({
      count: 2,
      discountCents: 180 + 1800,
      byReason: [
        { reason: "customer_complaint", count: 1, discountCents: 180 },
        { reason: "wastage_or_error", count: 1, discountCents: 1800 },
      ],
      byStaff: [
        { staffId: "STF-21", count: 1, discountCents: 180 },
        { staffId: "STF-51", count: 1, discountCents: 1800 },
      ],
    });
  });
});
