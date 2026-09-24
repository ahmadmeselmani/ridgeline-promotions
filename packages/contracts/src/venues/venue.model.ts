import { z } from "zod";
import { TradingHoursSchema, VenueKindSchema, VenueSchema } from "./venue.schema";

export type VenueKind = z.infer<typeof VenueKindSchema>;
export type TradingHours = z.infer<typeof TradingHoursSchema>;
export type Venue = z.infer<typeof VenueSchema>;
