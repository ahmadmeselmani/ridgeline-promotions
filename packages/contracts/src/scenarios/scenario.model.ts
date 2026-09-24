import { z } from "zod";
import { ScenarioSchema } from "./scenario.schema";

export type Scenario = z.infer<typeof ScenarioSchema>;
