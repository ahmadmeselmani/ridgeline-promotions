import { Controller, Get, Param } from "@nestjs/common";
import { z } from "zod";
import type { MemberResponse } from "@ridgeline/contracts/members";
import { MemberResponseSchema } from "@ridgeline/contracts/members";
import { ApiControllerDocs, ApiEndpoint, apiResponse } from "@ridgeline/nest-common";
import { SWAGGER_TAGS } from "../common/swagger/swagger.constants";
import { MEMBERS_PATHS } from "../paths/members";
import { MembersService } from "./members.service";

@ApiControllerDocs(SWAGGER_TAGS.members)
@Controller(MEMBERS_PATHS.PATH_PREFIX)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @ApiEndpoint({
    summary: "Look up a member",
    request: { params: { memberNumber: z.string().describe("e.g. M-004182") } },
    responses: [apiResponse.ok(MemberResponseSchema), apiResponse.notFound()],
  })
  @Get(MEMBERS_PATHS.BY_NUMBER)
  findOne(@Param("memberNumber") memberNumber: string): MemberResponse {
    return this.membersService.findOne(memberNumber);
  }
}
