import { NextResponse } from "next/server";
export function assertOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) throw new Error("Invalid request origin");
  try {
    const supplied = new URL(origin);
    // Next.js may use an internal hostname for request.url behind its server.
    // Host is the browser's requested authority; browsers cannot override it.
    const host = request.headers.get("host") || new URL(request.url).host;
    const protocol =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      new URL(request.url).protocol.replace(":", "");
    if (
      supplied.host !== host ||
      supplied.protocol !== `${protocol}:` ||
      !["http:", "https:"].includes(supplied.protocol)
    ) {
      throw new Error("Invalid request origin");
    }
  } catch {
    throw new Error("Invalid request origin");
  }
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new Error("Expected JSON");
  const body = await request.text();
  if (body.length > 32000) throw new Error("Request is too large");
  return JSON.parse(body);
}
export function apiError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  const message = error instanceof Error ? error.message : fallback;
  if (message === "Unauthorised")
    return NextResponse.json(
      { error: "Please sign in with an authorised staff account." },
      { status: 401 },
    );
  if (message === "Invalid request origin")
    return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  return NextResponse.json({ error: fallback }, { status: 400 });
}
