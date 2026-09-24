import { Module } from "@nestjs/common";
import { MembersClient } from "./members.client";
import { MembersController } from "./members.controller";
import { MembersService } from "./members.service";

@Module({
  controllers: [MembersController],
  providers: [MembersService, MembersClient],
  exports: [MembersService],
})
export class MembersModule {}
