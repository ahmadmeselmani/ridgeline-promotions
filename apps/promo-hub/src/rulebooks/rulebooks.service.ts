import { BadRequestException, Injectable } from "@nestjs/common";
import type { Promotion } from "@ridgeline/contracts/promotions";
import type {
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

  async publish(): Promise<RulebookResponse> {
    if (!(await this.draftDiffersFromLive())) {
      throw new BadRequestException("Nothing to publish — the draft matches live");
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
