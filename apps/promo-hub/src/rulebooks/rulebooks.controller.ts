import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import type {
  DraftStatusResponse,
  RulebookName,
  RulebookResponse,
  RulebookSummary,
  UpdatePolicyInput,
} from "@ridgeline/contracts/rulebooks";
import {
  DraftStatusResponseSchema,
  RulebookNameSchema,
  RulebookResponseSchema,
  RulebookSummarySchema,
  UpdatePolicySchema,
} from "@ridgeline/contracts/rulebooks";
import {
  ApiControllerDocs,
  ApiEndpoint,
  ZodValidationPipe,
  apiResponse,
} from "@ridgeline/nest-common";
import { SWAGGER_TAGS } from "../common/swagger/swagger.constants";
import { RULEBOOKS_PATHS } from "../paths/rulebooks";
import { RulebooksService } from "./rulebooks.service";

@ApiControllerDocs(SWAGGER_TAGS.rulebooks)
@Controller(RULEBOOKS_PATHS.PATH_PREFIX)
export class RulebooksController {
  constructor(private readonly rulebooksService: RulebooksService) {}

  @ApiEndpoint({
    summary: "List rulebooks: legacy (today's Trestle config), live and draft",
    responses: [apiResponse.okArray(RulebookSummarySchema)],
  })
  @Get()
  findAll(): Promise<RulebookSummary[]> {
    return this.rulebooksService.findAll();
  }

  @ApiEndpoint({
    summary: "Each draft deal's status against the published prototype rules",
    responses: [apiResponse.ok(DraftStatusResponseSchema)],
  })
  @Get(RULEBOOKS_PATHS.DRAFT_STATUS)
  draftStatus(): Promise<DraftStatusResponse> {
    return this.rulebooksService.draftStatus();
  }

  @ApiEndpoint({
    summary: "Change how clashes are resolved in the draft",
    request: { body: UpdatePolicySchema },
    responses: [apiResponse.ok(RulebookResponseSchema), apiResponse.badRequest()],
  })
  @Patch(RULEBOOKS_PATHS.DRAFT_POLICY)
  updateDraftPolicy(
    @Body(new ZodValidationPipe(UpdatePolicySchema)) body: UpdatePolicyInput,
  ): Promise<RulebookResponse> {
    return this.rulebooksService.updateDraftPolicy(body);
  }

  @ApiEndpoint({
    summary: "Publish the draft as the prototype's New rules",
    responses: [apiResponse.created(RulebookResponseSchema), apiResponse.badRequest()],
  })
  @Post(RULEBOOKS_PATHS.DRAFT_PUBLISH)
  publish(): Promise<RulebookResponse> {
    return this.rulebooksService.publish();
  }

  @ApiEndpoint({
    summary: "Throw away draft changes and start again from live",
    responses: [apiResponse.created(RulebookResponseSchema)],
  })
  @Post(RULEBOOKS_PATHS.DRAFT_DISCARD)
  discard(): Promise<RulebookResponse> {
    return this.rulebooksService.discardDraft();
  }

  @ApiEndpoint({
    summary: "Get a rulebook with its promotions",
    request: { params: { name: RulebookNameSchema } },
    responses: [apiResponse.ok(RulebookResponseSchema), apiResponse.badRequest()],
  })
  @Get(RULEBOOKS_PATHS.BY_NAME)
  findOne(
    @Param("name", new ZodValidationPipe(RulebookNameSchema)) name: RulebookName,
  ): Promise<RulebookResponse> {
    return this.rulebooksService.findOne(name);
  }
}
