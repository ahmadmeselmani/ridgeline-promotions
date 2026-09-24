"use client";

import { useState } from "react";
import { Plus, Rocket, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { CreatePromotionInput, Promotion } from "@ridgeline/contracts/promotions";
import type { ResolutionPolicy, RulebookName } from "@ridgeline/contracts/rulebooks";
import { Badge } from "@ridgeline/ui/badge";
import { Button } from "@ridgeline/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ridgeline/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ridgeline/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ridgeline/ui/tabs";
import { ImpactList } from "../../components/impact-list";
import { PublishSteps } from "../../components/rulebook/publish-steps";
import { PageHeader } from "../../components/page-header";
import { LoadingBlock, QueryError } from "../../components/query-state";
import { BLANK_PROMOTION, PromotionEditor } from "../../components/rulebook/promotion-editor";
import { PromotionsTable } from "../../components/rulebook/promotions-table";
import { RULEBOOK_HINT, RULEBOOK_LABEL } from "../../lib/format";
import { useProducts, useVenues } from "../../lib/queries/catalog";
import { useImpact } from "../../lib/queries/pricing";
import {
  useDiscardDraft,
  useDraftStatus,
  usePublishDraft,
  useRulebook,
  useRulebooks,
  useUpdateDraftPolicy,
} from "../../lib/queries/rulebooks";

const POLICY_LABEL: Record<ResolutionPolicy, string> = {
  best_price: "Customer gets their single best deal",
  priority: "Highest priority number wins (how Trestle works today)",
};

function withoutId(promotion: Promotion): CreatePromotionInput {
  const input: Partial<Promotion> = { ...promotion };
  delete input.promotionId;
  return input as CreatePromotionInput;
}

interface EditorState {
  key: number;
  promotionId: string | null;
  initial: CreatePromotionInput;
}

export default function RulebookPage() {
  const [tab, setTab] = useState<RulebookName>("draft");
  const [editor, setEditor] = useState<EditorState | null>(null);

  const summaries = useRulebooks();
  const draft = useRulebook("draft");
  const shown = useRulebook(tab);
  const venues = useVenues();
  const products = useProducts("VEN-0233");
  const draftDirty = summaries.data?.find((r) => r.name === "draft")?.hasUnpublishedChanges ?? false;
  const impact = useImpact("live", "draft", draftDirty);
  const status = useDraftStatus();
  const statuses = new Map(status.data?.deals.map((deal) => [deal.promotionId, deal.status]));
  const publishedCount = status.data?.deals.filter((deal) => deal.status === "published").length ?? 0;
  const pendingCount = (status.data?.deals.length ?? 0) - publishedCount;
  // Say what's unpublished: a changed clash rule isn't a deal, so without this
  // the bar can show with every deal marked Published.
  const pending = [
    ...(pendingCount > 0 ? [`${pendingCount} ${pendingCount === 1 ? "deal" : "deals"}`] : []),
    ...(status.data?.policyChanged && draft.data
      ? [`the “When deals clash” rule (your draft: ${POLICY_LABEL[draft.data.policy.resolution].toLowerCase()})`]
      : []),
  ];

  const publish = usePublishDraft();
  const discard = useDiscardDraft();
  const updatePolicy = useUpdateDraftPolicy();

  const openEditor = (promotion: Promotion | null) => {
    const initial: CreatePromotionInput = promotion ? withoutId(promotion) : BLANK_PROMOTION;
    setEditor({ key: Date.now(), promotionId: promotion?.promotionId ?? null, initial });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage deals"
        description="Change deals yourself: no ticket, no three-day wait. Publishing updates New rules inside this prototype."
      />

      <PublishSteps draftDirty={draftDirty} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Who&apos;s affected by your changes
            {draftDirty ? <Badge variant="warning">Not published yet</Badge> : <Badge variant="success">Nothing to publish</Badge>}
          </CardTitle>
          <CardDescription>
            Every situation from the brief, priced with the new rules and with your draft.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!draftDirty ? (
            <p className="text-sm text-muted-foreground">
              Your draft is the same as the new rules. Change a deal below and its effect shows up here.
            </p>
          ) : impact.isPending ? (
            <LoadingBlock className="h-24" />
          ) : impact.isError ? (
            <QueryError error={impact.error} />
          ) : (
            <ImpactList
              impact={impact.data}
              emptyText="Your changes don't move the price of any known situation."
            />
          )}
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(value) => setTab(value as RulebookName)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            {(["draft", "live", "legacy"] as const).map((name) => (
              <TabsTrigger key={name} value={name} title={RULEBOOK_HINT[name]}>
                {RULEBOOK_LABEL[name]}
              </TabsTrigger>
            ))}
          </TabsList>
          {tab === "draft" ? (
            <div className="flex flex-wrap items-center gap-2">
              {draft.data ? (
                <Select
                  value={draft.data.policy.resolution}
                  onValueChange={(resolution) => updatePolicy.mutate({ resolution: resolution as ResolutionPolicy })}
                >
                  <SelectTrigger size="sm" aria-label="When two deals clash">
                    <span className="text-muted-foreground">When deals clash:</span>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(POLICY_LABEL) as ResolutionPolicy[]).map((policy) => (
                      <SelectItem key={policy} value={policy}>
                        {POLICY_LABEL[policy]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Button onClick={() => openEditor(null)}>
                <Plus /> Add a deal
              </Button>
            </div>
          ) : null}
        </div>
        {(["draft", "live", "legacy"] as const).map((name) => (
          <TabsContent key={name} value={name} className="mt-3">
            <p className="mb-2 text-sm text-muted-foreground">
              {name === "draft"
                ? "Your working copy. Use the pencil to change a deal, or the switch to turn it off. The Status column compares it with the published New rules."
                : name === "live"
                  ? "Published prototype rules. Read-only: make changes in your draft."
                  : "Trestle's setup exactly as it is today: the priority number decides clashes, and the member discount goes on top of everything. Read-only."}
            </p>
            {name === "draft" && status.data ? (
              <p className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="success">{publishedCount} published</Badge>
                {pendingCount > 0 ? <Badge variant="warning">{pendingCount} not published yet</Badge> : null}
                {status.data.policyChanged ? (
                  <Badge variant="warning">&ldquo;When deals clash&rdquo; changed, not published</Badge>
                ) : null}
              </p>
            ) : null}
            <Card className="py-0">
              {shown.isPending || venues.isPending || products.isPending ? (
                <LoadingBlock />
              ) : shown.isError ? (
                <QueryError error={shown.error} />
              ) : (
                <PromotionsTable
                  promotions={shown.data.promotions}
                  editable={name === "draft"}
                  products={products.data ?? []}
                  venues={venues.data ?? []}
                  onEdit={openEditor}
                  statuses={name === "draft" && status.data ? statuses : undefined}
                  removed={name === "draft" ? status.data?.removed : undefined}
                />
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {draftDirty ? (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-lg">
          <p className="text-sm">
            <span className="font-medium">
              {pending.length > 0 ? `Not published yet: ${pending.join(" and ")}.` : "Ready when you are."}
            </span>{" "}
            {impact.data
              ? `${impact.data.changed.length} of ${impact.data.scenarioCount} situations change (price or deal).`
              : "Checking what changes…"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={discard.isPending}
              onClick={() => discard.mutate(undefined, { onSuccess: () => toast("Your draft now matches the new rules") })}
            >
              <Undo2 /> Undo my changes
            </Button>
            <Button
              disabled={publish.isPending}
              onClick={() =>
                publish.mutate(undefined, {
                  onSuccess: () => toast.success("Published to New rules in this prototype."),
                  onError: (error) => toast.error(error.message),
                })
              }
            >
              <Rocket /> Publish new rules
            </Button>
          </div>
        </div>
      ) : null}

      {editor && draft.data && venues.data && products.data ? (
        <PromotionEditor
          key={editor.key}
          open
          onOpenChange={(open) => !open && setEditor(null)}
          promotionId={editor.promotionId}
          initial={editor.initial}
          otherPromotions={draft.data.promotions.filter((p) => p.promotionId !== editor.promotionId)}
          venues={venues.data}
          products={products.data}
          resolution={draft.data.policy.resolution}
        />
      ) : null}
    </div>
  );
}
