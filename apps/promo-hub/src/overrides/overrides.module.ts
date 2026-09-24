import { Module } from "@nestjs/common";
import { ProductsModule } from "../products/products.module";
import { StaffModule } from "../staff/staff.module";
import { VenuesModule } from "../venues/venues.module";
import { OverridesClient } from "./overrides.client";
import { OverridesController } from "./overrides.controller";
import { OverridesService } from "./overrides.service";

@Module({
  imports: [StaffModule, VenuesModule, ProductsModule],
  controllers: [OverridesController],
  providers: [OverridesService, OverridesClient],
})
export class OverridesModule {}
