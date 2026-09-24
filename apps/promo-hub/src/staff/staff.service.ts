import { Injectable } from "@nestjs/common";
import type { StaffMemberResponse, StaffPermission } from "@ridgeline/contracts/staff";
import type { TrestleStaff } from "../trestle/trestle.types";
import { StaffClient } from "./staff.client";

@Injectable()
export class StaffService {
  constructor(private readonly staffClient: StaffClient) {}

  findAll(): StaffMemberResponse[] {
    return this.staffClient.findMany().map((staff) => this.toResponse(staff));
  }

  find(staffId: string): StaffMemberResponse | null {
    return this.findAll().find((staff) => staff.staffId === staffId) ?? null;
  }

  private toResponse(staff: TrestleStaff): StaffMemberResponse {
    return {
      staffId: staff.staff_id,
      name: staff.name,
      role: staff.role,
      permissions: staff.permissions as StaffPermission[],
    };
  }
}
