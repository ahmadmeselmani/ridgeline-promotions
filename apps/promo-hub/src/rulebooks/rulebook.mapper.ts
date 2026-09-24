import type { Promotion } from "@ridgeline/contracts/promotions";
import { PromotionSchema } from "@ridgeline/contracts/promotions";
import {
  Prisma,
  type Promotion as PromotionRow,
} from "../database/generated/prisma/client";

// Promotion ⇄ row. JSON columns are re-validated with the shared Zod schema on
// the way out, so a hand-edited row can never reach the pricing engine
// half-formed.

export function toPromotionRows(
  promotions: readonly Promotion[],
): Prisma.PromotionCreateWithoutRulebookInput[] {
  return promotions.map((promotion, position) => ({
    promotionId: promotion.promotionId,
    position,
    name: promotion.name,
    description: promotion.description,
    type: promotion.type,
    value: promotion.value,
    audience: promotion.audience,
    priority: promotion.priority,
    active: promotion.active,
    appliesTo: promotion.appliesTo,
    schedule: promotion.schedule,
    venueIds: promotion.venueIds ?? Prisma.DbNull,
    venueOverrides: promotion.venueOverrides,
    stacksWith: promotion.stacksWith,
  }));
}

export function fromPromotionRow(row: PromotionRow): Promotion {
  return PromotionSchema.parse({
    promotionId: row.promotionId,
    name: row.name,
    description: row.description,
    type: row.type,
    value: row.value,
    audience: row.audience,
    priority: row.priority,
    active: row.active,
    appliesTo: row.appliesTo,
    schedule: row.schedule,
    venueIds: row.venueIds,
    venueOverrides: row.venueOverrides,
    stacksWith: row.stacksWith,
  });
}
