import { Minus, Plus } from "lucide-react";
import type { ProductResponse } from "@ridgeline/contracts/products";
import { Badge } from "@ridgeline/ui/badge";
import { Button } from "@ridgeline/ui/button";
import { cn } from "@ridgeline/ui/lib/utils";
import { formatCents } from "../../lib/format";

const CATEGORY_LABEL: Record<string, string> = { beverage: "Drinks", food: "Food" };

export function BasketPicker({
  products,
  basket,
  onChange,
}: {
  products: ProductResponse[];
  basket: Record<string, number>;
  onChange: (basket: Record<string, number>) => void;
}) {
  const categories = [...new Set(products.map((product) => product.category))];
  const setQuantity = (productId: string, quantity: number) => {
    const next = { ...basket };
    if (quantity <= 0) delete next[productId];
    else next[productId] = quantity;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category} className="space-y-1.5">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {CATEGORY_LABEL[category] ?? category}
          </h3>
          <div className="grid gap-1">
            {products
              .filter((product) => product.category === category)
              .map((product) => {
                const quantity = basket[product.productId] ?? 0;
                return (
                  <div
                    key={product.productId}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2 py-1 text-sm",
                      quantity > 0 && "border-primary/40 bg-primary/5",
                    )}
                  >
                    <span className="flex-1 truncate">
                      {product.name}
                      {product.source === "assumed" ? (
                        <Badge variant="outline" className="ms-1.5">
                          assumed
                        </Badge>
                      ) : null}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatCents(product.priceCents)}</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Remove ${product.name}`}
                      disabled={quantity === 0}
                      onClick={() => setQuantity(product.productId, quantity - 1)}
                    >
                      <Minus />
                    </Button>
                    <span className="w-4 text-center tabular-nums">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Add ${product.name}`}
                      onClick={() => setQuantity(product.productId, quantity + 1)}
                    >
                      <Plus />
                    </Button>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
