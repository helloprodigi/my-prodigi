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

  const effectiveRole = await getEffectiveRole(userData?.role);

  if (effectiveRole === "asisten_lab") {
    return <AslabDashboard />;
  }

  if (effectiveRole === "admin") {
    return <AdminDashboard />;
  }

  return <TalentDashboard />;
}
