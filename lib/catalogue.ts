import "server-only";
import seed from "./catalogue.json";
import type { Product } from "./types";
import { hasSupabase } from "./supabase/config";
import { publicClient } from "./supabase/server";
import { cache } from "react";
export const getProducts = cache(async (): Promise<Product[]> => {
  if (!hasSupabase()) return seed as Product[];
  const { data, error } = await publicClient()
    .from("voyage_products")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error)
    throw new Error(
      "The collection could not be loaded. Please try again shortly.",
    );
  return (data || []) as Product[];
});
