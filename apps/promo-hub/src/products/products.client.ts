import { Injectable } from "@nestjs/common";
import { ASSUMED_PRODUCTS } from "../trestle/assumptions";
import { TrestleService } from "../trestle/trestle.service";
import type { TrestleProduct } from "../trestle/trestle.types";

export interface ProductRecord {
  product: TrestleProduct;
  assumed: boolean;
}

@Injectable()
export class ProductsClient {
  constructor(private readonly trestle: TrestleService) {}

  findMany(venueId: string): ProductRecord[] {
    return [
      ...this.trestle.listProducts(venueId).map((product) => ({ product, assumed: false })),
      ...ASSUMED_PRODUCTS.map((product) => ({ product, assumed: true })),
    ];
  }
}
