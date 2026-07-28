import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, role: true, photoUrl: true }
    });

    const realRole = (dbUser?.role || user.user_metadata?.role || "talent").toLowerCase();
    const normalizedRealRole = realRole === "aslab" ? "asisten_lab" : realRole;

    const activeRoleCookie = cookieStore.get("activeRole")?.value;
    const normalizedCookie = activeRoleCookie === "aslab" ? "asisten_lab" : activeRoleCookie;

    const availableRoles = normalizedRealRole === "admin"
      ? ["talent", "asisten_lab", "admin"]
      : normalizedRealRole === "asisten_lab"
        ? ["talent", "asisten_lab"]
        : ["talent"];

    const effectiveRole = (normalizedCookie && availableRoles.includes(normalizedCookie))
      ? normalizedCookie
      : normalizedRealRole;

    return NextResponse.json({
      id: user.id,
      name: dbUser?.name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
      dbRole: normalizedRealRole,
      role: effectiveRole,
      availableRoles,
      photoUrl: dbUser?.photoUrl || user.user_metadata?.photoUrl || null
    });
  } catch (err: any) {
    console.error("API Error fetching profile:", err);
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
      updateData.photoUrl = photoUrl;
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
