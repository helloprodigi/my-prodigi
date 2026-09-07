import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "uploads";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const data = await req.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `upload-${uniqueSuffix}-${safeName}`;
    const contentType = file.type || "application/octet-stream";

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filename, uint8, { contentType, upsert: false });

    if (uploadError) {
      if (uploadError.message.toLowerCase().includes("bucket")) {
        await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
        const { error: retryError } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(filename, uint8, { contentType, upsert: false });
        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: e?.message ?? "Upload gagal." }, { status: 500 });
  }
}
