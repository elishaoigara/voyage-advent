"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search, Plus, X, LogOut, ExternalLink } from "lucide-react";
import type { Product, Order } from "@/lib/types";
import { money } from "@/lib/config";
import { Dialog } from "./dialog";
const blank: Product = {
  id: "",
  name: "",
  category: "Whisky",
  size: "750ml",
  price: 0,
  description: "",
  image: null,
  featured: false,
  collection: "favourites",
  occasions: [],
  stock: null,
  active: true,
};
const transitions: Record<string, string[]> = {
  pending: ["pending", "confirmed", "cancelled"],
  confirmed: ["confirmed", "preparing", "cancelled"],
  preparing: ["preparing", "ready", "cancelled"],
  ready: ["ready", "completed", "cancelled"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};
export function AdminDashboard({
  products,
  orders,
  email,
  paymentsReady,
}: {
  products: Product[];
  orders: Order[];
  email: string;
  paymentsReady: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("orders");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [edit, setEdit] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const shown = orders.filter(
    (o) =>
      (filter === "all" || o.status === filter) &&
      `${o.reference} ${o.customer_name} ${o.phone}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  async function request(url: string, method: string, body: unknown) {
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Unable to save.");
    return d;
  }
  async function saveProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    setError("");
    try {
      await request("/api/admin/products", isNew ? "POST" : "PATCH", edit);
      setEdit(null);
      setNotice("Product saved.");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!order) return;
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await request("/api/admin/orders", "PATCH", {
        id: order.id,
        status: f.get("status"),
        delivery_fee: f.get("fee") === "" ? null : Number(f.get("fee")),
        payment_status: f.get("payment"),
        payment_reference: f.get("reference") || "",
        admin_note: f.get("note") || "",
      });
      setOrder(null);
      setNotice("Order updated.");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File | undefined) {
    if (!file || !edit) return;
    setBusy(true);
    setError("");
    try {
      const f = new FormData();
      f.set("file", file);
      const r = await fetch("/api/admin/upload", { method: "POST", body: f });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setEdit({ ...edit, image: d.url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-page">
      <header className="admin-header">
        <Link href="/" className="brand">
          <img src="/images/logo.png" width="45" height="45" alt="" />
          <span>
            VOYAGE<small>STORE MANAGEMENT</small>
          </span>
        </Link>
        <div>
          <span>{email}</span>
          <Link href="/" target="_blank">
            View store <ExternalLink size={13} />
          </Link>
          <button
            className="icon-button"
            aria-label="Sign out"
            onClick={async () => {
              try {
                await request("/api/auth/sign-out", "POST", {});
                router.refresh();
              } catch (e) {
                setNotice((e as Error).message);
              }
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <div className="admin-content">
        <p className="eyebrow">YOUR DAILY OVERVIEW</p>
        <h1>A good day for discovery.</h1>
        <div className="stats">
          <div className="stat">
            <span>AWAITING CONFIRMATION</span>
            <strong>
              {orders.filter((o) => o.status === "pending").length}
            </strong>
          </div>
          <div className="stat">
            <span>ACTIVE PRODUCTS</span>
            <strong>{products.filter((p) => p.active).length}</strong>
          </div>
          <div className="stat">
            <span>PAID ORDERS · LOADED HISTORY</span>
            <strong>
              {money(
                orders
                  .filter((o) => o.payment_status === "paid")
                  .reduce((s, o) => s + o.subtotal + (o.delivery_fee || 0), 0),
              )}
            </strong>
          </div>
        </div>
        <div className="note">
          {paymentsReady
            ? "M-Pesa checkout is enabled."
            : "M-Pesa prompts are not connected. Confirm stock and delivery before sharing payment instructions. Only mark an order paid after checking the merchant transaction."}
        </div>
        {notice && (
          <p className="note" role="status" style={{ marginTop: 15 }}>
            {notice}
          </p>
        )}
        <div className="admin-tabs">
          <button
            className={tab === "orders" ? "active" : ""}
            onClick={() => {
              setTab("orders");
              setQuery("");
            }}
          >
            Orders
          </button>
          <button
            className={tab === "products" ? "active" : ""}
            onClick={() => {
              setTab("products");
              setQuery("");
            }}
          >
            Products & stock
          </button>
        </div>
        <div className="admin-toolbar">
          <label className="searchbox">
            <Search size={17} />
            <input
              aria-label="Search management"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === "orders"
                  ? "Search name, phone or order reference"
                  : "Search product or category"
              }
            />
          </label>
          {tab === "orders" ? (
            <select
              aria-label="Filter order status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All order statuses</option>
              {Object.keys(transitions).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <button
              className="button dark"
              onClick={() => {
                setEdit({ ...blank });
                setIsNew(true);
                setError("");
              }}
            >
              <Plus size={16} />
              Add product
            </button>
          )}
        </div>
        {tab === "orders" ? (
          <>
            <p className="muted" style={{ fontSize: 10, marginBottom: 12 }}>
              Most recent {orders.length} requests, up to 500. Pending requests
              do not reserve stock.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ORDER</th>
                    <th>CUSTOMER</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th>PAYMENT</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((o) => (
                    <tr key={o.id}>
                      <td>
                        {o.reference}
                        <small>
                          {new Date(o.created_at).toLocaleString("en-KE", {
                            timeZone: "Africa/Nairobi",
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </small>
                      </td>
                      <td>
                        {o.customer_name}
                        <small>{o.phone}</small>
                      </td>
                      <td>
                        {money(o.subtotal + (o.delivery_fee || 0))}
                        <small>
                          {o.delivery_fee === null
                            ? "Delivery fee pending"
                            : o.fulfilment}
                        </small>
                      </td>
                      <td>
                        <span className={`status-pill ${o.status}`}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${o.payment_status}`}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="table-action"
                          onClick={() => {
                            setOrder(o);
                            setError("");
                          }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!shown.length && (
                <div className="empty-state">
                  <h3>No orders to show.</h3>
                  <p>Customer requests will appear here.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>PRICE</th>
                  <th>STOCK</th>
                  <th>VISIBILITY</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products
                  .filter((p) =>
                    `${p.name} ${p.category}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )
                  .map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.name}
                        <small>
                          {p.category} · {p.size}
                        </small>
                      </td>
                      <td>{money(p.price)}</td>
                      <td>{p.stock === null ? "Confirm manually" : p.stock}</td>
                      <td>
                        <span className="status-pill">
                          {p.active ? "Published" : "Hidden"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="table-action"
                          onClick={() => {
                            setEdit({ ...p });
                            setIsNew(false);
                            setError("");
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Dialog
        open={!!edit}
        close={() => !busy && setEdit(null)}
        label="Edit product"
        className="edit-dialog"
      >
        {edit && (
          <form onSubmit={saveProduct}>
            <div className="cart-heading">
              <h2>{isNew ? "Add a discovery." : "Edit this bottle."}</h2>
              <button
                type="button"
                className="icon-button"
                onClick={() => setEdit(null)}
                disabled={busy}
                aria-label="Close product editor"
              >
                <X />
              </button>
            </div>
            <div className="field-grid">
              <label className="field">
                Name
                <input
                  required
                  maxLength={100}
                  value={edit.name}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      name: e.target.value,
                      ...(isNew
                        ? {
                            id: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, ""),
                          }
                        : {}),
                    })
                  }
                />
              </label>
              <label className="field">
                Product slug
                <input
                  required
                  value={edit.id}
                  disabled={!isNew}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  onChange={(e) => setEdit({ ...edit, id: e.target.value })}
                />
              </label>
              <label className="field">
                Category
                <input
                  required
                  list="categories"
                  value={edit.category}
                  onChange={(e) =>
                    setEdit({ ...edit, category: e.target.value })
                  }
                />
                <datalist id="categories">
                  {Array.from(new Set(products.map((p) => p.category))).map(
                    (c) => (
                      <option key={c} value={c} />
                    ),
                  )}
                </datalist>
              </label>
              <label className="field">
                Size
                <input
                  required
                  value={edit.size}
                  onChange={(e) => setEdit({ ...edit, size: e.target.value })}
                />
              </label>
              <label className="field">
                Price (KES)
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  step="1"
                  required
                  value={edit.price || ""}
                  onChange={(e) =>
                    setEdit({ ...edit, price: Number(e.target.value) })
                  }
                />
              </label>
              <label className="field">
                Stock (blank = confirm manually)
                <input
                  type="number"
                  min="0"
                  max="100000"
                  step="1"
                  value={edit.stock ?? ""}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      stock:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
            <label className="field">
              Description
              <textarea
                required
                minLength={5}
                maxLength={1000}
                value={edit.description}
                onChange={(e) =>
                  setEdit({ ...edit, description: e.target.value })
                }
              />
            </label>
            <label className="field">
              Image URL
              <input
                value={edit.image || ""}
                onChange={(e) =>
                  setEdit({ ...edit, image: e.target.value || null })
                }
              />
            </label>
            <label className="upload-control">
              Or upload a product image (JPG, PNG, WebP; maximum 5 MB)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
            <label className="field">
              Collection
              <select
                value={edit.collection}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    collection: e.target.value as Product["collection"],
                  })
                }
              >
                <option value="favourites">Everyday favourites</option>
                <option value="discovery">Voyage selects</option>
              </select>
            </label>
            <label className="field">
              Occasions (comma separated)
              <input
                value={edit.occasions.join(", ")}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    occasions: e.target.value.split(",").map((x) => x.trim()),
                  })
                }
              />
              <small>Weekend, Celebration, Gifting, Slow Evening</small>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={edit.featured}
                onChange={(e) =>
                  setEdit({ ...edit, featured: e.target.checked })
                }
              />
              Feature on homepage
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={edit.active}
                onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
              />
              Published in the shop
            </label>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <button className="button dark wide" disabled={busy}>
              {busy ? "Saving…" : "Save product"}
            </button>
          </form>
        )}
      </Dialog>
      <Dialog
        open={!!order}
        close={() => !busy && setOrder(null)}
        label="Manage order"
        className="edit-dialog"
      >
        {order && (
          <form onSubmit={saveOrder}>
            <div className="cart-heading">
              <div>
                <p className="eyebrow">ORDER REQUEST</p>
                <h2>{order.reference}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setOrder(null)}
                disabled={busy}
                aria-label="Close order"
              >
                <X />
              </button>
            </div>
            <div className="order-detail-grid">
              <div>
                <small>CUSTOMER</small>
                {order.customer_name}
                <br />
                <a href={`tel:+${order.phone}`}>+{order.phone}</a>
                <br />
                {order.email}
              </div>
              <div>
                <small>{order.fulfilment.toUpperCase()}</small>
                {order.address || "Collection details to be confirmed"}
                <br />
                {order.notes}
              </div>
            </div>
            {order.items.map((p) => (
              <div className="summary-row" key={p.id}>
                <span>
                  {p.name} ({p.size}) × {p.quantity}
                </span>
                <strong>{money(p.price * p.quantity)}</strong>
              </div>
            ))}
            <div className="summary-row summary-total">
              <span>Items subtotal</span>
              <strong>{money(order.subtotal)}</strong>
            </div>
            <div className="field-grid">
              <label className="field">
                Order status
                <select name="status" defaultValue={order.status}>
                  {transitions[order.status].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Delivery fee (KES)
                <input
                  name="fee"
                  type="number"
                  min="0"
                  max="100000"
                  step="1"
                  defaultValue={
                    order.fulfilment === "collection"
                      ? 0
                      : (order.delivery_fee ?? "")
                  }
                  readOnly={order.fulfilment === "collection"}
                />
              </label>
              <label className="field">
                Payment status
                <select name="payment" defaultValue={order.payment_status}>
                  {(order.payment_status === "paid"
                    ? ["paid"]
                    : ["unpaid", "pending", "paid", "failed"]
                  ).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Verified payment reference
                <input
                  name="reference"
                  maxLength={100}
                  defaultValue={order.payment_reference || ""}
                />
              </label>
            </div>
            <label className="field">
              Internal note
              <textarea
                name="note"
                maxLength={1000}
                defaultValue={order.admin_note || ""}
              />
            </label>
            <p className="note">
              Confirming reserves recorded stock. Cancelling releases it. A
              payment reference is required to mark an order paid. Record
              refunds separately; cancellation does not move money.
            </p>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <div className="dialog-actions">
              <a
                className="button outline-dark"
                href={`https://wa.me/${order.phone}`}
                target="_blank"
                rel="noreferrer"
              >
                Contact customer
              </a>
              <button className="button dark" disabled={busy}>
                {busy ? "Saving…" : "Save order"}
              </button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
