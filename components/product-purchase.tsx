"use client";
import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useBag } from "./providers";
import type { Product } from "@/lib/types";
export function ProductPurchase({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const { add, setOpen } = useBag();
  return (
    <div className="detail-purchase">
      <div className="quantity">
        <button
          aria-label="Decrease quantity"
          disabled={quantity <= 1}
          onClick={() => setQuantity(quantity - 1)}
        >
          <Minus size={14} />
        </button>
        <span aria-live="polite">{quantity}</span>
        <button
          aria-label="Increase quantity"
          disabled={quantity >= Math.min(24, product.stock ?? 24)}
          onClick={() => setQuantity(quantity + 1)}
        >
          <Plus size={14} />
        </button>
      </div>
      <button
        className="button gold wide"
        disabled={product.stock === 0}
        onClick={() => {
          add(product.id, quantity);
          setOpen(true);
        }}
      >
        <ShoppingBag size={18} />
        {product.stock === 0 ? "Currently unavailable" : "Add to your bag"}
      </button>
    </div>
  );
}
