"use client";

import { useMemo, useState } from "react";
import type { RulebookName } from "@ridgeline/contracts/rulebooks";
import { Badge } from "@ridgeline/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ridgeline/ui/card";
import { Input } from "@ridgeline/ui/input";
import { Label } from "@ridgeline/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ridgeline/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@ridgeline/ui/toggle-group";
import { cn } from "@ridgeline/ui/lib/utils";
import {
  ClashGrid,
  type SelectedSlot,
  TONE_LEGEND,
  ToneSwatch,
  slotTone,
} from "../../components/clashes/clash-grid";
import { PageHeader } from "../../components/page-header";
import { LoadingBlock, QueryError } from "../../components/query-state";
import { AUDIENCE_LABEL, DAY_SHORT, RULEBOOK_LABEL, formatDate, formatTime, mondayOf } from "../../lib/format";
import { useVenues } from "../../lib/queries/catalog";
import { useClashGrid } from "../../lib/queries/pricing";

export default function ClashesPage() {
  const [venueId, setVenueId] = useState("VEN-0233");
  const [rulebook, setRulebook] = useState<RulebookName>("legacy");
  const [weekOf, setWeekOf] = useState(() => mondayOf(new Date()));
  const [picked, setPicked] = useState<SelectedSlot | null>(null);

  const venues = useVenues();
  const grid = useClashGrid(venueId, rulebook, weekOf);

  // Every distinct double discount this week, with the days it happens.
  const doubleDiscounts = useMemo(() => {
    const found = new Map<string, Set<string>>();
    for (const day of grid.data?.days ?? []) {
      for (const slot of day.slots) {
        for (const clash of slot.clashes) {
          if (clash.kind !== "stacks") continue;
          const days = found.get(clash.message) ?? new Set<string>();
          days.add(DAY_SHORT[day.day]);
          found.set(clash.message, days);
        }
      }
    }
    return [...found].map(([message, days]) => ({ message, days: [...days].join(", ") }));
  }, [grid.data]);

  // Hours in the week, while open, where someone can get two discounts.
  const doubleHours = useMemo(() => {
    let slots = 0;
    for (const day of grid.data?.days ?? []) {
      for (const slot of day.slots) if (slotTone(slot) === "stacks") slots += 1;
    }
    return slots / 2;
  }, [grid.data]);

  // Until someone clicks, show the most important slot: a double discount if
  // there is one, otherwise the first overlap.
  const selected = useMemo<SelectedSlot | null>(() => {
    if (picked) return picked;
    for (const tone of ["stacks", "competes"] as const) {
      for (const day of grid.data?.days ?? []) {
        const slot = day.slots.find((candidate) => slotTone(candidate) === tone);
        if (slot) return { day, slot };
      }
    }
    return null;
  }, [picked, grid.data]);
  const setSelected = setPicked;
  const venueName = venues.data?.find((venue) => venue.venueId === venueId)?.name ?? "this venue";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Week at a glance"
        description="One venue, one week, in half-hour squares. Where do deals overlap, and does anyone get two discounts at once?"
        tip="Red squares are the problem. Click any square to see which deals run then. Switch between today's till and the new rules to compare."
      />

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>Venue</Label>
          <Select value={venueId} onValueChange={(value) => { setVenueId(value); setSelected(null); }}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {venues.data?.map((venue) => (
                <SelectItem key={venue.venueId} value={venue.venueId}>
                  {venue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Rules</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={rulebook}
            onValueChange={(value) => {
              if (!value) return;
              setRulebook(value as RulebookName);
              setSelected(null);
            }}
          >
            {(["legacy", "live", "draft"] as const).map((name) => (
              <ToggleGroupItem key={name} value={name}>
                {RULEBOOK_LABEL[name]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="week">Week of</Label>
          <Input
            id="week"
            type="date"
            className="w-44"
            value={weekOf}
            onChange={(e) => {
              if (!e.target.value) return;
              setWeekOf(mondayOf(new Date(`${e.target.value}T12:00:00`)));
              setSelected(null);
            }}
          />
        </div>
      </div>

      {grid.data ? (
        <div
          className={cn(
            "rounded-xl border p-4 text-base",
            doubleHours > 0 ? "border-destructive/40 bg-destructive/10" : "border-success/40 bg-success/10",
          )}
        >
          {doubleHours > 0 ? (
            <>
              With <strong>{RULEBOOK_LABEL[rulebook].toLowerCase()}</strong>, customers at {venueName} can get{" "}
              <strong>two discounts on the same item for {doubleHours} hours</strong> this week.
            </>
          ) : (
            <>
              With <strong>{RULEBOOK_LABEL[rulebook].toLowerCase()}</strong>, nobody at {venueName} gets two discounts
              on the same item this week. Where deals overlap, the customer gets the better one.
            </>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {TONE_LEGEND.map((item) => (
          <span key={item.tone} className="flex items-center gap-1.5">
            <ToneSwatch tone={item.tone} /> {item.label}
          </span>
        ))}
      </div>

      {grid.isPending ? (
        <LoadingBlock className="h-96" />
      ) : grid.isError ? (
        <QueryError error={grid.error} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <ClashGrid days={grid.data.days} selected={selected} onSelect={setSelected} />
          <div className="space-y-4">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Two discounts on one item</CardTitle>
                <CardDescription>
                  {doubleDiscounts.length === 0 ? "None this week." : "Where it happens, and on which days:"}
                </CardDescription>
              </CardHeader>
              {doubleDiscounts.length > 0 ? (
                <CardContent className="space-y-2 text-sm">
                  {doubleDiscounts.map((item) => (
                    <div key={item.message}>
                      <p>{item.message}</p>
                      <p className="text-xs text-muted-foreground">{item.days}</p>
                    </div>
                  ))}
                </CardContent>
              ) : null}
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>
                  {selected
                    ? `${DAY_SHORT[selected.day.day]} ${formatDate(selected.day.tradingDate).split(" ").slice(1).join(" ")}, ${formatTime(selected.slot.startsAt)}`
                    : "Click a square"}
                </CardTitle>
                <CardDescription>
                  {selected
                    ? selected.slot.open
                      ? `${selected.slot.active.length} deal${selected.slot.active.length === 1 ? "" : "s"} running`
                      : "Closed"
                    : "Nothing overlaps this week."}
                </CardDescription>
              </CardHeader>
              {selected ? (
                <CardContent className="space-y-3 text-sm">
                  {selected.slot.active.length === 0 ? (
                    <p className="text-muted-foreground">No deals running.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selected.slot.active.map((active) => (
                        <Badge key={active.promotionId} variant="secondary">
                          {active.name}
                          {active.audience !== "everyone" ? ` · ${AUDIENCE_LABEL[active.audience]}` : ""}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {selected.slot.clashes.map((clash) => (
                    <p key={clash.promotionIds.join()} className={clash.kind === "stacks" ? "text-destructive" : undefined}>
                      {clash.message}
                    </p>
                  ))}
                </CardContent>
              ) : null}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
