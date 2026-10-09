import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/supabase/server";
import { assertOrigin, apiError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const { client } = await requireAdmin();
    const data = await request.formData();
    const file = data.get("file");
    if (
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      file.size < 10 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      return NextResponse.json(
        { error: "Choose a JPG, PNG or WebP image under 5 MB." },
        { status: 400 },
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    const isJpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const isPng = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isWebp =
      bytes.subarray(0, 4).toString() === "RIFF" &&
      bytes.subarray(8, 12).toString() === "WEBP";
    if (!(
      (file.type === "image/jpeg" && isJpg) ||
      (file.type === "image/png" && isPng) ||
      (file.type === "image/webp" && isWebp)
    ))
      return NextResponse.json(
        { error: "The file does not match its image format." },
        { status: 400 },
      );
    const path = `${randomUUID()}.${isJpg ? "jpg" : isPng ? "png" : "webp"}`;
    const { error } = await client.storage
      .from("voyage-products")
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (error) throw new Error("Upload failed");
    const { data: result } = client.storage
      .from("voyage-products")
      .getPublicUrl(path);
    return NextResponse.json({ url: result.publicUrl });
  } catch (e) {
    return apiError(
      e,
      "Image upload failed. Check your storage setup and try again.",
    );
  }
}
