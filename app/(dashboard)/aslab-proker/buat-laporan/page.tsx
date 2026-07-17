import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { getCreatableDivisionNames } from "@/lib/permissions";
import { BuatLaporanForm } from "./BuatLaporanForm";

export default async function BuatLaporanPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: me } = await supabase
    .from("User")
    .select("role, jabatan, hasProkerAccess")
    .eq("id", user.id)
    .single();

  if (me?.role !== "asisten_lab") {
    redirect("/dashboard");
  }

  const allowedDivisionNames = getCreatableDivisionNames(me.jabatan, me.hasProkerAccess);
  if (allowedDivisionNames.length === 0) {
    redirect("/aslab-proker");
  }

  return <BuatLaporanForm allowedDivisionNames={allowedDivisionNames} />;
}
