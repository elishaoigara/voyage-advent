"use client";
import Link from "next/link";
import { X, Minus, Plus, ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useBag } from "./providers";
import { Dialog } from "./dialog";
import { ProductImage } from "./product-card";
import type { Product } from "@/lib/types";
import { money } from "@/lib/config";
export function Cart({ products }: { products: Product[] }) {
  const { items, open, setOpen, change } = useBag();
  const subtotal = items.reduce(
    (s, x) =>
      s + (products.find((p) => p.id === x.id)?.price || 0) * x.quantity,
    0,
  );
  return (
    <Dialog
      open={open}
      close={() => setOpen(false)}
      label="Your shopping bag"
      className="cart-dialog"
    >
      <div className="cart-heading">
        <div>
          <p className="eyebrow">GOOD TASTE, BAGGED</p>
          <h2>
            Your selection{" "}
            <span>({items.reduce((s, x) => s + x.quantity, 0)})</span>
          </h2>
        </div>
        <button
          className="icon-button"
          onClick={() => setOpen(false)}
          aria-label="Close shopping bag"
        >
          <X />
        </button>
      </div>
      {items.length ? (
        <>
          <div className="cart-lines">
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
                        <Link
                          onClick={() => setOpen(false)}
                          href={`/shop/${p.id}`}
                        >
                          {p.name}
                        </Link>
                        <small>
                          {p.size} · {money(p.price)}
                        </small>
                        <div className="quantity">
                          <button
                            aria-label={`Decrease ${p.name}`}
                            onClick={() => change(p.id, item.quantity - 1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            aria-label={`Increase ${p.name}`}
                            disabled={
                              item.quantity >= Math.min(24, p.stock ?? 24)
                            }
                            onClick={() => change(p.id, item.quantity + 1)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="cart-line-end">
                        <strong>{money(p.price * item.quantity)}</strong>
                        <button
                          className="icon-button"
                          aria-label={`Remove ${p.name}`}
                          onClick={() => change(p.id, 0)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>This item is no longer available.</p>
                      <button onClick={() => change(item.id, 0)}>Remove</button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="cart-summary">
            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <p>Delivery and availability confirmed before payment.</p>
            <Link
              className="button gold wide"
              href="/checkout"
              onClick={() => setOpen(false)}
            >
              Continue to checkout <ArrowRight size={18} />
            </Link>
            <button className="text-button" onClick={() => setOpen(false)}>
              Keep exploring
            </button>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <ShoppingBag size={42} strokeWidth={1} />
          <h3>A little room for discovery.</h3>
          <p>Your next favourite is waiting in the collection.</p>
          <Link
            className="button dark"
            href="/shop"
            onClick={() => setOpen(false)}
          >
            Explore the collection <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </Dialog>
  );
}
