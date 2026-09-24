import { Module } from "@nestjs/common";
import { ProductsClient } from "./products.client";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductsClient],
  exports: [ProductsService],
})
export class ProductsModule {}
