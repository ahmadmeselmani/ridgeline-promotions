import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type {
  CreateOverrideInput,
  OverrideReason,
  OverrideResponse,
  OverrideSummary,
} from "@ridgeline/contracts/overrides";
import { OverrideReasonSchema } from "@ridgeline/contracts/overrides";
import { ProductsService } from "../products/products.service";
import { StaffService } from "../staff/staff.service";
import { VenuesService } from "../venues/venues.service";
import { OverridesClient } from "./overrides.client";

@Injectable()
export class OverridesService {
  constructor(
    private readonly overridesClient: OverridesClient,
    private readonly staffService: StaffService,
    private readonly venuesService: VenuesService,
    private readonly productsService: ProductsService,
  ) {}

  async create(input: CreateOverrideInput): Promise<OverrideResponse> {
    this.venuesService.findOne(input.venueId);
    const staff = this.staffService.find(input.staffId);
    if (!staff) throw new BadRequestException(`Staff ${input.staffId} not found`);
    if (!staff.permissions.includes("override_price")) {
      throw new ForbiddenException(
        `${staff.name} can't override prices — ask a supervisor or manager`,
      );
    }
    const product = this.productsService
      .findAll(input.venueId)
      .find((candidate) => candidate.productId === input.productId);
    if (!product) {
      throw new BadRequestException(`Product ${input.productId} not found`);
    }

    return this.overridesClient.create(input);
  }

  findAll(venueId?: string): Promise<OverrideResponse[]> {
    return this.overridesClient.findMany(venueId);
  }

  async summary(venueId?: string): Promise<OverrideSummary> {
    const overrides = await this.findAll(venueId);
    const byReason = OverrideReasonSchema.options
      .map((reason: OverrideReason) => {
        const matching = overrides.filter((override) => override.reason === reason);
        return {
          reason,
          count: matching.length,
          discountCents: total(matching),
        };
      })
      .filter((row) => row.count > 0);
    const staffIds = [...new Set(overrides.map((override) => override.staffId))].sort();
    return {
      count: overrides.length,
      discountCents: total(overrides),
      byReason,
      byStaff: staffIds.map((staffId) => {
        const matching = overrides.filter((override) => override.staffId === staffId);
        return { staffId, count: matching.length, discountCents: total(matching) };
      }),
    };
  }
}

function total(overrides: readonly OverrideResponse[]): number {
  return overrides.reduce((sum, override) => sum + override.discountCents, 0);
}
