import { Injectable, NotFoundException } from "@nestjs/common";
import type { VenueResponse } from "@ridgeline/contracts/venues";
import {
  ASSUMED_BISTRO_VENUE_IDS,
  TIMEZONE_BY_STATE,
} from "../trestle/assumptions";
import type { TrestleVenue } from "../trestle/trestle.types";
import { VenuesClient } from "./venues.client";

@Injectable()
export class VenuesService {
  constructor(private readonly venuesClient: VenuesClient) {}

  findAll(): VenueResponse[] {
    return this.venuesClient
      .findMany()
      .map((venue) => this.toResponse(venue))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  findOne(venueId: string): VenueResponse {
    const venue = this.venuesClient.findUnique(venueId);
    if (!venue) throw new NotFoundException(`Venue ${venueId} not found`);
    return this.toResponse(venue);
  }

  exists(venueId: string): boolean {
    return this.venuesClient.findUnique(venueId) !== null;
  }

  private toResponse(venue: TrestleVenue): VenueResponse {
    const derivedTimezone = TIMEZONE_BY_STATE[venue.state];
    if (!venue.timezone && !derivedTimezone) {
      throw new Error(`No timezone for ${venue.venue_id} in ${venue.state}`);
    }
    const isBistro = ASSUMED_BISTRO_VENUE_IDS.includes(venue.venue_id);
    return {
      venueId: venue.venue_id,
      name: venue.name,
      state: venue.state,
      timezone: venue.timezone ?? derivedTimezone ?? "",
      timezoneSource: venue.timezone ? "trestle" : "derived",
      kind: isBistro ? "bistro" : "pub",
      kindSource: "assumed",
      tradingHours: venue.trading_hours,
    };
  }
}
