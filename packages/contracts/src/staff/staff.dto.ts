import { z } from "zod";
import { StaffMemberSchema } from "./staff.schema";

export const StaffMemberResponseSchema = StaffMemberSchema;

export type StaffMemberResponse = z.infer<typeof StaffMemberResponseSchema>;
