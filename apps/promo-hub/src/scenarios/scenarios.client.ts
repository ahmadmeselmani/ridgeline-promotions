import { Injectable } from "@nestjs/common";
import type { Scenario } from "@ridgeline/contracts/scenarios";
import { SCENARIOS } from "./seed/scenarios";

@Injectable()
export class ScenariosClient {
  findMany(): Scenario[] {
    return structuredClone(SCENARIOS);
  }
}
