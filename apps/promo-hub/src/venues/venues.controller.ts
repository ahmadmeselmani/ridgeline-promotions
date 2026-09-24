import { Controller, Get, Param } from "@nestjs/common";
import type { VenueResponse } from "@ridgeline/contracts/venues";
import { VenueResponseSchema } from "@ridgeline/contracts/venues";
import { ApiControllerDocs, ApiEndpoint, apiResponse } from "@ridgeline/nest-common";
import { SWAGGER_TAGS } from "../common/swagger/swagger.constants";
import { VENUE_ID_PARAMS } from "../common/swagger/swagger.parameters";
import { VENUES_PATHS } from "../paths/venues";
import { VenuesService } from "./venues.service";

@ApiControllerDocs(SWAGGER_TAGS.venues)
@Controller(VENUES_PATHS.PATH_PREFIX)
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @ApiEndpoint({
    summary: "List venues (timezone derived from state where Trestle has none)",
    responses: [apiResponse.okArray(VenueResponseSchema)],
  })
  @Get()
  findAll(): VenueResponse[] {
    return this.venuesService.findAll();
  }

  @ApiEndpoint({
    summary: "Get a venue",
    request: { params: VENUE_ID_PARAMS },
    responses: [apiResponse.ok(VenueResponseSchema), apiResponse.notFound()],
  })
  @Get(VENUES_PATHS.BY_ID)
  findOne(@Param("venueId") venueId: string): VenueResponse {
    return this.venuesService.findOne(venueId);
  }
}
