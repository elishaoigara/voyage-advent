import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalogue";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!base) return [];
  const products = await getProducts();
  return [
    "/",
    "/shop",
    "/delivery",
    "/help",
    "/privacy",
    ...products.map((p) => `/shop/${p.id}`),
  ].map((path) => ({ url: base + path }));
}
