"use client";
import Link from "next/link";
import { Plus, Wine, Check } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/config";
import { useBag } from "./providers";
export function ProductImage({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return product.image && !failed ? (
    <img
      className={className}
      src={product.image}
      alt={`${product.name}, ${product.size}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="image-placeholder">
      <Wine size={52} strokeWidth={1} />
      <small>Photo coming soon</small>
    </div>
  );
}
export function ProductCard({ product }: { product: Product }) {
  const { add } = useBag();
  const [added, setAdded] = useState(false);
  return (
    <article className="product-card">
      <Link href={`/shop/${product.id}`} className="product-photo">
        {product.stock === 0 ? (
          <span className="product-badge">Currently unavailable</span>
        ) : product.collection === "discovery" ? (
          <span className="product-badge">VOYAGE SELECT</span>
        ) : null}
        <ProductImage product={product} />
        <span className="photo-caption">Discover the bottle ↗</span>
      </Link>
      <div className="product-info">
        <div className="product-meta">
          {product.category}
          <span>{product.size}</span>
        </div>
        <Link href={`/shop/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>
        <div className="product-bottom">
          <span className="price">{money(product.price)}</span>
          <button
            className="add-button"
            disabled={product.stock === 0}
            aria-label={`Add ${product.name} to bag`}
            onClick={() => {
              add(product.id);
              setAdded(true);
              setTimeout(() => setAdded(false), 1500);
            }}
          >
            {added ? <Check size={17} /> : <Plus size={17} />}
            <span>{added ? "Added" : "Add to bag"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
