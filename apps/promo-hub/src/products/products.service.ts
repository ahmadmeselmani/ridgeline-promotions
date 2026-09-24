import { Injectable } from "@nestjs/common";
import type { ProductResponse } from "@ridgeline/contracts/products";
import { ProductsClient, type ProductRecord } from "./products.client";

@Injectable()
export class ProductsService {
  constructor(private readonly productsClient: ProductsClient) {}

  findAll(venueId: string): ProductResponse[] {
    return this.productsClient
      .findMany(venueId)
      .map((record) => this.toResponse(record));
  }

  private toResponse({ product, assumed }: ProductRecord): ProductResponse {
    return {
      productId: product.product_id,
      name: product.name,
      category: product.category,
      priceCents: product.price_cents,
      taxCode: product.tax_code,
      source: assumed ? "assumed" : "trestle",
    };
  }
}
