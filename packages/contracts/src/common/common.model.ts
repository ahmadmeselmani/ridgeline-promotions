import { z } from "zod";
import {
  DataSourceSchema,
  DaySchema,
  LocalDateTimeSchema,
  TimeOfDaySchema,
} from "./common.schema";

export type Day = z.infer<typeof DaySchema>;
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>;
export type LocalDateTime = z.infer<typeof LocalDateTimeSchema>;
export type DataSource = z.infer<typeof DataSourceSchema>;

export const DAYS: readonly Day[] = DaySchema.options;
