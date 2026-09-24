import { Injectable, NotFoundException } from "@nestjs/common";
import type { MemberResponse } from "@ridgeline/contracts/members";
import type { TrestleMember } from "../trestle/trestle.types";
import { MembersClient } from "./members.client";

@Injectable()
export class MembersService {
  constructor(private readonly membersClient: MembersClient) {}

  findOne(memberNumber: string): MemberResponse {
    const member = this.find(memberNumber);
    if (!member) throw new NotFoundException(`Member ${memberNumber} not found`);
    return member;
  }

  find(memberNumber: string): MemberResponse | null {
    const member = this.membersClient.findUnique(memberNumber);
    return member ? this.toResponse(member) : null;
  }

  private toResponse(member: TrestleMember): MemberResponse {
    return {
      memberNumber: member.member_number,
      name: member.name,
      tier: member.tier,
      discountPct: member.discount_pct,
      active: member.active,
    };
  }
}
