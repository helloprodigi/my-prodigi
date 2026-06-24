import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: competition, error } = await supabase
      .from("Competition")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !competition) {
      return NextResponse.json({ error: error?.message || "Competition not found" }, { status: 404 });
    }

    return NextResponse.json({ competition });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = createAdminClient();

    const { data: publicUser } = await adminDb
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (publicUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const { error } = await adminDb.from("Competition").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = createAdminClient();

    const { data: publicUser } = await adminDb
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (publicUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { title, organizer, deadline, category, skills, link } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (organizer !== undefined) updateData.organizer = organizer;
    if (deadline !== undefined) updateData.deadline = new Date(deadline).toISOString();
    if (category !== undefined) updateData.category = category;
    if (skills !== undefined) updateData.skills = skills;
    if (link !== undefined) updateData.link = link;

    const { error } = await adminDb.from("Competition").update(updateData).eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}