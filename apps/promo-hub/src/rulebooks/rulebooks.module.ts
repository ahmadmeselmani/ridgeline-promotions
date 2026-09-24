import { Module } from "@nestjs/common";
import { RulebooksClient } from "./rulebooks.client";
import { RulebooksController } from "./rulebooks.controller";
import { RulebooksService } from "./rulebooks.service";

@Module({
  controllers: [RulebooksController],
  providers: [RulebooksService, RulebooksClient],
  exports: [RulebooksService],
})
export class RulebooksModule {}
