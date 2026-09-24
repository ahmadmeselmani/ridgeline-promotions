import type { Clash, ClashDay, ClashSlot } from "@ridgeline/contracts/pricing";
import type { Promotion } from "@ridgeline/contracts/promotions";
import type { PricingPolicy } from "@ridgeline/contracts/rulebooks";
import type { TradingHours } from "@ridgeline/contracts/venues";
import { STACKS_WITH_ANY } from "@ridgeline/contracts/promotions";
import { checkSchedule, effectiveSchedule, runsAtVenue } from "./schedule";
import { type CatalogProduct, productIdsInScope } from "./scope";
import {
  MINUTES_PER_DAY,
  TRADING_DAY_STARTS_AT,
  addDays,
  dayOf,
  fromMinutes,
  toMinutes,
} from "./time";

export interface ClashGridInput {
  venueId: string;
  weekOf: string;
  tradingHours: TradingHours;
  promotions: readonly Promotion[];
  catalog: readonly CatalogProduct[];
  policy: PricingPolicy;
  slotMinutes?: number;
}

/**
 * A week of trading days for one venue, cut into slots. Each slot lists the
 * deals running and every pair that could land on the same item for the same
 * customer — either competing (policy picks one) or stacking (both given).
 * Rows run from 5am to 5am so late trading stays with its own day.
 */
export function buildClashGrid(input: ClashGridInput): ClashDay[] {
  const slotMinutes = input.slotMinutes ?? 30;
  const dayStart = toMinutes(TRADING_DAY_STARTS_AT);
  const scopes = new Map(
    input.promotions.map((promotion) => [
      promotion.promotionId,
      productIdsInScope(promotion.appliesTo, input.catalog),
    ]),
  );
  const names = new Map(
    input.catalog.map((product) => [product.productId, product.name]),
  );

  const days: ClashDay[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const tradingDate = addDays(input.weekOf, offset);
    const tradingDay = dayOf(tradingDate);
    const slots: ClashSlot[] = [];

    for (
      let minute = dayStart;
      minute < dayStart + MINUTES_PER_DAY;
      minute += slotMinutes
    ) {
      const timeOfDay = fromMinutes(minute % MINUTES_PER_DAY);
      const afterMidnight = minute >= MINUTES_PER_DAY;
      const calendarDate = afterMidnight ? addDays(tradingDate, 1) : tradingDate;
      const moment = {
        localDateTime: `${calendarDate}T${timeOfDay}`,
        tradingDate,
        tradingDay,
        timeOfDay,
        afterMidnight,
      };

      const active = input.promotions.filter(
        (promotion) =>
          promotion.active &&
          runsAtVenue(promotion, input.venueId) &&
          checkSchedule(effectiveSchedule(promotion, input.venueId), moment)
            .ok,
      );

      slots.push({
        startsAt: timeOfDay,
        endsAt: fromMinutes((minute + slotMinutes) % MINUTES_PER_DAY),
        open: isOpen(input.tradingHours, tradingDay, minute),
        active: active.map((promotion) => ({
          promotionId: promotion.promotionId,
          name: promotion.name,
          audience: promotion.audience,
        })),
        clashes: findClashes(active, scopes, names, input.policy),
      });
    }

    days.push({ day: tradingDay, tradingDate, slots });
  }
  return days;
}

function findClashes(
  active: readonly Promotion[],
  scopes: ReadonlyMap<string, Set<string>>,
  names: ReadonlyMap<string, string>,
  policy: PricingPolicy,
): Clash[] {
  const clashes: Clash[] = [];
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const a = active[i];
      const b = active[j];
      if (!a || !b || !audiencesOverlap(a, b)) continue;

      const overlap = intersect(
        scopes.get(a.promotionId),
        scopes.get(b.promotionId),
      );
      if (overlap.length === 0) continue;

      const items = describeItems(overlap, names);
      const stacker = stacksOn(a, b) ? a : stacksOn(b, a) ? b : null;
      if (stacker) {
        const base = stacker === a ? b : a;
        clashes.push({
          promotionIds: [a.promotionId, b.promotionId],
          kind: "stacks",
          message: `${stacker.name} is added on top of ${base.name} — double discount on ${items}`,
        });
        continue;
      }

      const outcome =
        policy.resolution === "best_price"
          ? "customer gets whichever is cheaper"
          : `${(a.priority >= b.priority ? a : b).name} wins on priority`;
      clashes.push({
        promotionIds: [a.promotionId, b.promotionId],
        kind: "competes",
        message: `${a.name} and ${b.name} both cover ${items} — ${outcome}`,
      });
    }
  }
  return clashes;
}

function stacksOn(top: Promotion, base: Promotion): boolean {
  return (
    top.type === "percent_off" &&
    (top.stacksWith.includes(STACKS_WITH_ANY) ||
      top.stacksWith.includes(base.promotionId))
  );
}

// One customer is a guest, a member or staff — never two at once.
function audiencesOverlap(a: Promotion, b: Promotion): boolean {
  return (
    a.audience === "everyone" ||
    b.audience === "everyone" ||
    a.audience === b.audience
  );
}

function intersect(
  a: Set<string> | undefined,
  b: Set<string> | undefined,
): string[] {
  if (!a || !b) return [];
  return [...a].filter((id) => b.has(id));
}

function describeItems(
  productIds: readonly string[],
  names: ReadonlyMap<string, string>,
): string {
  if (productIds.length === names.size) return "everything";
  const shown = productIds.slice(0, 3).map((id) => names.get(id) ?? id);
  const more = productIds.length - shown.length;
  return more > 0 ? `${shown.join(", ")} +${more} more` : shown.join(", ");
}

function isOpen(
  tradingHours: TradingHours,
  day: keyof TradingHours,
  minute: number,
): boolean {
  const hours = tradingHours[day];
  if (!hours) return false;
  const open = toMinutes(hours[0]);
  let close = toMinutes(hours[1]);
  if (close <= open) close += MINUTES_PER_DAY;
  return minute >= open && minute < close;
}
