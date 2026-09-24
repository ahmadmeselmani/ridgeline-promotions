import { Injectable } from "@nestjs/common";
import fixtures from "./fixtures/trestle-fixtures.json";
import type {
  TrestleFixtures,
  TrestleMember,
  TrestleProduct,
  TrestlePromotion,
  TrestleStaff,
  TrestleVenue,
} from "./trestle.types";

/**
 * In-process stub of the Trestle v2 sandbox, backed by the fixtures file.
 * Method names mirror the HTTP endpoints so swapping this for a real HTTP
 * client later only touches this class.
 */
@Injectable()
export class TrestleService {
  private readonly data = fixtures as unknown as TrestleFixtures;

  // GET /venues
  listVenues(): TrestleVenue[] {
    return this.data.venues;
  }

  // GET /venues/{venue_id}
  getVenue(venueId: string): TrestleVenue | null {
    return this.data.venues.find((venue) => venue.venue_id === venueId) ?? null;
  }

  // GET /products?venue_id={id} — the sandbox has one price list for all venues.
  listProducts(venueId: string): TrestleProduct[] {
    void venueId;
    return this.data.products;
  }

  // GET /members/{member_number}
  getMember(memberNumber: string): TrestleMember | null {
    return (
      this.data.members.find((member) => member.member_number === memberNumber) ??
      null
    );
  }

  // GET /staff?venue_id={id} — the sandbox doesn't say who works where.
  listStaff(): TrestleStaff[] {
    return this.data.staff;
  }

  // GET /promotions?venue_id={id} — group-wide in the sandbox.
  listPromotions(): TrestlePromotion[] {
    return this.data.promotions;
  }
}
