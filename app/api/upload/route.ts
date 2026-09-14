import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";

const BUCKET = "uploads";
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const data = await req.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran file harus antara 1 byte dan 15MB." }, { status: 400 });
    }
    if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Format file tidak didukung." }, { status: 400 });
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `upload-${uniqueSuffix}-${safeName}`;
    const contentType = file.type;

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
  } catch (e: unknown) {
    console.error("Upload error:", e);
    const message = e instanceof Error ? e.message : "Upload gagal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
