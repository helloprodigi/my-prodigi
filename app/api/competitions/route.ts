import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
    const adminDb = createSupabaseClient(supabaseUrl, serviceRoleKey);

    // Get user role from public.User
    const { data: publicUser } = await adminDb
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = publicUser?.role || "talent";

    // Set status based on role
    const status = role === "admin" ? "APPROVED" : "PENDING";

    const body = await req.json();
    const { title, organizer, category, skills, link, deadline } = body;

    if (role === "admin") {
      if (!title || !organizer || !category || !deadline) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
    } else {
      if (!link) {
        return NextResponse.json({ error: "Link Lomba wajib diisi" }, { status: 400 });
      }
    }

    const compTitle = title || "Menunggu Review Admin";
    const compOrganizer = organizer || "TBD";
    const compCategory = category || "Belmawa";
    const compDeadline = deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const competitionData = {
      id: crypto.randomUUID(),
      title: compTitle,
      organizer: compOrganizer,
      category: compCategory,
      skills: skills || [],
      link: link || null,
      deadline: compDeadline,
      status,
      createdById: user.id,
      updatedAt: new Date().toISOString()
    };

    const { error } = await adminDb
      .from("Competition")
      .insert(competitionData);

    if (error) {
      console.error("Database Insert Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
