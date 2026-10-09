"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  MessageCircle,
  Smartphone,
  ShoppingBag,
  LoaderCircle,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { useBag } from "./providers";
import { ProductImage } from "./product-card";
import { money, whatsappUrl } from "@/lib/config";
import { normalisePhone } from "@/lib/validation";
type Result = {
  saved: boolean;
  reference?: string;
  whatsapp: string;
  subtotal: number;
};
export function Checkout({ products }: { products: Product[] }) {
  const { items, ready, clear } = useBag();
  const [fulfilment, setFulfilment] = useState("delivery");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [requestId, setRequestId] = useState("");
  const subtotal = items.reduce(
    (s, x) =>
      s + (products.find((p) => p.id === x.id)?.price || 0) * x.quantity,
    0,
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    let phone;
    try {
      phone = normalisePhone(String(f.get("phone")));
    } catch (err) {
      setError((err as Error).message);
      return;
    }
    const id = requestId || crypto.randomUUID();
    setRequestId(id);
    setBusy(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: id,
          items,
          name: f.get("name"),
          phone,
          email: f.get("email") || "",
          fulfilment,
          address: f.get("address") || "",
          notes: f.get("notes") || "",
          age_confirmed: f.get("age") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please try again.");
      setResult(data);
      if (data.saved) clear();
    } catch (err) {
      setError(
        (err as Error).message ||
          "We could not prepare your request. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (result)
    return (
      <div className="success-panel">
        <CheckCircle2 size={46} strokeWidth={1} />
        <p className="eyebrow">YOUR NEXT VOYAGE</p>
        <h1>
          {result.saved
            ? "Your request is with us."
            : "Your selection is ready."}
        </h1>
        <p>
          {result.saved
            ? "Your order request has been saved. Our team will confirm stock, delivery and payment details. You can also send the details on WhatsApp below."
            : "Send your selection to our team on WhatsApp to confirm availability, delivery and the final amount."}
        </p>
        {result.reference && (
          <div className="success-reference">{result.reference}</div>
        )}
        <p>
          <strong>Items: {money(result.subtotal)}</strong>
          <br />
          Delivery is confirmed separately. No payment has been taken.
        </p>
        <a
          className="button gold"
          href={result.whatsapp}
          target="_blank"
          rel="noreferrer"
        >
          {result.saved ? "Follow up on WhatsApp" : "Send request on WhatsApp"}{" "}
          <ArrowUpRight size={18} />
        </a>
        <Link className="text-button" href="/shop">
          Back to the collection
        </Link>
      </div>
    );
  if (!ready) return <div className="loading">Preparing your bag…</div>;
  if (!items.length)
    return (
      <div className="empty-state">
        <ShoppingBag size={42} />
        <h1 style={{ fontSize: 45, marginTop: 20 }}>Your bag is waiting.</h1>
        <p>Explore the collection and add a bottle to get started.</p>
        <Link className="button dark" href="/shop">
          Discover the collection <ArrowUpRight size={17} />
        </Link>
      </div>
    );
  return (
    <section className="section checkout-section">
      <div className="checkout-title">
        <div className="breadcrumb">
          <Link href="/shop">The collection</Link>
          <span>/</span>
          <span>Checkout</span>
        </div>
        <p className="eyebrow">A GOOD CHOICE, A FEW DETAILS</p>
        <h1>Let’s make it yours.</h1>
        <div className="step-label">
          <span>01 Your bag</span>
          <span>—</span>
          <strong>02 Your details</strong>
          <span>—</span>
          <span>03 Confirmation</span>
        </div>
      </div>
      <div className="checkout-layout">
        <form onSubmit={submit}>
          <section className="form-section">
            <h2>Your details</h2>
            <label className="field">
              Full name
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                placeholder="Your name"
              />
            </label>
            <div className="field-grid phone-email">
              <label className="field">
                Mobile number
                <input
                  type="tel"
                  name="phone"
                  required
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="0712 345 678"
                />
              </label>
              <label className="field">
                Email (optional)
                <input
                  type="email"
                  name="email"
                  maxLength={200}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>
            </div>
          </section>
          <section className="form-section">
            <h2>How would you like it?</h2>
            <div className="radio-options">
              <label
                className={`radio-card ${fulfilment === "delivery" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="fulfilment"
                  value="delivery"
                  checked={fulfilment === "delivery"}
                  onChange={() => setFulfilment("delivery")}
                />
                Delivery
              </label>
              <label
                className={`radio-card ${fulfilment === "collection" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="fulfilment"
                  value="collection"
                  checked={fulfilment === "collection"}
                  onChange={() => setFulfilment("collection")}
                />
                Collect from store
              </label>
            </div>
            {fulfilment === "delivery" ? (
              <label className="field">
                Delivery area & address
                <textarea
                  name="address"
                  required
                  minLength={8}
                  maxLength={500}
                  autoComplete="street-address"
                  placeholder="Area, building, street and a useful landmark"
                />
                <small>
                  We’ll confirm delivery coverage, timing and the fee before
                  payment.
                </small>
              </label>
            ) : (
              <p className="note">
                Our team will confirm stock, the collection location and a
                suitable time before you travel.
              </p>
            )}
            <label className="field" style={{ marginTop: 18 }}>
              Anything else? (optional)
              <textarea
                name="notes"
                maxLength={600}
                placeholder="A gift, a preferred time or a question for us…"
              />
            </label>
          </section>
          <section className="form-section">
            <h2>Payment</h2>
            <div className="payment-option">
              <div>
                <MessageCircle size={19} />
                <strong> Confirm with our team</strong>
                <small>
                  We confirm your order and send payment instructions.
                </small>
              </div>
              <span className="payment-tag">AVAILABLE</span>
            </div>
            <div className="payment-option disabled">
              <div>
                <Smartphone size={18} />
                <strong> M-Pesa phone prompt</strong>
                <small>Automatic checkout is coming soon.</small>
              </div>
              <span className="payment-tag">COMING SOON</span>
            </div>
            <p className="note">
              No payment is taken now. Your request is subject to stock and
              delivery confirmation.
            </p>
            <label className="checkbox">
              <input type="checkbox" name="age" required />
              <span>
                I confirm that I am 18 or older, and have read the{" "}
                <Link href="/help" target="_blank">
                  ordering information
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank">
                  privacy notice
                </Link>
                .
              </span>
            </label>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <button className="button gold wide" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle size={17} /> Preparing your request…
                </>
              ) : (
                <>
                  Request order confirmation <ArrowUpRight size={18} />
                </>
              )}
            </button>
          </section>
        </form>
        <aside className="order-summary">
          <p className="eyebrow">YOUR SELECTION</p>
          <h2>Good taste, in the bag.</h2>
          {items.map((item) => {
            const p = products.find((p) => p.id === item.id);
            return (
              <div className="cart-line" key={item.id}>
                {p ? (
                  <>
                    <div className="cart-photo">
                      <ProductImage product={p} />
                    </div>
                    <div className="cart-line-info">
                      <Link href={`/shop/${p.id}`}>{p.name}</Link>
                      <small>
                        {p.size} · Quantity {item.quantity}
                      </small>
                    </div>
                    <div className="cart-line-end">
                      {money(p.price * item.quantity)}
                    </div>
                  </>
                ) : (
                  <p>Item unavailable. Please update your bag.</p>
                )}
              </div>
            );
          })}
          <div className="summary-row">
            <span>Items subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>{fulfilment === "delivery" ? "Delivery" : "Collection"}</span>
            <span>
              {fulfilment === "delivery"
                ? "To be confirmed"
                : "No delivery fee"}
            </span>
          </div>
          <div className="summary-row summary-total">
            <span>Items total</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <p className="summary-help">
            Your final payable amount is confirmed by our team. Stock is
            reserved when your request is accepted.
          </p>
          <a
            className="text-link"
            style={{ marginTop: 18, fontSize: 10 }}
            href={whatsappUrl()}
            target="_blank"
            rel="noreferrer"
          >
            Need a hand? Talk to us <ArrowUpRight size={15} />
          </a>
        </aside>
      </div>
    </section>
  );
}
