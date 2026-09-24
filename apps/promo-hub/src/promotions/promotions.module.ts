import { Module } from "@nestjs/common";
import { ProductsModule } from "../products/products.module";
import { RulebooksModule } from "../rulebooks/rulebooks.module";
import { VenuesModule } from "../venues/venues.module";
import { PromotionsController } from "./promotions.controller";
import { PromotionsService } from "./promotions.service";

@Module({
  imports: [RulebooksModule, VenuesModule, ProductsModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
