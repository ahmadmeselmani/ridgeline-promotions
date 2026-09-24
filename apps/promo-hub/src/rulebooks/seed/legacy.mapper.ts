import type { Day } from "@ridgeline/contracts/common";
import type {
  AppliesTo,
  Audience,
  BundleSlot,
  Promotion,
} from "@ridgeline/contracts/promotions";
import { STACKS_WITH_ANY } from "@ridgeline/contracts/promotions";
import type {
  TrestleAppliesTo,
  TrestleProduct,
  TrestlePromotion,
} from "../../trestle/trestle.types";

/**
 * Maps Trestle's promotion config onto our model *without changing what it
 * does*, so the "legacy" rulebook prices exactly like today's tills: priority
 * wins, `stackable: true` stacks on anything, 00:00–23:59 keeps its gap.
 */
export function mapLegacyPromotion(
  promotion: TrestlePromotion,
  products: readonly TrestleProduct[],
): Promotion {
  return {
    promotionId: promotion.promotion_id,
    name: promotion.name,
    description: "Imported unchanged from Trestle.",
    type: promotion.type,
    value: promotion.value,
    appliesTo: mapAppliesTo(promotion.applies_to, products),
    audience: inferAudience(promotion.name),
    schedule: {
      days: promotion.days as Day[],
      startsAt: promotion.starts_at,
      endsAt: promotion.ends_at,
      validFrom: null,
      validTo: null,
    },
    venueIds: null,
    venueOverrides: [],
    stacksWith: promotion.stackable ? [STACKS_WITH_ANY] : [],
    priority: promotion.priority,
    active: true,
  };
}

// Trestle promotions have no "who is this for" field, so the till can't know
// the member discount is only for members. We infer it from the name — an API
// gap to raise with Trestle.
function inferAudience(name: string): Audience {
  const lower = name.toLowerCase();
  if (lower.includes("member")) return "member";
  if (lower.includes("staff")) return "staff";
  return "everyone";
}

function mapAppliesTo(
  appliesTo: TrestleAppliesTo,
  products: readonly TrestleProduct[],
): AppliesTo {
  if ("all" in appliesTo) return { kind: "all" };
  if ("category" in appliesTo) {
    return { kind: "category", category: appliesTo.category };
  }
  if ("product_id" in appliesTo) {
    return { kind: "products", productIds: [appliesTo.product_id] };
  }
  return { kind: "bundle", slots: bundleSlots(appliesTo.bundle, products) };
}

// ["PRD-0202","PRD-0202","PRD-0101","PRD-0101"] → 2× Parmigiana + 2× Lager.
function bundleSlots(
  productIds: readonly string[],
  products: readonly TrestleProduct[],
): BundleSlot[] {
  const counts = new Map<string, number>();
  for (const productId of productIds) {
    counts.set(productId, (counts.get(productId) ?? 0) + 1);
  }
  return [...counts].map(([productId, quantity]) => ({
    label:
      products.find((product) => product.product_id === productId)?.name ??
      productId,
    productIds: [productId],
    quantity,
  }));
}
