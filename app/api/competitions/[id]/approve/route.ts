import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
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

    if (publicUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { action, title, organizer, deadline, category, skills, link } = body;

    if (!action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
    
    const updateData: any = { status: newStatus };
    
    if (action === "approve") {
      if (!title || !organizer || !deadline || !category) {
        return NextResponse.json({ error: "Missing required fields for approval" }, { status: 400 });
      }
      updateData.title = title;
      updateData.organizer = organizer;
      updateData.deadline = new Date(deadline).toISOString();
      updateData.category = category;
      updateData.skills = skills || [];
      if (link !== undefined) updateData.link = link;
    }

    const { error } = await adminDb
      .from("Competition")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Database Update Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create notifications for all users if approved
    if (action === "approve") {
      const { data: users } = await adminDb.from("User").select("id");
      if (users && users.length > 0) {
        const notifications = users.map((u: any) => ({
          id: crypto.randomUUID(),
          userId: u.id,
          type: "competition_new",
          title: "Kompetisi baru telah dipublikasikan.",
          description: `${title || 'Sebuah kompetisi'} baru saja dipublikasikan dan sudah dapat dilihat pada halaman kompetisi. Segera cek detail lomba, kategori, dan timeline pendaftaran untuk mulai membentuk tim terbaikmu.`,
          isRead: false,
          createdAt: new Date().toISOString()
        }));
        
        await adminDb.from("Notification").insert(notifications);
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
