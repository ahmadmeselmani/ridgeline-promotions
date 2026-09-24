import { z } from "zod";
import { ScenarioSchema } from "./scenario.schema";

export const ScenarioResponseSchema = ScenarioSchema;

export type ScenarioResponse = z.infer<typeof ScenarioResponseSchema>;
