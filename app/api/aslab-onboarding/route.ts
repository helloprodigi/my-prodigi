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
    const supabaseAdmin = createClient(cookieStore); 
    const { data: { user } } = await supabaseAdmin.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
    const adminDb = createSupabaseClient(supabaseUrl, serviceRoleKey);
    
    const body = await req.json();
    const { jabatan, divisi } = body;

    // Check if user is already in User table and has 'asisten_lab' role
    const { data: existingUser, error: fetchError } = await adminDb
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existingUser.role !== "asisten_lab") {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    // Update User data
    const { error } = await adminDb
      .from("User")
      .update({
        jabatan,
        divisi,
        updatedAt: new Date().toISOString()
      })
      .eq("id", user.id);

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
