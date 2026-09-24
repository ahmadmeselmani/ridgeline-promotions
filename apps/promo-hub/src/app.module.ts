import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ResponseEnvelopeInterceptor } from "@ridgeline/nest-common";
import { AppController } from "./app.controller";
import { DatabaseModule } from "./database/database.module";
import { MembersModule } from "./members/members.module";
import { OverridesModule } from "./overrides/overrides.module";
import { PricingModule } from "./pricing/pricing.module";
import { ProductsModule } from "./products/products.module";
import { PromotionsModule } from "./promotions/promotions.module";
import { RulebooksModule } from "./rulebooks/rulebooks.module";
import { ScenariosModule } from "./scenarios/scenarios.module";
import { StaffModule } from "./staff/staff.module";
import { TrestleModule } from "./trestle/trestle.module";
import { VenuesModule } from "./venues/venues.module";

@Module({
  imports: [
    DatabaseModule,
    TrestleModule,
    VenuesModule,
    ProductsModule,
    MembersModule,
    StaffModule,
    RulebooksModule,
    PromotionsModule,
    ScenariosModule,
    PricingModule,
    OverridesModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor }],
})
export class AppModule {}
