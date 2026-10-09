import { z } from "zod";
import type { Product, OrderItem } from "./types";
export function normalisePhone(value: string): string {
  let phone = value.replace(/[\s()+-]/g, "");
  if (/^0[17]\d{8}$/.test(phone)) phone = "254" + phone.slice(1);
  if (/^[17]\d{8}$/.test(phone)) phone = "254" + phone;
  if (!/^254[17]\d{8}$/.test(phone))
    throw new Error(
      "Enter a valid Kenyan mobile number, for example 0712 345 678.",
    );
  return phone;
}
export const checkoutSchema = z
  .object({
    request_id: z.uuid(),
    name: z.string().trim().min(2).max(100),
    phone: z.string().max(30),
    email: z.union([z.email().max(200), z.literal("")]),
    fulfilment: z.enum(["delivery", "collection"]),
    address: z.string().trim().max(500),
    notes: z.string().trim().max(600),
    age_confirmed: z.literal(true),
    items: z
      .array(
        z.object({
          id: z.string().min(1).max(120),
          quantity: z.number().int().min(1).max(24),
        }),
      )
      .min(1)
      .max(50),
  })
  .refine((v) => v.fulfilment !== "delivery" || v.address.length >= 8, {
    message: "Please enter your delivery area and address.",
    path: ["address"],
  });
export function priceCart(
  items: { id: string; quantity: number }[],
  products: Product[],
): { items: OrderItem[]; subtotal: number } {
  const ids = new Set<string>();
  const lines = items.map((item) => {
    if (ids.has(item.id))
      throw new Error("Please refresh your bag and try again.");
    ids.add(item.id);
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 24
    )
      throw new Error("Choose between 1 and 24 of each product.");
    const p = products.find((p) => p.id === item.id && p.active);
    if (!p || p.stock === 0)
      throw new Error(
        "An item is no longer available. Please update your bag.",
      );
    if (p.stock !== null && item.quantity > p.stock)
      throw new Error(`Only ${p.stock} of ${p.name} are currently available.`);
    return {
      id: p.id,
      name: p.name,
      size: p.size,
      price: p.price,
      quantity: item.quantity,
    };
  });
  return {
    items: lines,
    subtotal: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
  };
}
export const productSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  name: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(40),
  size: z.string().trim().min(1).max(30),
  price: z.number().int().positive().max(1000000),
  description: z.string().trim().min(5).max(1000),
  image: z
    .string()
    .max(1000)
    .nullable()
    .refine(
      (v) =>
        !v ||
        /^\/images\/[a-zA-Z0-9._-]+$/.test(v) ||
        /^https:\/\/[^\s]+$/.test(v),
      "Use a local image path or HTTPS image URL.",
    ),
  featured: z.boolean(),
  collection: z.enum(["discovery", "favourites"]),
  occasions: z.array(z.string().max(40)).max(8),
  stock: z.number().int().min(0).max(100000).nullable(),
  active: z.boolean(),
});
