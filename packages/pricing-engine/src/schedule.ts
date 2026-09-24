import type { Day } from "@ridgeline/contracts/common";
import type { TradingMoment } from "@ridgeline/contracts/pricing";
import type { Promotion } from "@ridgeline/contracts/promotions";
import { DAYS } from "@ridgeline/contracts/common";
import {
  MINUTES_PER_DAY,
  dayName,
  formatDate,
  formatTime,
  toMinutes,
} from "./time";

export interface EffectiveSchedule {
  enabled: boolean;
  days: readonly Day[];
  startsAt: string;
  endsAt: string;
  validFrom: string | null;
  validTo: string | null;
  // True when a venue exception changed the group-wide times or days.
  venueSpecific: boolean;
}

// `kind` lets callers decide what is worth explaining: a deal that runs today
// but not right now is useful at the till; one that runs on another day isn't.
export type ScheduleCheck =
  | { ok: true }
  | { ok: false; kind: "venue" | "date" | "day" | "time"; reason: string };

export function runsAtVenue(promotion: Promotion, venueId: string): boolean {
  return promotion.venueIds === null || promotion.venueIds.includes(venueId);
}

export function effectiveSchedule(
  promotion: Promotion,
  venueId: string,
): EffectiveSchedule {
  const base = promotion.schedule;
  const override = promotion.venueOverrides.find(
    (candidate) => candidate.venueId === venueId,
  );
  return {
    enabled: override?.enabled ?? true,
    days: override?.days ?? base.days,
    startsAt: override?.startsAt ?? base.startsAt,
    endsAt: override?.endsAt ?? base.endsAt,
    validFrom: base.validFrom,
    validTo: base.validTo,
    venueSpecific: Boolean(
      override && (override.days || override.startsAt || override.endsAt),
    ),
  };
}

// [startsAt, endsAt). endsAt before startsAt runs past midnight.
export function isInWindow(
  startsAt: string,
  endsAt: string,
  timeOfDay: string,
): boolean {
  const start = toMinutes(startsAt);
  const end = toMinutes(endsAt);
  const now = toMinutes(timeOfDay);
  if (start === end) return true;
  if (start < end) return now >= start && now < end;
  return now >= start || now < end;
}

export function checkSchedule(
  schedule: EffectiveSchedule,
  moment: TradingMoment,
): ScheduleCheck {
  if (!schedule.enabled) {
    return { ok: false, kind: "venue", reason: "Switched off at this venue" };
  }
  if (schedule.validFrom && moment.tradingDate < schedule.validFrom) {
    return { ok: false, kind: "date", reason: `Starts ${formatDate(schedule.validFrom)}` };
  }
  if (schedule.validTo && moment.tradingDate > schedule.validTo) {
    return { ok: false, kind: "date", reason: `Ended ${formatDate(schedule.validTo)}` };
  }
  if (!schedule.days.includes(moment.tradingDay)) {
    return {
      ok: false,
      kind: "day",
      reason: `Only ${describeDays(schedule.days)} — this is ${dayName(moment.tradingDay)}`,
    };
  }
  if (!isInWindow(schedule.startsAt, schedule.endsAt, moment.timeOfDay)) {
    const where = schedule.venueSpecific ? " at this venue" : "";
    return {
      ok: false,
      kind: "time",
      reason: `Runs ${describeWindow(schedule.startsAt, schedule.endsAt)}${where}`,
    };
  }
  return { ok: true };
}

export function describeDays(days: readonly Day[]): string {
  const set = new Set(days);
  if (set.size === 7) return "every day";
  const weekdays: Day[] = ["mon", "tue", "wed", "thu", "fri"];
  if (set.size === 5 && weekdays.every((day) => set.has(day))) {
    return "Mon–Fri";
  }
  return DAYS.filter((day) => set.has(day))
    .map((day) => dayName(day).slice(0, 3))
    .join(", ");
}

export function describeWindow(startsAt: string, endsAt: string): string {
  const start = toMinutes(startsAt);
  const end = toMinutes(endsAt);
  if (start === end || (start === 0 && end === MINUTES_PER_DAY)) {
    return "all day";
  }
  return `${formatTime(startsAt)}–${formatTime(endsAt)}`;
}
