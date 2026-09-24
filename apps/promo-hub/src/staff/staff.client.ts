import { Injectable } from "@nestjs/common";
import { TrestleService } from "../trestle/trestle.service";
import type { TrestleStaff } from "../trestle/trestle.types";

@Injectable()
export class StaffClient {
  constructor(private readonly trestle: TrestleService) {}

  findMany(): TrestleStaff[] {
    return this.trestle.listStaff();
  }
}
