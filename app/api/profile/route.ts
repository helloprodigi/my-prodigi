import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { name, nim, nomorWa, angkatan, jurusan, skills, interests, cvUrl, photoUrl } = body;
    
    // Construct User data to update
    const updateData: any = { updatedAt: new Date().toISOString() };
    
    if (name !== undefined) updateData.name = name;
    if (nim !== undefined) updateData.nim = nim;
    if (nomorWa !== undefined) updateData.nomorWa = nomorWa;
    if (angkatan !== undefined) updateData.angkatan = angkatan;
    if (jurusan !== undefined) updateData.jurusan = jurusan;
    if (skills !== undefined) updateData.skills = skills;
    if (interests !== undefined) updateData.interests = interests;
    if (cvUrl !== undefined) updateData.cvUrl = cvUrl;
    
    // Save photoUrl to Auth user metadata
    if (photoUrl !== undefined) {
      const { error: authError } = await supabase.auth.updateUser({
        data: { photoUrl }
      });
      if (authError) {
        console.error("Supabase Error updating auth metadata:", authError);
      }
    }

    const { error } = await supabase
      .from("User")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      console.error("Supabase Error updating profile:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API Error updating profile:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
