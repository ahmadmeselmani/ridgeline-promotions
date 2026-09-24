import { z } from "zod";
import { DataSourceSchema, DaySchema, TimeOfDaySchema } from "../common/common.schema";

export const VenueKindSchema = z.enum(["pub", "bistro"]);

export const TradingHoursSchema = z.partialRecord(
  DaySchema,
  z.tuple([TimeOfDaySchema, TimeOfDaySchema]),
);

export const VenueSchema = z.object({
  venueId: z.string().min(1),
  name: z.string().min(1),
  state: z.string().min(1),
  timezone: z.string().min(1),
  timezoneSource: DataSourceSchema,
  kind: VenueKindSchema,
  kindSource: DataSourceSchema,
  tradingHours: TradingHoursSchema,
});
