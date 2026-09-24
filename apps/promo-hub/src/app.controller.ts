import { Controller, Get } from "@nestjs/common";
import { z } from "zod";
import { ApiControllerDocs, ApiEndpoint, apiResponse } from "@ridgeline/nest-common";
import { SWAGGER_TAGS } from "./common/swagger/swagger.constants";

const HealthSchema = z.object({ status: z.literal("ok") });

@ApiControllerDocs(SWAGGER_TAGS.health)
@Controller()
export class AppController {
  @ApiEndpoint({
    summary: "Health check",
    responses: [apiResponse.ok(HealthSchema)],
  })
  @Get("health")
  health(): z.infer<typeof HealthSchema> {
    return { status: "ok" };
  }
}
