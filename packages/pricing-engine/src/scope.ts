import type { AppliesTo, BundleSlot } from "@ridgeline/contracts/promotions";

export interface CatalogProduct {
  productId: string;
  name: string;
  category: string;
  priceCents: number;
}

export function productInScope(
  appliesTo: AppliesTo,
  product: CatalogProduct,
): boolean {
  switch (appliesTo.kind) {
    case "all":
      return true;
    case "category":
      return product.category === appliesTo.category;
    case "products":
      return appliesTo.productIds.includes(product.productId);
    case "bundle":
      return appliesTo.slots.some((slot) =>
        slot.productIds.includes(product.productId),
      );
  }
}

export function productIdsInScope(
  appliesTo: AppliesTo,
  catalog: Iterable<CatalogProduct>,
): Set<string> {
  const ids = new Set<string>();
  for (const product of catalog) {
    if (productInScope(appliesTo, product)) ids.add(product.productId);
  }
  return ids;
}

export function describeSlots(
  slots: readonly BundleSlot[],
): string {
  return slots.map((slot) => `${slot.quantity}× ${slot.label}`).join(" + ");
}
