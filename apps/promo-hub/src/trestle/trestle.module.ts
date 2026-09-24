import { Global, Module } from "@nestjs/common";
import { TrestleService } from "./trestle.service";

@Global()
@Module({
  providers: [TrestleService],
  exports: [TrestleService],
})
export class TrestleModule {}
