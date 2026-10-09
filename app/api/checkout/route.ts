import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { checkoutSchema, normalisePhone, priceCart } from "@/lib/validation";
import { getProducts } from "@/lib/catalogue";
import { assertOrigin, readJson, apiError } from "@/lib/http";
import { hasSupabase } from "@/lib/supabase/config";
import { serviceClient } from "@/lib/supabase/server";
import { money, whatsappUrl } from "@/lib/config";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const parsed = checkoutSchema.safeParse(await readJson(request));
    if (!parsed.success)
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Please check your details.",
        },
        { status: 400 },
      );
    const input = parsed.data;
    let phone: string;
    try {
      phone = normalisePhone(input.phone);
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message },
        { status: 400 },
      );
    }
    const products = await getProducts();
    let quote: ReturnType<typeof priceCart> | undefined;
    let quoteError = "Please update your bag and try again.";
    try {
      quote = priceCart(input.items, products);
    } catch (e) {
      quoteError = (e as Error).message;
    }
    let reference: string | undefined;
    let saved = false;
    if (hasSupabase()) {
      if (!process.env.SUPABASE_SECRET_KEY)
        return NextResponse.json(
          {
            error:
              "Online order requests are temporarily unavailable. Please contact us on WhatsApp.",
          },
          { status: 503 },
        );
      const db = serviceClient();
      const hash = createHash("sha256")
        .update(JSON.stringify({ ...input, phone }))
        .digest("hex");
      const { data: existing, error: lookupError } = await db
        .from("voyage_orders")
        .select("reference,request_hash,items,subtotal")
        .eq("request_id", input.request_id)
        .maybeSingle();
      if (lookupError) throw new Error("Storage unavailable");
      if (existing) {
        if (existing.request_hash !== hash)
          return NextResponse.json(
            {
              error:
                "This request has already been used. Refresh checkout to start a new request.",
            },
            { status: 409 },
          );
        reference = existing.reference;
        quote = { items: existing.items, subtotal: existing.subtotal };
        saved = true;
      } else {
        if (!quote)
          return NextResponse.json({ error: quoteError }, { status: 409 });
        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown";
        for (const [key, limit] of [
          [`phone:${phone}`, 5],
          [`ip:${ip}`, 25],
        ] as const) {
          const { data: allowed, error } = await db.rpc("voyage_check_rate", {
            p_key: createHash("sha256").update(key).digest("hex"),
            p_limit: limit,
          });
          if (error) throw new Error("Rate check unavailable");
          if (!allowed)
            return NextResponse.json(
              {
                error:
                  "Too many requests. Please wait a few minutes or contact us on WhatsApp.",
              },
              { status: 429 },
            );
        }
        reference = `VA-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
        const { error } = await db.from("voyage_orders").insert({
          request_id: input.request_id,
          request_hash: hash,
          reference,
          customer_name: input.name,
          phone,
          email: input.email,
          fulfilment: input.fulfilment,
          address: input.fulfilment === "delivery" ? input.address : "",
          notes: input.notes,
          age_confirmed: true,
          items: quote.items,
          subtotal: quote.subtotal,
          delivery_fee: input.fulfilment === "collection" ? 0 : null,
        });
        if (error) {
          if (error.code === "23505") {
            const { data: again } = await db
              .from("voyage_orders")
              .select("reference,request_hash,items,subtotal")
              .eq("request_id", input.request_id)
              .single();
            if (again?.request_hash === hash) {
              reference = again.reference;
              quote = { items: again.items, subtotal: again.subtotal };
            } else throw new Error("Duplicate request");
          } else throw new Error("Storage unavailable");
        }
        saved = true;
      }
    }
    if (!quote)
      return NextResponse.json({ error: quoteError }, { status: 409 });
    const lines = quote.items.map(
      (x: { name: string; size: string; quantity: number; price: number }) =>
        `${x.name} (${x.size}) × ${x.quantity} — ${money(x.price * x.quantity)}`,
    );
    const text = [
      `Hello Voyage Advent, ${saved ? `please confirm my order request ${reference}` : "I would like to place an order"}.`,
      "",
      ...lines,
      "",
      `Items subtotal: ${money(quote.subtotal)}`,
      `Name: ${input.name}`,
      `Phone: ${phone}`,
      `Method: ${input.fulfilment}`,
      input.fulfilment === "delivery" ? `Address: ${input.address}` : "",
      input.notes ? `Note: ${input.notes}` : "",
      "Please confirm availability, delivery/collection details and the final amount before payment.",
    ]
      .filter((x) => x !== undefined)
      .join("\n");
    return NextResponse.json(
      {
        saved,
        reference,
        subtotal: quote.subtotal,
        whatsapp: whatsappUrl(text),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(
      error,
      "We could not prepare your order. Please retry or contact us on WhatsApp.",
    );
  }
}
