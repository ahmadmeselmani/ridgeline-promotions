import { z } from "zod";
import { StaffMemberSchema, StaffPermissionSchema } from "./staff.schema";

export type StaffPermission = z.infer<typeof StaffPermissionSchema>;
export type StaffMember = z.infer<typeof StaffMemberSchema>;
