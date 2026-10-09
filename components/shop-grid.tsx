"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "./product-card";
import type { Product } from "@/lib/types";
export function ShopGrid({ products }: { products: Product[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const category = params.get("category") || "All";
  const collection = params.get("collection");
  const occasion = params.get("occasion");
  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category))).sort(),
  ];
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (!value || value === "All") next.delete(key);
    else next.set(key, value);
    router.replace(`/shop?${next}`, { scroll: false });
  }
  const filtered = products.filter(
    (p) =>
      (category === "All" || category.split(",").includes(p.category)) &&
      (!collection || p.collection === collection) &&
      (!occasion || p.occasions.includes(occasion)) &&
      `${p.name} ${p.category} ${p.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  filtered.sort((a, b) =>
    sort === "low"
      ? a.price - b.price
      : sort === "high"
        ? b.price - a.price
        : sort === "name"
          ? a.name.localeCompare(b.name)
          : Number(b.featured) - Number(a.featured),
  );
  return (
    <section className="section shop-section">
      <div className="shop-controls">
        <label className="searchbox">
          <Search size={19} />
          <input
            autoFocus={params.get("focus") === "search"}
            aria-label="Search bottles"
            placeholder="Search by bottle, spirit or flavour…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="icon-button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <X size={15} />
            </button>
          )}
        </label>
        <div className="shop-sort">
          <span>{filtered.length} discoveries</span>
          <label>
            <SlidersHorizontal size={12} aria-hidden="true" />{" "}
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Our selection</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
              <option value="name">Name: A–Z</option>
            </select>
          </label>
        </div>
      </div>
      <div className="filter-row" aria-label="Product categories">
        {categories.map((c) => (
          <button
            key={c}
            className={`filter-chip ${category === c ? "active" : ""}`}
            aria-pressed={category === c}
            onClick={() => filter("category", c)}
          >
            {c === "All" ? "All bottles" : c}
          </button>
        ))}
      </div>
      {(collection || occasion || category.includes(",")) && (
        <div className="active-filters">
          <span>Exploring:</span>
          {collection && (
            <button onClick={() => filter("collection", "")}>
              {collection === "discovery"
                ? "Voyage selects"
                : "Everyday favourites"}{" "}
              <X size={12} />
            </button>
          )}
          {occasion && (
            <button onClick={() => filter("occasion", "")}>
              {occasion} <X size={12} />
            </button>
          )}
          {category.includes(",") && (
            <button onClick={() => filter("category", "")}>
              {category.replace(",", " & ")} <X size={12} />
            </button>
          )}
        </div>
      )}
      {filtered.length ? (
        <div className="product-grid">
          {filtered.map((p) => (
            <ProductCard product={p} key={p.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={32} />
          <h3>A new direction, perhaps?</h3>
          <p>
            No bottles match these filters. Try another search or explore the
            full collection.
          </p>
          <button
            className="button outline-dark"
            onClick={() => {
              setQuery("");
              router.replace("/shop", { scroll: false });
            }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </section>
  );
}
