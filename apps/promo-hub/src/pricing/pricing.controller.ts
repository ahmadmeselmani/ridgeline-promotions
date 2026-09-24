import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from "@nestjs/common";
import { z } from "zod";
import type {
  ClashGridQuery,
  ClashGridResponse,
  ImpactQuery,
  ImpactResponse,
  QuoteRequest,
  QuoteResponse,
} from "@ridgeline/contracts/pricing";
import {
  ClashGridQuerySchema,
  ClashGridResponseSchema,
  ImpactQuerySchema,
  ImpactResponseSchema,
  QuoteRequestSchema,
  QuoteResponseSchema,
} from "@ridgeline/contracts/pricing";
import { RulebookNameSchema } from "@ridgeline/contracts/rulebooks";
import {
  ApiControllerDocs,
  ApiEndpoint,
  ZodValidationPipe,
  apiResponse,
} from "@ridgeline/nest-common";
import { SWAGGER_TAGS } from "../common/swagger/swagger.constants";
import { PRICING_PATHS } from "../paths/pricing";
import { PricingService } from "./pricing.service";

@ApiControllerDocs(SWAGGER_TAGS.pricing)
@Controller(PRICING_PATHS.PATH_PREFIX)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @ApiEndpoint({
    summary: "Price a basket and explain every deal applied or skipped",
    description:
      "What the till would charge. Send localDateTime (venue wall clock) or at (instant with offset).",
    request: { body: QuoteRequestSchema },
    responses: [apiResponse.ok(QuoteResponseSchema), apiResponse.badRequest(), apiResponse.notFound()],
  })
  @HttpCode(HttpStatus.OK)
  @Post(PRICING_PATHS.QUOTE)
  quote(
    @Body(new ZodValidationPipe(QuoteRequestSchema)) body: QuoteRequest,
  ): Promise<QuoteResponse> {
    return this.pricingService.quote(body);
  }

  @ApiEndpoint({
    summary: "Which known till situations change price between two rulebooks",
    request: {
      query: {
        from: RulebookNameSchema.optional(),
        to: RulebookNameSchema.optional(),
      },
    },
    responses: [apiResponse.ok(ImpactResponseSchema)],
  })
  @Get(PRICING_PATHS.IMPACT)
  impact(
    @Query(new ZodValidationPipe(ImpactQuerySchema)) query: ImpactQuery,
  ): Promise<ImpactResponse> {
    return this.pricingService.impact(query);
  }

  @ApiEndpoint({
    summary: "A week of deals for one venue, with every overlap flagged",
    request: {
      query: {
        venueId: z.string(),
        rulebook: RulebookNameSchema.optional(),
        weekOf: z.iso.date().describe("A Monday"),
      },
    },
    responses: [apiResponse.ok(ClashGridResponseSchema), apiResponse.badRequest(), apiResponse.notFound()],
  })
  @Get(PRICING_PATHS.CLASH_GRID)
  clashGrid(
    @Query(new ZodValidationPipe(ClashGridQuerySchema)) query: ClashGridQuery,
  ): Promise<ClashGridResponse> {
    return this.pricingService.clashGrid(query);
  }
}
