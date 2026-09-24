import { z } from "zod";

export const MemberSchema = z.object({
  memberNumber: z.string().min(1),
  name: z.string().min(1),
  tier: z.string(),
  discountPct: z.number().int().min(0).max(100),
  active: z.boolean(),
});
