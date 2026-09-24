// Shapes exactly as the Trestle v2 sandbox returns them (snake_case). Only
// the resources this prototype needs; payments, settlements and orders are
// deliberately out of scope.

export interface TrestleVenue {
  venue_id: string;
  name: string;
  state: string;
  timezone: string | null;
  trading_hours: Record<string, [string, string]>;
}

export interface TrestleProduct {
  product_id: string;
  name: string;
  category: string;
  price_cents: number;
  tax_code: string;
}

export interface TrestleMember {
  member_number: string;
  name: string;
  tier: string;
  discount_pct: number;
  active: boolean;
}

export interface TrestleStaff {
  staff_id: string;
  name: string;
  role: string;
  permissions: string[];
}

export type TrestleAppliesTo =
  | { all: true }
  | { category: string }
  | { product_id: string }
  | { bundle: string[] };

export interface TrestlePromotion {
  promotion_id: string;
  name: string;
  type: "percent_off" | "fixed_price" | "bundle_price";
  value: number;
  applies_to: TrestleAppliesTo;
  starts_at: string;
  ends_at: string;
  days: string[];
  priority: number;
  // Present in the sandbox data but missing from the API reference.
  stackable?: boolean;
}

export interface TrestleFixtures {
  venues: TrestleVenue[];
  products: TrestleProduct[];
  members: TrestleMember[];
  staff: TrestleStaff[];
  promotions: TrestlePromotion[];
}
