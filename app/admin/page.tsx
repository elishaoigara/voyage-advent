import { hasSupabase } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/supabase/server";
import { AdminLogin } from "@/components/admin-login";
import { AdminDashboard } from "@/components/admin-dashboard";
import type { Product, Order } from "@/lib/types";
export const metadata = {
  title: "Store management",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!hasSupabase()) return <AdminLogin configured={false} />;
  let auth;
  try {
    auth = await requireAdmin();
  } catch {
    return <AdminLogin configured />;
  }
  const [products, orders] = await Promise.all([
    auth.client.from("voyage_products").select("*").order("name"),
    auth.client
      .from("voyage_orders")
      .select(
        "id,reference,created_at,customer_name,phone,email,fulfilment,address,notes,items,subtotal,delivery_fee,status,payment_status,payment_reference,admin_note",
      )
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  if (products.error || orders.error)
    throw new Error("Could not load store data.");
  return (
    <AdminDashboard
      products={products.data as Product[]}
      orders={orders.data as Order[]}
      email={auth.user.email || "Staff"}
      paymentsReady={false}
    />
  );
}
