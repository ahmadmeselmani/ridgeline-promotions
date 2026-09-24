"use client";

import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { ProductResponse } from "@ridgeline/contracts/products";
import type { Promotion } from "@ridgeline/contracts/promotions";
import type { VenueResponse } from "@ridgeline/contracts/venues";
import { Badge } from "@ridgeline/ui/badge";
import { Button } from "@ridgeline/ui/button";
import { Switch } from "@ridgeline/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ridgeline/ui/table";
import { AUDIENCE_LABEL, describeDeal, describeSchedule, describeWindow } from "../../lib/format";
import { useUpdatePromotion } from "../../lib/queries/rulebooks";

export function PromotionsTable({
  promotions,
  editable,
  products,
  venues,
  onEdit,
}: {
  promotions: Promotion[];
  editable: boolean;
  products: ProductResponse[];
  venues: VenueResponse[];
  onEdit: (promotion: Promotion) => void;
}) {
  const update = useUpdatePromotion();
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
          <TableHead className="w-24 text-end">{editable ? "On / edit" : ""}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {promotions.map((promotion) => (
          <TableRow key={promotion.promotionId} className={promotion.active ? undefined : "opacity-50"}>
            <TableCell className="max-w-72 whitespace-normal">
              <div className="font-medium">{promotion.name}</div>
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
            <TableCell className="text-end">
              {editable ? (
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
                </div>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
