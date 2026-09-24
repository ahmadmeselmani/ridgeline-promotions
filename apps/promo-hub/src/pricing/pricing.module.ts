import { Module } from "@nestjs/common";
import { MembersModule } from "../members/members.module";
import { ProductsModule } from "../products/products.module";
import { RulebooksModule } from "../rulebooks/rulebooks.module";
import { ScenariosModule } from "../scenarios/scenarios.module";
import { StaffModule } from "../staff/staff.module";
import { VenuesModule } from "../venues/venues.module";
import { PricingController } from "./pricing.controller";
import { PricingService } from "./pricing.service";

@Module({
  imports: [
    VenuesModule,
    ProductsModule,
    MembersModule,
    StaffModule,
    RulebooksModule,
    ScenariosModule,
  ],
  controllers: [PricingController],
  providers: [PricingService],
})
export class PricingModule {}
