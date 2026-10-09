import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, serviceClient } from "@/lib/supabase/server";
import { assertOrigin, readJson, apiError } from "@/lib/http";
export async function PATCH(request: Request) {
  try {
    assertOrigin(request);
    const { user } = await requireAdmin();
    const parsed = z
      .object({
        id: z.uuid(),
        status: z.enum([
          "pending",
          "confirmed",
          "preparing",
          "ready",
          "completed",
          "cancelled",
        ]),
        delivery_fee: z.number().int().min(0).max(100000).nullable(),
        payment_status: z.enum(["unpaid", "pending", "paid", "failed"]),
        payment_reference: z.string().max(100),
        admin_note: z.string().max(1000),
      })
      .safeParse(await readJson(request));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Please check the order fields." },
        { status: 400 },
      );
    const v = parsed.data;
    const { error } = await serviceClient().rpc("voyage_update_order", {
      p_order_id: v.id,
      p_actor: user.id,
      p_status: v.status,
      p_delivery_fee: v.delivery_fee,
      p_payment_status: v.payment_status,
      p_payment_reference: v.payment_reference,
      p_admin_note: v.admin_note,
    });
    if (error) {
      const safe =
        error.code === "P0001" ? error.message : "Could not save this order.";
      return NextResponse.json({ error: safe }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e, "Could not update this order.");
  }
}
