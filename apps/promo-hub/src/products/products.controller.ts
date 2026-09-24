import { Controller, Get, Query } from "@nestjs/common";
import type { ProductResponse, ProductsQuery } from "@ridgeline/contracts/products";
import { ProductResponseSchema, ProductsQuerySchema } from "@ridgeline/contracts/products";
import {
  ApiControllerDocs,
  ApiEndpoint,
  ZodValidationPipe,
  apiResponse,
} from "@ridgeline/nest-common";
import { SWAGGER_TAGS } from "../common/swagger/swagger.constants";
import { VENUE_ID_PARAMS } from "../common/swagger/swagger.parameters";
import { PRODUCTS_PATHS } from "../paths/products";
import { ProductsService } from "./products.service";

@ApiControllerDocs(SWAGGER_TAGS.products)
@Controller(PRODUCTS_PATHS.PATH_PREFIX)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiEndpoint({
    summary: "List products and prices for a venue",
    request: { query: VENUE_ID_PARAMS },
    responses: [apiResponse.okArray(ProductResponseSchema), apiResponse.badRequest()],
  })
  @Get()
  findAll(
    @Query(new ZodValidationPipe(ProductsQuerySchema)) query: ProductsQuery,
  ): ProductResponse[] {
    return this.productsService.findAll(query.venueId);
  }
}
