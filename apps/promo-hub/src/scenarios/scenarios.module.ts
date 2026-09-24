import { Module } from "@nestjs/common";
import { ScenariosClient } from "./scenarios.client";
import { ScenariosController } from "./scenarios.controller";
import { ScenariosService } from "./scenarios.service";

@Module({
  controllers: [ScenariosController],
  providers: [ScenariosService, ScenariosClient],
  exports: [ScenariosService],
})
export class ScenariosModule {}
