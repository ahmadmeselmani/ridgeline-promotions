import { Injectable } from "@nestjs/common";
import type { PriceOverride } from "@ridgeline/contracts/overrides";
import type { PriceOverride as PriceOverrideRow } from "../database/generated/prisma/client";
import { PrismaService } from "../database/prisma.service";

export type NewPriceOverride = Omit<
  PriceOverride,
  "overrideId" | "discountCents" | "createdAt"
>;

// Stored here for the prototype. In production this belongs on the Trestle
// sale line itself (see README: API changes to propose).
@Injectable()
export class OverridesClient {
  constructor(private readonly prisma: PrismaService) {}

  async create(override: NewPriceOverride): Promise<PriceOverride> {
    return toModel(await this.prisma.priceOverride.create({ data: override }));
  }

  async findMany(venueId?: string): Promise<PriceOverride[]> {
    const rows = await this.prisma.priceOverride.findMany({
      where: venueId ? { venueId } : undefined,
      orderBy: { seq: "desc" },
    });
    return rows.map(toModel);
  }
}

function toModel(row: PriceOverrideRow): PriceOverride {
  return {
    overrideId: `OVR-${row.seq}`,
    venueId: row.venueId,
    staffId: row.staffId,
    productId: row.productId,
    quotedCents: row.quotedCents,
    chargedCents: row.chargedCents,
    discountCents: row.quotedCents - row.chargedCents,
    reason: row.reason,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}
