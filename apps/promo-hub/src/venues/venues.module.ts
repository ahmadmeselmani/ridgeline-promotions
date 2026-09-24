import { Module } from "@nestjs/common";
import { VenuesClient } from "./venues.client";
import { VenuesController } from "./venues.controller";
import { VenuesService } from "./venues.service";

@Module({
  controllers: [VenuesController],
  providers: [VenuesService, VenuesClient],
  exports: [VenuesService],
})
export class VenuesModule {}
