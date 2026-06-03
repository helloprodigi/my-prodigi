import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase URL or Service Role Key" }, { status: 500 });
    }

    const cookieStore = await cookies();
    const supabaseAdmin = createClient(cookieStore); // We still need cookieStore to get the user session
    // Actually, to get the user safely, we get it from normal client
    const { data: { user } } = await supabaseAdmin.auth.getUser();

    // Then use a separate admin client to bypass RLS
    const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
    const adminDb = createSupabaseClient(supabaseUrl, serviceRoleKey);
    
    const body = await req.json();
    const { jurusan, angkatan, nomorWa, cvUrl, skills, interests } = body;

    // Use a placeholder UUID if user is not authenticated for development purposes
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";
    
    // Extract name from user metadata (assuming it was passed during signup)
    const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || null;
    
    // Construct User data
    const userData = {
      id: userId,
      email: user?.email || "dummy@example.com", // In a real app this should only come from user obj
      name: displayName,
      jurusan,
      angkatan,
      nomorWa,
      cvUrl,
      skills,
      interests,
      isOnboarded: true,
      updatedAt: new Date().toISOString()
    };

    // Upsert into public.User table using supabase client
    // We use onConflict: "email" because if the user deletes their auth account
    // and registers again, they'll have a new auth ID but the old email will still
    // be in public.User, causing a unique constraint violation on id.
    const { error } = await adminDb
      .from("User")
      .upsert(userData, { onConflict: "email" });

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
