import { Injectable } from "@nestjs/common";
import type { Scenario } from "@ridgeline/contracts/scenarios";
import { SCENARIOS } from "./scenarios.data";

@Injectable()
export class ScenariosClient {
  findMany(): Scenario[] {
    return structuredClone(SCENARIOS);
  }
}
