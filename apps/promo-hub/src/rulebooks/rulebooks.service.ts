import { BadRequestException, Injectable } from "@nestjs/common";
import type { Promotion } from "@ridgeline/contracts/promotions";
import type {
  DealStatus,
  DraftStatusResponse,
  PricingPolicy,
  RulebookName,
  RulebookResponse,
  RulebookSummary,
} from "@ridgeline/contracts/rulebooks";
import { RulebookNameSchema } from "@ridgeline/contracts/rulebooks";
import { RulebooksClient } from "./rulebooks.client";

@Injectable()
export class RulebooksService {
  constructor(private readonly rulebooksClient: RulebooksClient) {}

  async findAll(): Promise<RulebookSummary[]> {
    const draftDirty = await this.draftDiffersFromLive();
    return Promise.all(
      RulebookNameSchema.options.map(async (name) => {
        const rulebook = await this.rulebooksClient.findUnique(name);
        return {
          name,
          policy: rulebook.policy,
          promotionCount: rulebook.promotions.length,
          updatedAt: rulebook.updatedAt,
          hasUnpublishedChanges: name === "draft" && draftDirty,
        };
      }),
    );
  }

  findOne(name: RulebookName): Promise<RulebookResponse> {
    return this.rulebooksClient.findUnique(name);
  }

  async updateDraftPolicy(policy: PricingPolicy): Promise<RulebookResponse> {
    const draft = await this.rulebooksClient.findUnique("draft");
    return this.rulebooksClient.save({ ...draft, name: "draft", policy });
  }

  // Only the draft is ever edited. Live changes only by publishing.
  async updateDraftPromotions(
    update: (promotions: Promotion[]) => Promotion[],
  ): Promise<RulebookResponse> {
    const draft = await this.rulebooksClient.findUnique("draft");
    return this.rulebooksClient.save({
      ...draft,
      name: "draft",
      promotions: update(draft.promotions),
    });
  }

  // Compares each draft deal with its live version, so Tania can see which
  // deals the tills already run and which are waiting to be published.
  async draftStatus(): Promise<DraftStatusResponse> {
    const [draft, live] = await Promise.all([
      this.rulebooksClient.findUnique("draft"),
      this.rulebooksClient.findUnique("live"),
    ]);
    const liveById = new Map(live.promotions.map((p) => [p.promotionId, p]));
    const draftIds = new Set(draft.promotions.map((p) => p.promotionId));
    const removed = live.promotions.filter((p) => !draftIds.has(p.promotionId));

    return {
      deals: [
        ...draft.promotions.map((promotion) => ({
          promotionId: promotion.promotionId,
          status: dealStatus(promotion, liveById.get(promotion.promotionId)),
        })),
        ...removed.map((promotion) => ({
          promotionId: promotion.promotionId,
          status: "removed" as const,
        })),
      ],
      removed,
      policyChanged: draft.policy.resolution !== live.policy.resolution,
    };
  }

  async publish(): Promise<RulebookResponse> {
    if (!(await this.draftDiffersFromLive())) {
      throw new BadRequestException("Nothing to publish — your draft matches the new rules");
    }
    const draft = await this.rulebooksClient.findUnique("draft");
    return this.rulebooksClient.save({ ...draft, name: "live" });
  }

  async discardDraft(): Promise<RulebookResponse> {
    const live = await this.rulebooksClient.findUnique("live");
    return this.rulebooksClient.save({ ...live, name: "draft" });
  }

  private async draftDiffersFromLive(): Promise<boolean> {
    const [draft, live] = await Promise.all([
      this.rulebooksClient.findUnique("draft"),
      this.rulebooksClient.findUnique("live"),
    ]);
    return (
      JSON.stringify([draft.policy, draft.promotions]) !==
      JSON.stringify([live.policy, live.promotions])
    );
  }
}

function dealStatus(draft: Promotion, live: Promotion | undefined): DealStatus {
  if (!live) return "new";
  // Switching off matters most at the till, so it wins over other edits.
  if (live.active && !draft.active) return "turned_off";
  return JSON.stringify(draft) === JSON.stringify(live) ? "published" : "changed";
}
