import { z } from "zod";
import {
  PricingPolicySchema,
  ResolutionPolicySchema,
  RulebookNameSchema,
  RulebookSchema,
} from "./rulebook.schema";

export type RulebookName = z.infer<typeof RulebookNameSchema>;
export type ResolutionPolicy = z.infer<typeof ResolutionPolicySchema>;
export type PricingPolicy = z.infer<typeof PricingPolicySchema>;
export type Rulebook = z.infer<typeof RulebookSchema>;
