import { z } from "zod";
import {
  AppliedPromotionSchema,
  BasketLineSchema,
  CustomerSchema,
  PricedLineSchema,
  ResolvedCustomerSchema,
  SkippedPromotionSchema,
  TradingMomentSchema,
} from "./pricing.schema";

export type Customer = z.infer<typeof CustomerSchema>;
export type BasketLine = z.infer<typeof BasketLineSchema>;
export type AppliedPromotion = z.infer<typeof AppliedPromotionSchema>;
export type SkippedPromotion = z.infer<typeof SkippedPromotionSchema>;
export type PricedLine = z.infer<typeof PricedLineSchema>;
export type TradingMoment = z.infer<typeof TradingMomentSchema>;
export type ResolvedCustomer = z.infer<typeof ResolvedCustomerSchema>;
