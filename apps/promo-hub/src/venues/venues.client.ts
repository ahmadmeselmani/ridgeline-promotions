import { Injectable } from "@nestjs/common";
import { TrestleService } from "../trestle/trestle.service";
import type { TrestleVenue } from "../trestle/trestle.types";

@Injectable()
export class VenuesClient {
  constructor(private readonly trestle: TrestleService) {}

  findMany(): TrestleVenue[] {
    return this.trestle.listVenues();
  }

  findUnique(venueId: string): TrestleVenue | null {
    return this.trestle.getVenue(venueId);
  }
}
