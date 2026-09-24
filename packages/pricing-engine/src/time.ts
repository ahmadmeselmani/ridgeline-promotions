import type { Day, LocalDateTime, TimeOfDay } from "@ridgeline/contracts/common";
import type { TradingMoment } from "@ridgeline/contracts/pricing";

// JS getUTCDay() order.
const WEEKDAYS: readonly Day[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const DAY_NAMES: Readonly<Record<Day, string>> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

// Sales before this time belong to the previous trading day. Venues trade to
// 1am at the latest, so 5am is safely after close and before open.
export const TRADING_DAY_STARTS_AT: TimeOfDay = "05:00";

export const MINUTES_PER_DAY = 24 * 60;

export function toMinutes(time: TimeOfDay): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function fromMinutes(totalMinutes: number): TimeOfDay {
  const wrapped =
    totalMinutes === MINUTES_PER_DAY
      ? MINUTES_PER_DAY
      : ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dayOf(isoDate: string): Day {
  const day = WEEKDAYS[new Date(`${isoDate}T00:00:00Z`).getUTCDay()];
  if (!day) throw new Error(`Invalid date ${isoDate}`);
  return day;
}

export function dayName(day: Day): string {
  return DAY_NAMES[day];
}

export function tradingMomentFromLocal(
  localDateTime: LocalDateTime,
  tradingDayStartsAt: TimeOfDay = TRADING_DAY_STARTS_AT,
): TradingMoment {
  const [date, time] = localDateTime.split("T") as [string, TimeOfDay];
  const afterMidnight = toMinutes(time) < toMinutes(tradingDayStartsAt);
  const tradingDate = afterMidnight ? addDays(date, -1) : date;
  return {
    localDateTime,
    tradingDate,
    tradingDay: dayOf(tradingDate),
    timeOfDay: time,
    afterMidnight,
  };
}

// Converts an instant (what a till sends, with offset) to the venue's wall
// clock. This is where daylight saving is handled: the IANA zone knows that
// Adelaide is +09:30 in September and +10:30 from 4 October 2026.
export function toVenueLocal(instant: string, timeZone: string): LocalDateTime {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function formatTime(time: TimeOfDay): string {
  const minutes = toMinutes(time);
  if (minutes === 0 || minutes === MINUTES_PER_DAY) return "midnight";
  const hours24 = Math.floor(minutes / 60);
  const suffix = hours24 < 12 ? "am" : "pm";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const mins = minutes % 60;
  return mins === 0
    ? `${hours12}${suffix}`
    : `${hours12}:${String(mins).padStart(2, "0")}${suffix}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "Tue 3 Nov" — built by hand so it doesn't vary with the server's ICU data.
export function formatDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-").map(Number);
  const weekday = dayName(dayOf(isoDate)).slice(0, 3);
  return `${weekday} ${day} ${MONTHS[(month ?? 1) - 1]}`;
}
