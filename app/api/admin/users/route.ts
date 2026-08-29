import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = (searchParams.get("search") || "").trim();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Keep the management table in sync with Supabase Auth. User rows can
    // remain in public.User after an account is deleted from auth.users.
    const adminSupabase = createAdminClient();
    const authUserIds: string[] = [];
    const perPage = 1000;
    let authPage = 1;

    while (true) {
      const { data: authUsers, error: authUsersError } = await adminSupabase.auth.admin.listUsers({
        page: authPage,
        perPage,
      });

      if (authUsersError) {
        return NextResponse.json({ error: authUsersError.message }, { status: 500 });
      }

      authUserIds.push(...authUsers.users.map((authUser) => authUser.id));
      if (authUsers.users.length < perPage) break;
      authPage += 1;
    }

    // Fetch only users that still exist in auth.users, with pagination and
    // optional name/email filtering.
    let query = supabase
      .from("User")
      .select("*", { count: "exact" })
      .in("id", authUserIds)
      .order("createdAt", { ascending: false });

    if (search) {
      const safeSearch = search.replace(/[,()%]/g, "");
      query = query.or(`name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`);
    }

    const { data: users, error, count } = await query.range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({ 
      users,
      currentPage: page,
      totalPages,
      totalCount: count || 0
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing userId or role" }, { status: 400 });
    }

    const { error } = await supabase
      .from("User")
      .update({ role, updatedAt: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
