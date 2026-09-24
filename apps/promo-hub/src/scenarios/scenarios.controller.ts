import { Controller, Get } from "@nestjs/common";
import type { ScenarioResponse } from "@ridgeline/contracts/scenarios";
import { ScenarioResponseSchema } from "@ridgeline/contracts/scenarios";
import { ApiControllerDocs, ApiEndpoint, apiResponse } from "@ridgeline/nest-common";
import { SWAGGER_TAGS } from "../common/swagger/swagger.constants";
import { SCENARIOS_PATHS } from "../paths/scenarios";
import { ScenariosService } from "./scenarios.service";

@ApiControllerDocs(SWAGGER_TAGS.scenarios)
@Controller(SCENARIOS_PATHS.PATH_PREFIX)
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @ApiEndpoint({
    summary: "Till situations from the brief, used by the simulator and impact check",
    responses: [apiResponse.okArray(ScenarioResponseSchema)],
  })
  @Get()
  findAll(): ScenarioResponse[] {
    return this.scenariosService.findAll();
  }
}
