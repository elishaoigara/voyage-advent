"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Product } from "@/lib/types";
import { Header } from "./header";
import { Footer } from "./footer";
import { Cart } from "./cart";
import { AgeGate } from "./age-gate";
export function Shell({
  children,
  products,
}: {
  children: ReactNode;
  products: Product[];
}) {
  const path = usePathname();
  const admin = path.startsWith("/admin");
  return (
    <>
      {!admin && <Header />}
      <main id="main">{children}</main>
      {!admin && (
        <>
          <Footer />
          <Cart products={products} />
        </>
      )}
      <AgeGate />
    </>
  );
}
