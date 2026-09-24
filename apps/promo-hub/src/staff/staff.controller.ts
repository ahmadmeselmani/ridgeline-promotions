import { Controller, Get } from "@nestjs/common";
import type { StaffMemberResponse } from "@ridgeline/contracts/staff";
import { StaffMemberResponseSchema } from "@ridgeline/contracts/staff";
import { ApiControllerDocs, ApiEndpoint, apiResponse } from "@ridgeline/nest-common";
import { SWAGGER_TAGS } from "../common/swagger/swagger.constants";
import { STAFF_PATHS } from "../paths/staff";
import { StaffService } from "./staff.service";

@ApiControllerDocs(SWAGGER_TAGS.staff)
@Controller(STAFF_PATHS.PATH_PREFIX)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @ApiEndpoint({
    summary: "List staff and their till permissions",
    responses: [apiResponse.okArray(StaffMemberResponseSchema)],
  })
  @Get()
  findAll(): StaffMemberResponse[] {
    return this.staffService.findAll();
  }
}
