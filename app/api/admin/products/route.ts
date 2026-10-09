import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { assertOrigin, readJson, apiError } from "@/lib/http";
import { productSchema } from "@/lib/validation";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const { client } = await requireAdmin();
    const p = productSchema.safeParse(await readJson(request));
    if (!p.success)
      return NextResponse.json(
        { error: p.error.issues[0]?.message },
        { status: 400 },
      );
    const { error } = await client
      .from("voyage_products")
      .insert({ ...p.data, updated_at: new Date().toISOString() });
    if (error)
      return NextResponse.json(
        {
          error:
            error.code === "23505"
              ? "This product slug already exists. Choose a different slug."
              : "Could not create this product.",
        },
        { status: 400 },
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(request: Request) {
  try {
    assertOrigin(request);
    const { client } = await requireAdmin();
    const p = productSchema.safeParse(await readJson(request));
    if (!p.success)
      return NextResponse.json(
        { error: p.error.issues[0]?.message },
        { status: 400 },
      );
    const { data, error } = await client
      .from("voyage_products")
      .update({ ...p.data, updated_at: new Date().toISOString() })
      .eq("id", p.data.id)
      .select("id")
      .single();
    if (error || !data) throw new Error("Save failed");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e, "Could not save this product.");
  }
}
