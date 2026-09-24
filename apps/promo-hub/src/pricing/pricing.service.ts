import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  ClashGridQuery,
  ClashGridResponse,
  Customer,
  ImpactQuery,
  ImpactResponse,
  QuoteRequest,
  QuoteResponse,
  ResolvedCustomer,
} from "@ridgeline/contracts/pricing";
import {
  type CatalogProduct,
  UnknownProductError,
  buildClashGrid,
  dayOf,
  priceBasket,
  toVenueLocal,
  tradingMomentFromLocal,
} from "@ridgeline/pricing-engine";
import { MembersService } from "../members/members.service";
import { ProductsService } from "../products/products.service";
import { RulebooksService } from "../rulebooks/rulebooks.service";
import { ScenariosService } from "../scenarios/scenarios.service";
import { StaffService } from "../staff/staff.service";
import { VenuesService } from "../venues/venues.service";

@Injectable()
export class PricingService {
  constructor(
    private readonly venuesService: VenuesService,
    private readonly productsService: ProductsService,
    private readonly membersService: MembersService,
    private readonly staffService: StaffService,
    private readonly rulebooksService: RulebooksService,
    private readonly scenariosService: ScenariosService,
  ) {}

  async quote(request: QuoteRequest): Promise<QuoteResponse> {
    const venue = this.venuesService.findOne(request.venueId);
    const rulebook = await this.rulebooksService.findOne(request.rulebook);
    const customer = this.resolveCustomer(request.customer);
    const localDateTime =
      request.localDateTime ?? toVenueLocal(request.at ?? "", venue.timezone);
    const moment = tradingMomentFromLocal(localDateTime);

    try {
      const result = priceBasket({
        venueId: venue.venueId,
        moment,
        audience: customer.audience,
        lines: request.lines,
        catalog: this.catalog(venue.venueId),
        promotions: rulebook.promotions,
        policy: rulebook.policy,
      });
      return {
        rulebook: request.rulebook,
        venueId: venue.venueId,
        venueName: venue.name,
        timezone: venue.timezone,
        moment,
        customer,
        ...result,
        notes: [...(customer.note ? [customer.note] : []), ...result.notes],
      };
    } catch (error) {
      if (error instanceof UnknownProductError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  // Runs every known till situation through two rulebooks and returns the
  // ones whose price or explanation changes — "what happens if I publish?".
  async impact(query: ImpactQuery): Promise<ImpactResponse> {
    const scenarios = this.scenariosService.findAll();
    const results = await Promise.all(scenarios.map(async (scenario) => {
      const base = {
        venueId: scenario.venueId,
        localDateTime: scenario.localDateTime,
        customer: scenario.customer,
        lines: scenario.lines,
      };
      const [before, after] = await Promise.all([
        this.quote({ ...base, rulebook: query.from }),
        this.quote({ ...base, rulebook: query.to }),
      ]);
      if (fingerprint(before) === fingerprint(after)) return [];
      return [
        {
          scenarioId: scenario.scenarioId,
          title: scenario.title,
          before,
          after,
          deltaCents: after.totalCents - before.totalCents,
        },
      ];
    }));
    const changed = results.flat();
    return {
      from: query.from,
      to: query.to,
      scenarioCount: scenarios.length,
      changed,
    };
  }

  async clashGrid(query: ClashGridQuery): Promise<ClashGridResponse> {
    if (dayOf(query.weekOf) !== "mon") {
      throw new BadRequestException("weekOf must be a Monday");
    }
    const venue = this.venuesService.findOne(query.venueId);
    const rulebook = await this.rulebooksService.findOne(query.rulebook);
    return {
      venueId: venue.venueId,
      rulebook: query.rulebook,
      weekOf: query.weekOf,
      days: buildClashGrid({
        venueId: venue.venueId,
        weekOf: query.weekOf,
        tradingHours: venue.tradingHours,
        promotions: rulebook.promotions,
        catalog: [...this.catalog(venue.venueId).values()],
        policy: rulebook.policy,
      }),
    };
  }

  private catalog(venueId: string): Map<string, CatalogProduct> {
    return new Map(
      this.productsService
        .findAll(venueId)
        .map((product) => [product.productId, product]),
    );
  }

  // An unknown or lapsed member number shouldn't block the sale — they're
  // served as a guest and the receipt says why.
  private resolveCustomer(customer: Customer): ResolvedCustomer {
    switch (customer.kind) {
      case "guest":
        return { kind: "guest", audience: null, label: "Guest", note: null };
      case "member": {
        const member = this.membersService.find(customer.memberNumber);
        if (!member) {
          return {
            kind: "member",
            audience: null,
            label: customer.memberNumber,
            note: `Member ${customer.memberNumber} not found — priced as a guest.`,
          };
        }
        const label = `${member.name} (${member.tier} member)`;
        return member.active
          ? { kind: "member", audience: "member", label, note: null }
          : {
              kind: "member",
              audience: null,
              label,
              note: `${member.name}'s membership is inactive — priced as a guest.`,
            };
      }
      case "staff": {
        const staff = this.staffService.find(customer.staffId);
        if (!staff) {
          throw new BadRequestException(`Staff ${customer.staffId} not found`);
        }
        return {
          kind: "staff",
          audience: "staff",
          label: `${staff.name} (staff)`,
          note: null,
        };
      }
    }
  }
}

function fingerprint(quote: QuoteResponse): string {
  return JSON.stringify(
    quote.lines.map((line) => [
      line.productId,
      line.quantity,
      line.finalCents,
      line.applied.map((applied) => applied.promotionId),
    ]),
  );
}
