import { z } from "zod";

// Trestle money is integer cents, AUD.
export const CentsSchema = z.number().int().min(0);

export const DaySchema = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

// "HH:mm". "24:00" is allowed so an all-day window can be written 00:00–24:00
// instead of Trestle's 00:00–23:59, which silently drops the last minute.
export const TimeOfDaySchema = z
  .string()
  .regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/, "Expected HH:mm");

export const IsoDateSchema = z.iso.date();

// Venue-local wall-clock time, no offset: "2026-09-22T19:00".
export const LocalDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Expected YYYY-MM-DDTHH:mm");

// Marks data we had to invent because Trestle did not supply it, so the UI can
// show it and nobody mistakes an assumption for a fact.
export const DataSourceSchema = z.enum(["trestle", "derived", "assumed"]);
