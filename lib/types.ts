export type Product = {
  id: string;
  name: string;
  category: string;
  size: string;
  price: number;
  description: string;
  image: string | null;
  featured: boolean;
  collection: "discovery" | "favourites";
  occasions: string[];
  stock: number | null;
  active: boolean;
};
export type CartItem = { id: string; quantity: number };
export type OrderItem = {
  id: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
};
export type Order = {
  id: string;
  reference: string;
  created_at: string;
  customer_name: string;
  phone: string;
  email: string;
  fulfilment: "delivery" | "collection";
  address: string;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number | null;
  status:
    "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
  payment_status: "unpaid" | "pending" | "paid" | "failed";
  payment_reference: string | null;
  admin_note: string | null;
};
