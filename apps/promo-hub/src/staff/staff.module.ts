import { Module } from "@nestjs/common";
import { StaffClient } from "./staff.client";
import { StaffController } from "./staff.controller";
import { StaffService } from "./staff.service";

@Module({
  controllers: [StaffController],
  providers: [StaffService, StaffClient],
  exports: [StaffService],
})
export class StaffModule {}
