import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import type {
  CreatePromotionInput,
  PromotionResponse,
  PromotionsQuery,
  UpdatePromotionInput,
} from "@ridgeline/contracts/promotions";
import {
  CreatePromotionSchema,
  PromotionResponseSchema,
  PromotionsQuerySchema,
  UpdatePromotionSchema,
} from "@ridgeline/contracts/promotions";
import {
  ApiControllerDocs,
  ApiEndpoint,
  ZodValidationPipe,
  apiResponse,
} from "@ridgeline/nest-common";
import { SWAGGER_TAGS } from "../common/swagger/swagger.constants";
import {
  PROMOTION_ID_PARAMS,
  RULEBOOK_QUERY,
} from "../common/swagger/swagger.parameters";
import { PROMOTIONS_PATHS } from "../paths/promotions";
import { PromotionsService } from "./promotions.service";

// Reads can target any rulebook; writes only ever touch the draft.
@ApiControllerDocs(SWAGGER_TAGS.promotions)
@Controller(PROMOTIONS_PATHS.PATH_PREFIX)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @ApiEndpoint({
    summary: "List promotions in a rulebook (default: draft)",
    request: { query: RULEBOOK_QUERY },
    responses: [apiResponse.okArray(PromotionResponseSchema)],
  })
  @Get()
  findAll(
    @Query(new ZodValidationPipe(PromotionsQuerySchema)) query: PromotionsQuery,
  ): Promise<PromotionResponse[]> {
    return this.promotionsService.findAll(query.rulebook);
  }

  @ApiEndpoint({
    summary: "Get a promotion",
    request: { params: PROMOTION_ID_PARAMS, query: RULEBOOK_QUERY },
    responses: [apiResponse.ok(PromotionResponseSchema), apiResponse.notFound()],
  })
  @Get(PROMOTIONS_PATHS.BY_ID)
  findOne(
    @Param("promotionId") promotionId: string,
    @Query(new ZodValidationPipe(PromotionsQuerySchema)) query: PromotionsQuery,
  ): Promise<PromotionResponse> {
    return this.promotionsService.findOne(query.rulebook, promotionId);
  }

  @ApiEndpoint({
    summary: "Add a promotion to the draft",
    request: { body: CreatePromotionSchema },
    responses: [apiResponse.created(PromotionResponseSchema), apiResponse.badRequest()],
  })
  @Post()
  create(
    @Body(new ZodValidationPipe(CreatePromotionSchema)) body: CreatePromotionInput,
  ): Promise<PromotionResponse> {
    return this.promotionsService.create(body);
  }

  @ApiEndpoint({
    summary: "Change a promotion in the draft",
    request: { params: PROMOTION_ID_PARAMS, body: UpdatePromotionSchema },
    responses: [
      apiResponse.ok(PromotionResponseSchema),
      apiResponse.badRequest(),
      apiResponse.notFound(),
    ],
  })
  @Patch(PROMOTIONS_PATHS.BY_ID)
  update(
    @Param("promotionId") promotionId: string,
    @Body(new ZodValidationPipe(UpdatePromotionSchema)) body: UpdatePromotionInput,
  ): Promise<PromotionResponse> {
    return this.promotionsService.update(promotionId, body);
  }

  @ApiEndpoint({
    summary: "Put a promotion back in the draft exactly as published (undo for one deal)",
    request: { params: PROMOTION_ID_PARAMS },
    responses: [apiResponse.created(PromotionResponseSchema), apiResponse.notFound()],
  })
  @Post(PROMOTIONS_PATHS.RESTORE)
  restore(@Param("promotionId") promotionId: string): Promise<PromotionResponse> {
    return this.promotionsService.restore(promotionId);
  }

  @ApiEndpoint({
    summary: "Remove a promotion from the draft",
    request: { params: PROMOTION_ID_PARAMS },
    responses: [apiResponse.empty(HttpStatus.NO_CONTENT), apiResponse.notFound()],
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(PROMOTIONS_PATHS.BY_ID)
  remove(@Param("promotionId") promotionId: string): Promise<void> {
    return this.promotionsService.remove(promotionId);
  }
}
