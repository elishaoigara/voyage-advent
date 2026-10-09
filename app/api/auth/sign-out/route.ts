import { NextResponse } from "next/server";
import { sessionClient } from "@/lib/supabase/server";
import { assertOrigin, apiError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const db = await sessionClient();
    await db.auth.signOut();
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
