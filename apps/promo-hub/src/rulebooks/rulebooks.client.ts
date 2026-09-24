import { Injectable } from "@nestjs/common";
import type { Rulebook, RulebookName } from "@ridgeline/contracts/rulebooks";
import { PrismaService } from "../database/prisma.service";
import { ASSUMED_PRODUCTS } from "../trestle/assumptions";
import { TrestleService } from "../trestle/trestle.service";
import { fromPromotionRow, toPromotionRows } from "./rulebook.mapper";
import { mapLegacyPromotion } from "./legacy.mapper";

export type StoredRulebookName = Exclude<RulebookName, "legacy">;

/**
 * live and draft are stored in SQLite. legacy is never stored: it's Trestle's
 * own config, read fresh from Trestle every time so it can't drift.
 */
@Injectable()
export class RulebooksClient {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trestle: TrestleService,
  ) {}

  async findUnique(name: RulebookName): Promise<Rulebook> {
    if (name === "legacy") return this.legacy();

    const row = await this.prisma.rulebook.findUnique({
      where: { name },
      include: { promotions: { orderBy: { position: "asc" } } },
    });
    if (!row) {
      throw new Error(
        `Rulebook ${name} has not been seeded — run: pnpm --filter promo-hub db:seed`,
      );
    }
    return {
      name,
      policy: { resolution: row.resolution },
      promotions: row.promotions.map(fromPromotionRow),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  // Replaces the whole rulebook in one transaction: a publish either lands
  // completely or not at all.
  async save(
    rulebook: Omit<Rulebook, "name" | "updatedAt"> & { name: StoredRulebookName },
  ): Promise<Rulebook> {
    const { name } = rulebook;
    await this.prisma.$transaction([
      this.prisma.rulebook.upsert({
        where: { name },
        create: { name, resolution: rulebook.policy.resolution },
        update: { resolution: rulebook.policy.resolution },
      }),
      this.prisma.promotion.deleteMany({ where: { rulebookName: name } }),
      this.prisma.promotion.createMany({
        data: toPromotionRows(rulebook.promotions).map((row) => ({
          ...row,
          rulebookName: name,
        })),
      }),
    ]);
    return this.findUnique(name);
  }

  private legacy(): Rulebook {
    const products = [...this.trestle.listProducts(""), ...ASSUMED_PRODUCTS];
    return {
      name: "legacy",
      policy: { resolution: "priority" },
      promotions: this.trestle
        .listPromotions()
        .map((promotion) => mapLegacyPromotion(promotion, products)),
      updatedAt: new Date(0).toISOString(),
    };
  }
}
