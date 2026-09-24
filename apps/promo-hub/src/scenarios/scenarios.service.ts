import { Injectable } from "@nestjs/common";
import type { ScenarioResponse } from "@ridgeline/contracts/scenarios";
import { ScenariosClient } from "./scenarios.client";

@Injectable()
export class ScenariosService {
  constructor(private readonly scenariosClient: ScenariosClient) {}

  findAll(): ScenarioResponse[] {
    return this.scenariosClient.findMany();
  }
}
