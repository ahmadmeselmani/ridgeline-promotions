import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { z } from "zod";
import type {
  CreateOverrideInput,
  OverrideResponse,
  OverridesQuery,
  OverrideSummary,
} from "@ridgeline/contracts/overrides";
import {
  CreateOverrideSchema,
  OverrideResponseSchema,
  OverridesQuerySchema,
  OverrideSummarySchema,
} from "@ridgeline/contracts/overrides";
import {
  ApiControllerDocs,
  ApiEndpoint,
  ZodValidationPipe,
  apiResponse,
} from "@ridgeline/nest-common";
import { SWAGGER_TAGS } from "../common/swagger/swagger.constants";
import { OVERRIDES_PATHS } from "../paths/overrides";
import { OverridesService } from "./overrides.service";

const VENUE_FILTER = { venueId: z.string().optional() } as const;

@ApiControllerDocs(SWAGGER_TAGS.overrides)
@Controller(OVERRIDES_PATHS.PATH_PREFIX)
export class OverridesController {
  constructor(private readonly overridesService: OverridesService) {}

  @ApiEndpoint({
    summary: "Record a manual price (needs override_price and a reason)",
    request: { body: CreateOverrideSchema },
    responses: [
      apiResponse.created(OverrideResponseSchema),
      apiResponse.badRequest(),
      apiResponse.forbidden(),
    ],
  })
  @Post()
  create(
    @Body(new ZodValidationPipe(CreateOverrideSchema)) body: CreateOverrideInput,
  ): Promise<OverrideResponse> {
    return this.overridesService.create(body);
  }

  @ApiEndpoint({
    summary: "Totals by reason and by staff member",
    request: { query: VENUE_FILTER },
    responses: [apiResponse.ok(OverrideSummarySchema)],
  })
  @Get(OVERRIDES_PATHS.SUMMARY)
  summary(
    @Query(new ZodValidationPipe(OverridesQuerySchema)) query: OverridesQuery,
  ): Promise<OverrideSummary> {
    return this.overridesService.summary(query.venueId);
  }

  @ApiEndpoint({
    summary: "List manual prices",
    request: { query: VENUE_FILTER },
    responses: [apiResponse.okArray(OverrideResponseSchema)],
  })
  @Get()
  findAll(
    @Query(new ZodValidationPipe(OverridesQuerySchema)) query: OverridesQuery,
  ): Promise<OverrideResponse[]> {
    return this.overridesService.findAll(query.venueId);
  }
}
