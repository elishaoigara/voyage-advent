"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { CartItem } from "@/lib/types";
type Store = {
  items: CartItem[];
  ready: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (id: string, quantity?: number) => void;
  change: (id: string, quantity: number) => void;
  clear: () => void;
  count: number;
  toast: string;
};
const Context = createContext<Store | null>(null);
export function Providers({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("voyage-bag-v1") || "[]");
      if (Array.isArray(saved))
        setItems(
          saved
            .filter(
              (x) =>
                x &&
                typeof x.id === "string" &&
                Number.isInteger(x.quantity) &&
                x.quantity > 0 &&
                x.quantity <= 24,
            )
            .slice(0, 50),
        );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem("voyage-bag-v1", JSON.stringify(items));
      } catch {}
  }, [items, ready]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const add = useCallback((id: string, quantity = 1) => {
    setItems((list) => {
      const item = list.find((x) => x.id === id);
      return item
        ? list.map((x) =>
            x.id === id
              ? { ...x, quantity: Math.min(24, x.quantity + quantity) }
              : x,
          )
        : [...list, { id, quantity: Math.min(24, quantity) }];
    });
    setToast("Added to your bag");
  }, []);
  const change = useCallback(
    (id: string, quantity: number) =>
      setItems((list) =>
        quantity <= 0
          ? list.filter((x) => x.id !== id)
          : list.map((x) =>
              x.id === id ? { ...x, quantity: Math.min(24, quantity) } : x,
            ),
      ),
    [],
  );
  return (
    <Context.Provider
      value={{
        items,
        ready,
        open,
        setOpen,
        add,
        change,
        clear: () => setItems([]),
        count: items.reduce((s, x) => s + x.quantity, 0),
        toast,
      }}
    >
      {children}
      <div className={`toast ${toast ? "visible" : ""}`} role="status">
        {toast}
      </div>
    </Context.Provider>
  );
}
export function useBag() {
  const value = useContext(Context);
  if (!value) throw new Error("Bag provider is missing");
  return value;
}
