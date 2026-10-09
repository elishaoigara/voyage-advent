import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageCheck, MessageCircle, CircleCheck } from "lucide-react";
import { getProducts } from "@/lib/catalogue";
import { ProductCard, ProductImage } from "@/components/product-card";
import { ProductPurchase } from "@/components/product-purchase";
import { money, whatsappUrl } from "@/lib/config";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = (await getProducts()).find((p) => p.id === slug);
  return {
    title: p ? `${p.name} ${p.size}` : "Bottle not found",
    description: p?.description,
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = await getProducts();
  const p = products.find((p) => p.id === slug);
  if (!p) notFound();
  const related = [
    ...products.filter((x) => x.id !== slug && x.category === p.category),
    ...products.filter((x) => x.id !== slug && x.category !== p.category),
  ].slice(0, 4);
  return (
    <section className="section detail-section">
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/shop">The collection</Link>
        <span>/</span>
        <span>{p.name}</span>
      </div>
      <div className="product-detail">
        <div className="detail-image">
          {p.collection === "discovery" && (
            <span className="product-badge">VOYAGE SELECT</span>
          )}
          <ProductImage product={p} />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">
            {p.collection === "discovery"
              ? "THE VOYAGE COLLECTION"
              : "A FAMILIAR FAVOURITE"}
          </p>
          <h1>{p.name}</h1>
          <p className="detail-meta">
            {p.category} <span>·</span> {p.size}
          </p>
          <p className="detail-price">{money(p.price)}</p>
          <p className="description">{p.description}</p>
          <ProductPurchase product={p} />
          <p className="detail-note">
            <PackageCheck size={16} /> Delivery or collection arranged with our
            team.
          </p>
          <p className="detail-note">
            <CircleCheck size={16} /> Stock and delivery charges confirmed
            before payment.
          </p>
          <a
            className="detail-note"
            href={whatsappUrl(
              `Hello Voyage Advent, I'd like to know more about ${p.name} (${p.size}).`,
            )}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={16} /> Have a question about this bottle? Ask
            us.
          </a>
        </div>
      </div>
      <div className="related">
        <div className="section-heading">
          <div>
            <p className="eyebrow">KEEP EXPLORING</p>
            <h2>Another direction to discover.</h2>
          </div>
        </div>
        <div className="product-grid">
          {related.map((x) => (
            <ProductCard key={x.id} product={x} />
          ))}
        </div>
      </div>
    </section>
  );
}
