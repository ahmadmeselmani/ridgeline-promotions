import { z } from "zod";

export const StaffPermissionSchema = z.enum([
  "sell",
  "print_receipt",
  "void_line",
  "override_price",
  "close_shift",
  "view_reports",
]);

export const StaffMemberSchema = z.object({
  staffId: z.string().min(1),
  name: z.string().min(1),
  role: z.string(),
  permissions: z.array(StaffPermissionSchema),
});
