import { z } from "zod";
import { LocalDateTimeSchema } from "../common/common.schema";
import { BasketLineSchema, CustomerSchema } from "../pricing/pricing.schema";

// A named till situation from the brief. Used as simulator quick-picks and as
// the regression set for "what changes if I publish this?".
export const ScenarioSchema = z.object({
  scenarioId: z.string().min(1),
  title: z.string().min(1),
  story: z.string(),
  venueId: z.string().min(1),
  localDateTime: LocalDateTimeSchema,
  customer: CustomerSchema,
  lines: z.array(BasketLineSchema).min(1),
});
