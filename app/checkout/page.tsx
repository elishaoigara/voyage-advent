import { Checkout } from "@/components/checkout";
import { getProducts } from "@/lib/catalogue";
export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Page() {
  return <Checkout products={await getProducts()} />;
}
