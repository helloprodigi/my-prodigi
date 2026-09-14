import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import TalentDashboard from "./TalentDashboard";
import AslabDashboard from "./AslabDashboard";
import AdminDashboard from "./AdminDashboard";
import { redirect } from "next/navigation";
import { getEffectiveRole } from "@/lib/get-effective-role";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user role
  const { data: userData } = await supabase
    .from("User")
    .select("role")
    .eq("id", user.id)
    .single();

  const databaseRole = (userData?.role || "talent").toLowerCase();
  const effectiveRole = await getEffectiveRole(databaseRole);

  if (databaseRole === "admin" && effectiveRole === "admin") {
    return <AdminDashboard />;
  }

  if (databaseRole === "asisten_lab" || (databaseRole === "admin" && effectiveRole === "asisten_lab")) {
    return <AslabDashboard />;
  }

  return <TalentDashboard />;
}
