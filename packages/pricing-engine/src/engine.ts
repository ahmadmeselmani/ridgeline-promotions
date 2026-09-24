import type {
  AppliedPromotion,
  BasketLine,
  PricedLine,
  SkippedPromotion,
  TradingMoment,
} from "@ridgeline/contracts/pricing";
import type { Audience, Promotion } from "@ridgeline/contracts/promotions";
import type { PricingPolicy } from "@ridgeline/contracts/rulebooks";
import { STACKS_WITH_ANY } from "@ridgeline/contracts/promotions";
import { formatCents, percentOf } from "./money";
import { checkSchedule, effectiveSchedule, runsAtVenue } from "./schedule";
import { type CatalogProduct, describeSlots, productInScope } from "./scope";
import { dayName, formatDate } from "./time";

export interface PriceBasketInput {
  venueId: string;
  moment: TradingMoment;
  // null = a guest; member/staff unlock deals for that audience.
  audience: Exclude<Audience, "everyone"> | null;
  lines: readonly BasketLine[];
  catalog: ReadonlyMap<string, CatalogProduct>;
  promotions: readonly Promotion[];
  policy: PricingPolicy;
}

export interface PriceBasketResult {
  lines: PricedLine[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  notes: string[];
}

export class UnknownProductError extends Error {
  constructor(public readonly productId: string) {
    super(`Product ${productId} is not sold at this venue`);
    this.name = "UnknownProductError";
  }
}

interface Unit {
  index: number;
  product: CatalogProduct;
  listCents: number;
  priceCents: number;
  primary: Promotion | null;
  bundleGroup: string | null;
  applied: AppliedPromotion[];
  skipped: Map<string, SkippedPromotion>;
}

interface Candidate {
  promotion: Promotion;
  // After this deal alone.
  priceCents: number;
  // After any deals a rule allows on top of it. Best price compares these, so
  // a smaller deal that allows an extra can beat a bigger one that doesn't.
  finalCents: number;
}

/**
 * Prices a basket and explains every decision.
 *
 * Order of play:
 *   1. Work out which deals are on right now for this venue and customer.
 *   2. Form bundles (Parma & Pint) where that beats pricing items separately.
 *   3. Give every other item its one best deal (or highest priority, if the
 *      rulebook uses Trestle's legacy policy).
 *   4. Add deals on top only where a rule explicitly says it stacks.
 */
export function priceBasket(input: PriceBasketInput): PriceBasketResult {
  const units = expandUnits(input);
  const { live, notNow } = partitionPromotions(input);

  const singles = live.filter((promotion) => promotion.type !== "bundle_price");
  const bundles = live
    .filter((promotion) => promotion.type === "bundle_price")
    .sort(byPriorityThenId);

  const stackers = stackersOf(singles);

  applyBundles(units, bundles, singles, stackers, input.policy);
  applySingles(units, singles, stackers, input.policy);
  applyStacking(units, stackers);
  explainNotNow(units, notNow);

  const lines = groupIntoLines(units);
  const subtotalCents = sum(lines.map((line) => line.listCents));
  const totalCents = sum(lines.map((line) => line.finalCents));

  return {
    lines,
    subtotalCents,
    discountCents: subtotalCents - totalCents,
    totalCents,
    notes: momentNotes(input.moment),
  };
}

function expandUnits(input: PriceBasketInput): Unit[] {
  const units: Unit[] = [];
  for (const line of input.lines) {
    const product = input.catalog.get(line.productId);
    if (!product) throw new UnknownProductError(line.productId);
    for (let n = 0; n < line.quantity; n += 1) {
      units.push({
        index: units.length,
        product,
        listCents: product.priceCents,
        priceCents: product.priceCents,
        primary: null,
        bundleGroup: null,
        applied: [],
        skipped: new Map(),
      });
    }
  }
  return units;
}

function partitionPromotions(input: PriceBasketInput): {
  live: Promotion[];
  notNow: Array<{ promotion: Promotion; reason: string }>;
} {
  const live: Promotion[] = [];
  const notNow: Array<{ promotion: Promotion; reason: string }> = [];

  for (const promotion of input.promotions) {
    if (!promotion.active) continue;
    // Deals for a different kind of customer are simply not relevant, so we
    // don't clutter the receipt explaining them.
    if (
      promotion.audience !== "everyone" &&
      promotion.audience !== input.audience
    ) {
      continue;
    }
    if (!runsAtVenue(promotion, input.venueId)) continue;
    const check = checkSchedule(
      effectiveSchedule(promotion, input.venueId),
      input.moment,
    );
    if (check.ok) live.push(promotion);
    // Explain deals that run today but not right now ("happy hour ended at
    // 6pm"); stay quiet about deals for other days.
    else if (check.kind !== "day") {
      notNow.push({ promotion, reason: check.reason });
    }
  }

  return { live, notNow };
}

function singlePrice(promotion: Promotion, unit: Unit): number | null {
  if (!productInScope(promotion.appliesTo, unit.product)) return null;
  switch (promotion.type) {
    case "percent_off":
      return unit.listCents - percentOf(unit.listCents, promotion.value);
    case "fixed_price":
      // A "deal" price above the menu price is never charged.
      return promotion.value < unit.listCents ? promotion.value : null;
    case "bundle_price":
      return null;
  }
}

function rankCandidates(
  candidates: Candidate[],
  policy: PricingPolicy,
): Candidate[] {
  return [...candidates].sort((a, b) => {
    if (policy.resolution === "priority") {
      return (
        b.promotion.priority - a.promotion.priority ||
        a.finalCents - b.finalCents ||
        a.promotion.promotionId.localeCompare(b.promotion.promotionId)
      );
    }
    return (
      a.finalCents - b.finalCents ||
      b.promotion.priority - a.promotion.priority ||
      a.promotion.promotionId.localeCompare(b.promotion.promotionId)
    );
  });
}

function candidatesFor(
  unit: Unit,
  singles: readonly Promotion[],
  stackers: readonly Promotion[],
): Candidate[] {
  const candidates: Candidate[] = [];
  for (const promotion of singles) {
    const priceCents = singlePrice(promotion, unit);
    if (priceCents === null) continue;
    const { finalCents } = stackOnto(priceCents, promotion, unit.product, stackers);
    candidates.push({ promotion, priceCents, finalCents });
  }
  return candidates;
}

function applyBundles(
  units: Unit[],
  bundles: readonly Promotion[],
  singles: readonly Promotion[],
  stackers: readonly Promotion[],
  policy: PricingPolicy,
): void {
  for (const bundle of bundles) {
    if (bundle.appliesTo.kind !== "bundle") continue;
    const slots = bundle.appliesTo.slots;
    let formed = 0;

    for (;;) {
      const free = units.filter((unit) => unit.primary === null);
      const chosen = fillSlots(slots, free);
      if (!chosen) break;

      const bests = chosen.map(
        (unit) =>
          rankCandidates(candidatesFor(unit, singles, stackers), policy)[0],
      );
      const alternativeCents = sum(
        chosen.map((unit, i) => bests[i]?.finalCents ?? unit.listCents),
      );
      const listCents = sum(chosen.map((unit) => unit.listCents));
      const allocation = allocate(
        bundle.value,
        chosen.map((unit) => unit.listCents),
      );
      const stacked = chosen.map((unit, i) =>
        stackOnto(allocation[i] ?? unit.listCents, bundle, unit.product, stackers),
      );
      const bundleCents = sum(stacked.map((result) => result.finalCents));

      let decline: string | null = null;
      // Like a fixed price, a bundle that costs more than its items is never
      // charged, whatever the policy.
      if (bundle.value >= listCents) {
        decline = `Bundle price isn't below the menu price (${formatCents(bundle.value)} vs ${formatCents(listCents)})`;
      } else if (policy.resolution === "best_price") {
        if (bundleCents >= alternativeCents) {
          decline = `Cheaper without the bundle: ${formatCents(alternativeCents)} vs ${formatCents(bundleCents)}`;
        }
      } else {
        const rival = bests
          .filter((best): best is Candidate => best !== undefined)
          .sort((a, b) => b.promotion.priority - a.promotion.priority)[0];
        if (rival && rival.promotion.priority >= bundle.priority) {
          decline = `Lower priority than ${rival.promotion.name}`;
        }
      }

      if (decline) {
        for (const unit of chosen) skip(unit, bundle, decline);
        break;
      }

      formed += 1;
      const group = `${bundle.promotionId}#${formed}`;
      chosen.forEach((unit, i) => {
        const priceCents = allocation[i] ?? unit.listCents;
        unit.primary = bundle;
        unit.bundleGroup = group;
        unit.priceCents = priceCents;
        unit.applied.push({
          promotionId: bundle.promotionId,
          name: bundle.name,
          role: "bundle",
          discountCents: unit.listCents - priceCents,
        });
        const why =
          policy.resolution === "best_price"
            ? `Part of ${bundle.name} — cheaper as a bundle (${formatCents(bundleCents)} vs ${formatCents(alternativeCents)})`
            : `${bundle.name} has higher priority`;
        for (const candidate of candidatesFor(unit, singles, stackers)) {
          skip(unit, candidate.promotion, why);
        }
      });
    }

    // Anything that could have been in the bundle but wasn't: say what's missing.
    const leftovers = units.filter(
      (unit) =>
        unit.primary === null &&
        !unit.skipped.has(bundle.promotionId) &&
        productInScope(bundle.appliesTo, unit.product),
    );
    for (const unit of leftovers) {
      skip(unit, bundle, `Needs ${describeSlots(slots)}`);
    }
  }
}

// Customer-friendly: each slot takes the most expensive qualifying items, so
// the bundle saves as much as it can.
function fillSlots(
  slots: ReadonlyArray<{ productIds: string[]; quantity: number }>,
  free: readonly Unit[],
): Unit[] | null {
  const used = new Set<number>();
  const chosen: Unit[] = [];
  for (const slot of slots) {
    const picks = free
      .filter(
        (unit) =>
          !used.has(unit.index) &&
          slot.productIds.includes(unit.product.productId),
      )
      .sort((a, b) => b.listCents - a.listCents)
      .slice(0, slot.quantity);
    if (picks.length < slot.quantity) return null;
    for (const pick of picks) {
      used.add(pick.index);
      chosen.push(pick);
    }
  }
  return chosen;
}

// Splits a bundle price across its items in proportion to menu price, so
// per-line sales reporting still adds up to the bundle price exactly.
function allocate(totalCents: number, weights: readonly number[]): number[] {
  const weightTotal = sum(weights);
  if (weightTotal === 0) return weights.map(() => 0);
  const shares = weights.map((weight) =>
    Math.floor((totalCents * weight) / weightTotal),
  );
  const remainder = totalCents - sum(shares);
  const last = shares.length - 1;
  shares[last] = (shares[last] ?? 0) + remainder;
  return shares;
}

function applySingles(
  units: Unit[],
  singles: readonly Promotion[],
  stackers: readonly Promotion[],
  policy: PricingPolicy,
): void {
  for (const unit of units) {
    if (unit.primary !== null) continue;
    const ranked = rankCandidates(
      candidatesFor(unit, singles, stackers),
      policy,
    );
    const winner = ranked[0];
    if (!winner) continue;

    unit.primary = winner.promotion;
    unit.priceCents = winner.priceCents;
    unit.applied.push({
      promotionId: winner.promotion.promotionId,
      name: winner.promotion.name,
      role: "primary",
      discountCents: unit.listCents - winner.priceCents,
    });

    for (const loser of ranked.slice(1)) {
      skip(unit, loser.promotion, loserReason(loser, winner, policy));
    }
  }
}

function loserReason(
  loser: Candidate,
  winner: Candidate,
  policy: PricingPolicy,
): string {
  if (policy.resolution === "priority") {
    return `Lower priority than ${winner.promotion.name}`;
  }
  if (loser.finalCents === winner.finalCents) {
    return `Same price as ${winner.promotion.name} — one deal per item`;
  }
  return `One deal per item — ${winner.promotion.name} is cheaper (${formatCents(winner.finalCents)} vs ${formatCents(loser.finalCents)})`;
}

// Deals that may go on top of another one, in the order they're applied.
function stackersOf(singles: readonly Promotion[]): Promotion[] {
  return singles
    .filter(
      (promotion) =>
        promotion.type === "percent_off" && promotion.stacksWith.length > 0,
    )
    .sort(byPriorityThenId);
}

// Adds every deal a rule allows on top of `primary`. Used both to choose the
// best deal and to apply it, so the price compared is the price charged.
function stackOnto(
  priceCents: number,
  primary: Promotion,
  product: CatalogProduct,
  stackers: readonly Promotion[],
): { finalCents: number; applied: AppliedPromotion[] } {
  let finalCents = priceCents;
  const applied: AppliedPromotion[] = [];
  for (const stacker of stackers) {
    if (stacker.promotionId === primary.promotionId) continue;
    if (!productInScope(stacker.appliesTo, product)) continue;
    const allowed =
      stacker.stacksWith.includes(STACKS_WITH_ANY) ||
      stacker.stacksWith.includes(primary.promotionId);
    if (!allowed) continue;

    const discountCents = percentOf(finalCents, stacker.value);
    finalCents -= discountCents;
    applied.push({
      promotionId: stacker.promotionId,
      name: stacker.name,
      role: "stacked",
      discountCents,
    });
  }
  return { finalCents, applied };
}

function applyStacking(units: Unit[], stackers: readonly Promotion[]): void {
  for (const unit of units) {
    if (!unit.primary) continue;
    const { finalCents, applied } = stackOnto(
      unit.priceCents,
      unit.primary,
      unit.product,
      stackers,
    );
    unit.priceCents = finalCents;
    for (const extra of applied) {
      unit.applied.push(extra);
      unit.skipped.delete(extra.promotionId);
    }
  }
}

function explainNotNow(
  units: Unit[],
  notNow: ReadonlyArray<{ promotion: Promotion; reason: string }>,
): void {
  for (const unit of units) {
    for (const { promotion, reason } of notNow) {
      if (productInScope(promotion.appliesTo, unit.product)) {
        skip(unit, promotion, reason);
      }
    }
  }
}

function skip(unit: Unit, promotion: Promotion, reason: string): void {
  if (unit.skipped.has(promotion.promotionId)) return;
  unit.skipped.set(promotion.promotionId, {
    promotionId: promotion.promotionId,
    name: promotion.name,
    reason,
  });
}

function groupIntoLines(units: readonly Unit[]): PricedLine[] {
  const lines = new Map<string, PricedLine>();
  for (const unit of units) {
    const key = [
      unit.product.productId,
      unit.bundleGroup ?? "",
      unit.applied.map((a) => `${a.promotionId}:${a.role}`).join(","),
    ].join("|");
    const existing = lines.get(key);
    if (!existing) {
      lines.set(key, {
        productId: unit.product.productId,
        name: unit.product.name,
        quantity: 1,
        unitListCents: unit.listCents,
        listCents: unit.listCents,
        finalCents: unit.priceCents,
        discountCents: unit.listCents - unit.priceCents,
        bundleGroup: unit.bundleGroup,
        applied: unit.applied.map((applied) => ({ ...applied })),
        skipped: [...unit.skipped.values()],
      });
      continue;
    }
    existing.quantity += 1;
    existing.listCents += unit.listCents;
    existing.finalCents += unit.priceCents;
    existing.discountCents += unit.listCents - unit.priceCents;
    unit.applied.forEach((applied, i) => {
      const target = existing.applied[i];
      if (target) target.discountCents += applied.discountCents;
    });
  }
  return [...lines.values()];
}

function momentNotes(moment: TradingMoment): string[] {
  if (!moment.afterMidnight) return [];
  return [
    `It's after midnight, so this counts as ${dayName(moment.tradingDay)} ${formatDate(moment.tradingDate)} trading.`,
  ];
}

function byPriorityThenId(a: Promotion, b: Promotion): number {
  return b.priority - a.priority || a.promotionId.localeCompare(b.promotionId);
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
