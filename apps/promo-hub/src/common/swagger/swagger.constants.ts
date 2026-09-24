import type { SwaggerSetupOptions } from "@ridgeline/nest-common";

export const HUB_SWAGGER_OPTIONS: SwaggerSetupOptions = {
  title: "Ridgeline Promotions API",
  description:
    "Promotion rulebook, explainable pricing and a stub of the Trestle POS API built from the sandbox fixtures.",
  version: "0.1.0",
};

export const SWAGGER_TAGS = {
  health: "Health",
  venues: "Venues",
  products: "Products",
  members: "Members",
  staff: "Staff",
  rulebooks: "Rulebooks",
  promotions: "Promotions",
  pricing: "Pricing",
  scenarios: "Scenarios",
  overrides: "Price overrides",
} as const;
