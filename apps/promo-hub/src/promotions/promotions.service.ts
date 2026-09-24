import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  CreatePromotionInput,
  Promotion,
  PromotionResponse,
  UpdatePromotionInput,
} from "@ridgeline/contracts/promotions";
import type { RulebookName } from "@ridgeline/contracts/rulebooks";
import { PromotionSchema, STACKS_WITH_ANY } from "@ridgeline/contracts/promotions";
import { zodBadRequest } from "@ridgeline/nest-common";
import { ProductsService } from "../products/products.service";
import { RulebooksService } from "../rulebooks/rulebooks.service";
import { VenuesService } from "../venues/venues.service";

@Injectable()
export class PromotionsService {
  constructor(
    private readonly rulebooksService: RulebooksService,
    private readonly venuesService: VenuesService,
    private readonly productsService: ProductsService,
  ) {}

  async findAll(rulebook: RulebookName): Promise<PromotionResponse[]> {
    return (await this.rulebooksService.findOne(rulebook)).promotions;
  }

  async findOne(rulebook: RulebookName, promotionId: string): Promise<PromotionResponse> {
    const promotion = (await this.findAll(rulebook)).find(
      (candidate) => candidate.promotionId === promotionId,
    );
    if (!promotion) {
      throw new NotFoundException(`Promotion ${promotionId} not found in ${rulebook}`);
    }
    return promotion;
  }

  async create(input: CreatePromotionInput): Promise<PromotionResponse> {
    const promotion: Promotion = { ...input, promotionId: await this.nextId() };
    const draft = await this.findAll("draft");
    this.assertReferencesExist(promotion, [...draft, promotion]);
    await this.rulebooksService.updateDraftPromotions((promotions) => [...promotions, promotion]);
    return promotion;
  }

  async update(promotionId: string, input: UpdatePromotionInput): Promise<PromotionResponse> {
    const existing = await this.findOne("draft", promotionId);
    const parsed = PromotionSchema.safeParse({ ...existing, ...input, promotionId });
    if (!parsed.success) {
      throw zodBadRequest(parsed.error);
    }
    const promotion = parsed.data;
    const draft = (await this.findAll("draft")).map((candidate) =>
      candidate.promotionId === promotionId ? promotion : candidate,
    );
    this.assertReferencesExist(promotion, draft, new Set(existing.stacksWith));
    await this.rulebooksService.updateDraftPromotions(() => draft);
    return promotion;
  }

  async remove(promotionId: string): Promise<void> {
    await this.findOne("draft", promotionId);
    await this.rulebooksService.updateDraftPromotions((promotions) =>
      // Keep incoming stacking references in the draft. They are harmless while
      // the target is absent, let Undo restore behaviour without touching other
      // edits, and are cleaned only if the deletion is actually published.
      promotions.filter((promotion) => promotion.promotionId !== promotionId),
    );
  }

  // Undo for one deal: puts it back in the draft exactly as the tills run it.
  // Brings back a removed deal, or drops unpublished edits to a changed one.
  async restore(promotionId: string): Promise<PromotionResponse> {
    const live = await this.findOne("live", promotionId);
    const draft = await this.findAll("draft");
    const ids = new Set(draft.map((promotion) => promotion.promotionId));
    // A deal it stacked on may since have been removed from the draft.
    const restored: Promotion = {
      ...live,
      stacksWith: live.stacksWith.filter((id) => id === STACKS_WITH_ANY || ids.has(id)),
    };
    await this.rulebooksService.updateDraftPromotions((promotions) =>
      ids.has(promotionId)
        ? promotions.map((promotion) => (promotion.promotionId === promotionId ? restored : promotion))
        : [...promotions, restored],
    );
    return restored;
  }

  // Ids are unique across live and draft so a deleted-then-recreated draft
  // promotion never collides with a live one.
  private async nextId(): Promise<string> {
    const [live, draft] = await Promise.all([this.findAll("live"), this.findAll("draft")]);
    const ids = [...live, ...draft].map((promotion) =>
      Number(promotion.promotionId.replace(/\D/g, "")),
    );
    return `PRM-${Math.max(0, ...ids.filter(Number.isFinite)) + 1}`;
  }

  private assertReferencesExist(
    promotion: Promotion,
    rulebook: Promotion[],
    previouslyValidStackingIds: ReadonlySet<string> = new Set(),
  ): void {
    const errors: string[] = [];

    const venueIds = [
      ...(promotion.venueIds ?? []),
      ...promotion.venueOverrides.map((override) => override.venueId),
    ];
    for (const venueId of venueIds) {
      if (!this.venuesService.exists(venueId)) errors.push(`Unknown venue ${venueId}`);
    }

    const catalog = new Set(
      this.productsService.findAll("").map((product) => product.productId),
    );
    const productIds =
      promotion.appliesTo.kind === "products"
        ? promotion.appliesTo.productIds
        : promotion.appliesTo.kind === "bundle"
          ? promotion.appliesTo.slots.flatMap((slot) => slot.productIds)
          : [];
    for (const productId of productIds) {
      if (!catalog.has(productId)) errors.push(`Unknown product ${productId}`);
    }

    const promotionIds = new Set(rulebook.map((candidate) => candidate.promotionId));
    for (const id of promotion.stacksWith) {
      if (id === promotion.promotionId) errors.push("A deal can't stack with itself");
      else if (
        id !== STACKS_WITH_ANY &&
        !promotionIds.has(id) &&
        !previouslyValidStackingIds.has(id)
      ) {
        errors.push(`Can't stack with unknown promotion ${id}`);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({ message: errors.join("; "), errors });
    }
  }
}
