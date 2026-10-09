import Link from "next/link";
import { Suspense } from "react";
import { getProducts } from "@/lib/catalogue";
import { ShopGrid } from "@/components/shop-grid";
export const metadata = { title: "The collection" };
export const dynamic = "force-dynamic";
export default async function Shop() {
  const products = await getProducts();
  return (
    <>
      <div className="page-intro">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>The collection</span>
        </div>
        <p className="eyebrow">BOTTLES WITH A LITTLE MORE CHARACTER</p>
        <h1>Find your next favourite.</h1>
        <p>
          Everyday classics, considered discoveries and something for the table.
          Follow your taste.
        </p>
      </div>
      <Suspense
        fallback={<div className="loading">Opening the collection…</div>}
      >
        <ShopGrid products={products} />
      </Suspense>
    </>
  );
}
