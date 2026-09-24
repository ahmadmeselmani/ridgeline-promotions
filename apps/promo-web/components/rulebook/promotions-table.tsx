"use client";

import { Pencil, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductResponse } from "@ridgeline/contracts/products";
import type { Promotion } from "@ridgeline/contracts/promotions";
import type { DealStatus } from "@ridgeline/contracts/rulebooks";
import type { VenueResponse } from "@ridgeline/contracts/venues";
import { Badge } from "@ridgeline/ui/badge";
import { Button } from "@ridgeline/ui/button";
import { Switch } from "@ridgeline/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ridgeline/ui/table";
import { AUDIENCE_LABEL, DEAL_STATUS_LABEL, describeDeal, describeSchedule, describeWindow } from "../../lib/format";
import { useRestorePromotion, useUpdatePromotion } from "../../lib/queries/rulebooks";

export function PromotionsTable({
  promotions,
  editable,
  products,
  venues,
  onEdit,
  statuses,
  removed = [],
}: {
  promotions: Promotion[];
  editable: boolean;
  products: ProductResponse[];
  venues: VenueResponse[];
  onEdit: (promotion: Promotion) => void;
  // Draft only: each deal's status against the published New rules, plus deals
  // deleted from the draft that remain in New rules.
  statuses?: ReadonlyMap<string, DealStatus>;
  removed?: Promotion[];
}) {
  const update = useUpdatePromotion();
  const restore = useRestorePromotion();
  const undo = (promotion: Promotion) =>
    restore.mutate(promotion.promotionId, {
      onSuccess: () => toast(`${promotion.name} is back to the published New rules`),
      onError: (error) => toast.error(error.message),
    });
  const productName = (id: string) => products.find((product) => product.productId === id)?.name ?? id;
  const venueName = (id: string) => venues.find((venue) => venue.venueId === id)?.name ?? id;
  const promotionName = (id: string) =>
    id === "*" ? "anything" : (promotions.find((promotion) => promotion.promotionId === id)?.name ?? id);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Deal</TableHead>
          <TableHead>Who</TableHead>
          <TableHead>When</TableHead>
          <TableHead>Where</TableHead>
          <TableHead>Combines with other deals?</TableHead>
          {statuses ? <TableHead>Status</TableHead> : null}
          <TableHead className="w-24 text-end">{editable ? "On / edit" : ""}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...promotions, ...removed].map((promotion) => {
          const status = statuses?.get(promotion.promotionId);
          const isRemoved = status === "removed";
          return (
          <TableRow key={promotion.promotionId} className={promotion.active && !isRemoved ? undefined : "opacity-50"}>
            <TableCell className="max-w-72 whitespace-normal">
              <div className={isRemoved ? "font-medium line-through" : "font-medium"}>{promotion.name}</div>
              <div className="text-xs text-muted-foreground">{describeDeal(promotion, productName)}</div>
              {promotion.description ? (
                <div className="mt-1 text-xs text-muted-foreground italic">{promotion.description}</div>
              ) : null}
            </TableCell>
            <TableCell>
              <Badge variant={promotion.audience === "everyone" ? "secondary" : "outline"}>
                {AUDIENCE_LABEL[promotion.audience]}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-normal">
              <div className="text-sm">{describeSchedule(promotion.schedule)}</div>
              {promotion.venueOverrides.map((override) => (
                <div key={override.venueId} className="text-xs text-muted-foreground">
                  {venueName(override.venueId)}:{" "}
                  {override.enabled
                    ? describeWindow(
                        override.startsAt ?? promotion.schedule.startsAt,
                        override.endsAt ?? promotion.schedule.endsAt,
                      )
                    : "not run"}
                </div>
              ))}
            </TableCell>
            <TableCell className="whitespace-normal text-sm">
              {promotion.venueIds === null ? "All venues" : promotion.venueIds.map(venueName).join(", ")}
            </TableCell>
            <TableCell className="whitespace-normal">
              {promotion.stacksWith.length === 0 ? (
                <span className="text-sm text-muted-foreground">No, best single deal only</span>
              ) : (
                <Badge variant="warning">Yes, on top of {promotion.stacksWith.map(promotionName).join(", ")}</Badge>
              )}
            </TableCell>
            {statuses ? (
              <TableCell>
                {status ? (
                  <Badge variant={status === "published" ? "success" : status === "removed" ? "destructive" : "warning"}>
                    {DEAL_STATUS_LABEL[status]}
                  </Badge>
                ) : null}
              </TableCell>
            ) : null}
            <TableCell className="text-end">
              {editable && isRemoved ? (
                <Button variant="outline" size="sm" disabled={restore.isPending} onClick={() => undo(promotion)}>
                  <Undo2 /> Undo
                </Button>
              ) : editable ? (
                <div className="flex items-center justify-end gap-1">
                  <Switch
                    size="sm"
                    checked={promotion.active}
                    aria-label={`Switch ${promotion.name} on or off`}
                    onCheckedChange={(active) =>
                      update.mutate(
                        { promotionId: promotion.promotionId, input: { active } },
                        { onError: (error) => toast.error(error.message) },
                      )
                    }
                  />
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit ${promotion.name}`} onClick={() => onEdit(promotion)}>
                    <Pencil />
                  </Button>
                  {status === "changed" || status === "turned_off" ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Undo my changes to ${promotion.name}`}
                      title="Undo my changes to this deal"
                      disabled={restore.isPending}
                      onClick={() => undo(promotion)}
                    >
                      <Undo2 />
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
