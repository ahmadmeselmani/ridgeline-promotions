import { Injectable } from "@nestjs/common";
import { TrestleService } from "../trestle/trestle.service";
import type { TrestleMember } from "../trestle/trestle.types";

@Injectable()
export class MembersClient {
  constructor(private readonly trestle: TrestleService) {}

  findUnique(memberNumber: string): TrestleMember | null {
    return this.trestle.getMember(memberNumber);
  }
}
