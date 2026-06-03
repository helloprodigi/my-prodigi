import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

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