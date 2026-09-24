import { z } from "zod";
import { RulebookNameSchema } from "@ridgeline/contracts/rulebooks";

export const VENUE_ID_PARAMS = {
  venueId: z.string().describe("Trestle venue id, e.g. VEN-0233"),
} as const;

export const PROMOTION_ID_PARAMS = {
  promotionId: z.string().describe("Promotion id, e.g. PRM-21"),
} as const;

export const RULEBOOK_QUERY = {
  rulebook: RulebookNameSchema.optional().describe("legacy | live | draft"),
} as const;
