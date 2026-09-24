"use client";

import type { ClashDay, ClashSlot } from "@ridgeline/contracts/pricing";
import { cn } from "@ridgeline/ui/lib/utils";
import { DAY_SHORT, formatDate, formatTime } from "../../lib/format";

export interface SelectedSlot {
  day: ClashDay;
  slot: ClashSlot;
}

export function slotTone(slot: ClashSlot): "closed" | "none" | "clean" | "competes" | "stacks" {
  if (!slot.open) return "closed";
  if (slot.clashes.some((clash) => clash.kind === "stacks")) return "stacks";
  if (slot.clashes.length > 0) return "competes";
  if (slot.active.length > 0) return "clean";
  return "none";
}

const TONE_CLASS = {
  closed: "bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,var(--color-muted)_4px,var(--color-muted)_6px)]",
  none: "bg-background",
  clean: "bg-success/25",
  competes: "bg-info/35",
  stacks: "bg-destructive/60",
} as const;

export const TONE_LEGEND = [
  { tone: "stacks", label: "Two discounts on one item" },
  { tone: "competes", label: "Deals overlap, the best one wins (fine)" },
  { tone: "clean", label: "Deals running, no overlap" },
  { tone: "none", label: "No deals" },
  { tone: "closed", label: "Closed" },
] as const;

export function ToneSwatch({ tone }: { tone: keyof typeof TONE_CLASS }) {
  return <span className={cn("inline-block size-3 rounded-sm border", TONE_CLASS[tone])} />;
}

export function ClashGrid({
  days,
  selected,
  onSelect,
}: {
  days: ClashDay[];
  selected: SelectedSlot | null;
  onSelect: (selection: SelectedSlot) => void;
}) {
  // Only draw rows where the venue is open on at least one day. A deal
  // running while the doors are shut can't clash with anything.
  const rowCount = days[0]?.slots.length ?? 0;
  const busy = Array.from({ length: rowCount }, (_, row) =>
    days.some((day) => day.slots[row]?.open),
  );
  const first = busy.indexOf(true);
  const last = busy.lastIndexOf(true);
  const rows = first === -1 ? [] : Array.from({ length: last - first + 1 }, (_, i) => first + i);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[40rem] grid-cols-[4.5rem_repeat(7,1fr)] gap-px rounded-lg border bg-border text-xs">
        <div className="bg-background" />
        {days.map((day) => (
          <div key={day.tradingDate} className="bg-background px-2 py-1.5 text-center">
            <div className="font-medium">{DAY_SHORT[day.day]}</div>
            <div className="text-muted-foreground">{formatDate(day.tradingDate).split(" ").slice(1).join(" ")}</div>
          </div>
        ))}
        {rows.map((row) => {
          const startsAt = days[0]?.slots[row]?.startsAt ?? "";
          return [
            <div key={`t-${row}`} className="bg-background px-2 py-1 text-end text-muted-foreground tabular-nums">
              {startsAt.endsWith(":00") ? formatTime(startsAt) : ""}
            </div>,
            ...days.map((day) => {
              const slot = day.slots[row];
              if (!slot) return <div key={`${day.tradingDate}-${row}`} />;
              const tone = slotTone(slot);
              const isSelected = selected?.day.tradingDate === day.tradingDate && selected.slot.startsAt === slot.startsAt;
              return (
                <button
                  key={`${day.tradingDate}-${row}`}
                  type="button"
                  onClick={() => onSelect({ day, slot })}
                  aria-label={`${DAY_SHORT[day.day]} ${formatTime(slot.startsAt)}: ${slot.open ? slot.active.map((a) => a.name).join(", ") || "no deals" : "closed"}`}
                  title={slot.open ? slot.active.map((a) => a.name).join(", ") || "No deals" : "Closed"}
                  className={cn(
                    "h-5 outline-none hover:ring-2 hover:ring-ring/40 hover:ring-inset focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    TONE_CLASS[tone],
                    isSelected && "ring-2 ring-ring ring-inset",
                  )}
                >
                </button>
              );
            }),
          ];
        })}
      </div>
    </div>
  );
}
