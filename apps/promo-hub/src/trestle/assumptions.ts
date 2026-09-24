import type { TrestleProduct } from "./trestle.types";

// Everything in this file is something Trestle didn't tell us. Each one is
// surfaced in the UI (source: "derived" / "assumed") and listed in the README
// so it can be confirmed with Tania rather than quietly baked in.

// Every venue's timezone is null in the sandbox. The state is reliable, and
// each state here has a single timezone.
export const TIMEZONE_BY_STATE: Readonly<Record<string, string>> = {
  SA: "Australia/Adelaide",
  VIC: "Australia/Melbourne",
  NSW: "Australia/Sydney",
  QLD: "Australia/Brisbane",
};

// "Two bistros" — Trestle has no venue type. These two close earliest and
// have food-led names. To confirm with Tania (question 5).
export const ASSUMED_BISTRO_VENUE_IDS: readonly string[] = ["VEN-0907", "VEN-1207"];

// Schnitzel Tuesday is "eighteen dollars including a pot", but the catalogue
// has no pot. Priced below a pint. To confirm with Tania (question 3).
export const ASSUMED_PRODUCTS: readonly TrestleProduct[] = [
  { product_id: "PRD-0109", name: "Lager — pot", category: "beverage", price_cents: 800, tax_code: "GST" },
  { product_id: "PRD-0110", name: "Pale Ale — pot", category: "beverage", price_cents: 850, tax_code: "GST" },
];
