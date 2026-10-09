import { NextResponse } from "next/server";
import { z } from "zod";
import { sessionClient } from "@/lib/supabase/server";
import { assertOrigin, readJson, apiError } from "@/lib/http";
import { hasSupabase } from "@/lib/supabase/config";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    if (!hasSupabase())
      return NextResponse.json(
        {
          error:
            "Staff sign-in is not connected yet. Complete the Supabase setup first.",
        },
        { status: 503 },
      );
    const input = z
      .object({
        email: z.email().max(200),
        password: z.string().min(1).max(200),
      })
      .safeParse(await readJson(request));
    if (!input.success)
      return NextResponse.json(
        { error: "Enter your email and password." },
        { status: 400 },
      );
    const db = await sessionClient();
    const { data, error } = await db.auth.signInWithPassword(input.data);
    if (error || !data.user)
      return NextResponse.json(
        { error: "Unable to sign in. Check your details and try again." },
        { status: 401 },
      );
    const { data: admin } = await db
      .from("voyage_admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (!admin) {
      await db.auth.signOut();
      return NextResponse.json(
        { error: "This account does not have staff access." },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiError(e, "Unable to sign in right now. Please try again.");
  }
}
