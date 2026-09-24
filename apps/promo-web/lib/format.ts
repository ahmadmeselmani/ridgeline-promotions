import type { Day } from "@ridgeline/contracts/common";
import type { Audience, Promotion, Schedule } from "@ridgeline/contracts/promotions";
import type { DealStatus, RulebookName } from "@ridgeline/contracts/rulebooks";

export const DAY_ORDER: readonly Day[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DAY_SHORT: Record<Day, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

// One vocabulary everywhere. Nobody running a pub says "legacy rulebook".
export const RULEBOOK_LABEL: Record<RulebookName, string> = {
  legacy: "Today's till",
  live: "New rules",
  draft: "Your draft",
};

export const RULEBOOK_HINT: Record<RulebookName, string> = {
  legacy: "How Trestle prices it right now",
  live: "What tills charge once published",
  draft: "Your unpublished changes",
};

// Where a deal in your draft stands against what the tills run.
export const DEAL_STATUS_LABEL: Record<DealStatus, string> = {
  published: "Published",
  changed: "Changed, not published",
  new: "New, not published",
  turned_off: "Turned off, not published",
  removed: "Removed, not published",
};

export const AUDIENCE_LABEL: Record<Audience, string> = {
  everyone: "Everyone",
  member: "Members",
  staff: "Staff",
};

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

export function formatDelta(cents: number): string {
  if (cents === 0) return "no change";
  return cents > 0 ? `+${formatCents(cents)}` : `-${formatCents(-cents)}`;
}

export function formatTime(time: string): string {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const minutes = h * 60 + m;
  if (minutes === 0 || minutes === 1440) return "midnight";
  const suffix = h < 12 ? "am" : "pm";
  const hours12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hours12}${suffix}` : `${hours12}:${String(m).padStart(2, "0")}${suffix}`;
}

export function describeDays(days: readonly Day[]): string {
  const set = new Set(days);
  if (set.size === 7) return "Every day";
  if (set.size === 5 && ["mon", "tue", "wed", "thu", "fri"].every((d) => set.has(d as Day))) {
    return "Mon–Fri";
  }
  return DAY_ORDER.filter((day) => set.has(day)).map((day) => DAY_SHORT[day]).join(", ");
}

export function describeWindow(startsAt: string, endsAt: string): string {
  if (startsAt === endsAt || (startsAt === "00:00" && endsAt === "24:00")) return "all day";
  return `${formatTime(startsAt)}–${formatTime(endsAt)}`;
}

export function describeSchedule(schedule: Schedule): string {
  const parts = [`${describeDays(schedule.days)}, ${describeWindow(schedule.startsAt, schedule.endsAt)}`];
  if (schedule.validFrom && schedule.validFrom === schedule.validTo) {
    parts.push(`on ${formatDate(schedule.validFrom)} only`);
  } else {
    if (schedule.validFrom) parts.push(`from ${formatDate(schedule.validFrom)}`);
    if (schedule.validTo) parts.push(`until ${formatDate(schedule.validTo)}`);
  }
  return parts.join(" · ");
}

export function describeDeal(promotion: Promotion, productName: (id: string) => string): string {
  const { appliesTo } = promotion;
  const target =
    appliesTo.kind === "all"
      ? "everything"
      : appliesTo.kind === "category"
        ? appliesTo.category === "beverage"
          ? "drinks"
          : appliesTo.category
        : appliesTo.kind === "products"
          ? appliesTo.productIds.map(productName).join(", ")
          : appliesTo.slots.map((slot) => `${slot.quantity}× ${slot.label}`).join(" + ");

  switch (promotion.type) {
    case "percent_off":
      return `${promotion.value}% off ${target}`;
    case "fixed_price":
      return `${formatCents(promotion.value)} for ${target}`;
    case "bundle_price":
      return `${formatCents(promotion.value)} for ${target}`;
  }
}

export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function mondayOf(date: Date): string {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const offset = (utc.getUTCDay() + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - offset);
  return utc.toISOString().slice(0, 10);
}
