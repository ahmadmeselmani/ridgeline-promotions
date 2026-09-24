import type { PrismaClient } from "../../database/generated/prisma/client";
import { toPromotionRows } from "../rulebook.mapper";
import { PROPOSED_POLICY, PROPOSED_PROMOTIONS } from "./proposed-rulebook";

// Idempotent: only creates a rulebook that doesn't exist yet, so running the
// seed on every `pnpm dev` never overwrites Tania's draft.
export async function seedRulebooks(prisma: PrismaClient): Promise<string[]> {
  const created: string[] = [];
  for (const name of ["live", "draft"] as const) {
    const exists = await prisma.rulebook.findUnique({ where: { name } });
    if (exists) continue;
    await prisma.rulebook.create({
      data: {
        name,
        resolution: PROPOSED_POLICY.resolution,
        promotions: { create: toPromotionRows(PROPOSED_PROMOTIONS) },
      },
    });
    created.push(name);
  }
  return created;
}
