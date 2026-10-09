import test from "node:test";
import assert from "node:assert/strict";
import {
  checkoutSchema,
  normalisePhone,
  priceCart,
  productSchema,
} from "../lib/validation";
import seed from "../lib/catalogue.json";
import type { Product } from "../lib/types";
const products = seed as Product[];
test("normalises Kenyan customer numbers and rejects foreign or malformed values", () => {
  for (const p of ["0712 345 678", "+254712345678", "712345678"])
    assert.equal(normalisePhone(p), "254712345678");
  assert.equal(normalisePhone("0112345678"), "254112345678");
  assert.throws(() => normalisePhone("+12025550123"));
  assert.throws(() => normalisePhone("254700"));
});
test("prices are sourced from the catalogue, with exact integer totals", () => {
  const p = products[0];
  const quote = priceCart([{ id: p.id, quantity: 3 }], products);
  assert.equal(quote.subtotal, p.price * 3);
  assert.equal(quote.items[0].price, p.price);
});
test("rejects unavailable, overstock, duplicate and invalid-quantity requests", () => {
  const p = { ...products[0], stock: 2 };
  assert.throws(() => priceCart([{ id: p.id, quantity: 3 }], [p]));
  assert.throws(() =>
    priceCart(
      [
        { id: p.id, quantity: 1 },
        { id: p.id, quantity: 1 },
      ],
      [p],
    ),
  );
  assert.throws(() => priceCart([{ id: p.id, quantity: -1 }], [p]));
  assert.throws(() => priceCart([{ id: "unknown", quantity: 1 }], [p]));
  assert.throws(() =>
    priceCart([{ id: p.id, quantity: 1 }], [{ ...p, active: false }]),
  );
});
test("checkout requires adult confirmation and a usable delivery address", () => {
  const base = {
    request_id: crypto.randomUUID(),
    name: "Test Customer",
    phone: "0712345678",
    email: "",
    fulfilment: "delivery",
    address: "Test Road, Nairobi",
    notes: "",
    age_confirmed: true,
    items: [{ id: products[0].id, quantity: 1 }],
  };
  assert(checkoutSchema.safeParse(base).success);
  assert(!checkoutSchema.safeParse({ ...base, age_confirmed: false }).success);
  assert(!checkoutSchema.safeParse({ ...base, address: "" }).success);
  assert(!checkoutSchema.safeParse({ ...base, items: [] }).success);
  assert(
    !checkoutSchema.safeParse({ ...base, items: [{ id: "x", quantity: 0.5 }] })
      .success,
  );
});
test("product management rejects unsafe images and invalid prices", () => {
  const p = products[0];
  assert(productSchema.safeParse(p).success);
  assert(
    !productSchema.safeParse({ ...p, image: "javascript:alert(1)" }).success,
  );
  assert(!productSchema.safeParse({ ...p, price: -5 }).success);
  assert(
    !productSchema.safeParse({ ...p, image: "data:image/svg+xml;base64,a" })
      .success,
  );
});
