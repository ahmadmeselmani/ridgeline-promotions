import { z } from "zod";
import { VenueSchema } from "./venue.schema";

export const VenueResponseSchema = VenueSchema;

export type VenueResponse = z.infer<typeof VenueResponseSchema>;
