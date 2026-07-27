import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const url = new URL(request.url);
    const tab = url.searchParams.get("tab");
    const category = url.searchParams.get("category");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase.from("DraftCompetition").select("*").order("createdAt", { ascending: false });
    if (tab) query = query.eq("tab", tab);
    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ draftCompetitions: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
    const adminDb = createSupabaseClient(supabaseUrl, serviceRoleKey);

    const { data: publicUser } = await adminDb.from("User").select("role").eq("id", user.id).single();
    if (publicUser?.role !== "admin" && publicUser?.role !== "asisten_lab") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, organizer, tab, category, skills, description, link } = body;

    if (!title || !organizer || !tab) {
      return NextResponse.json({ error: "Title, organizer, dan tab wajib diisi" }, { status: 400 });
    }

    const { error } = await adminDb.from("DraftCompetition").insert({
      id: crypto.randomUUID(),
      title,
      organizer: organizer || "Admin",
      tab,
      category: category || null,
      skills: Array.isArray(skills) ? skills : [],
      description: description || null,
      link: link || null,
      createdById: user.id,
      updatedAt: new Date().toISOString(),
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}