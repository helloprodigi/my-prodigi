import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { divisions } from "@/lib/divisions";
import { getCreatableDivisionNames } from "@/lib/permissions";
import { BuatProkerForm } from "./BuatProkerForm";

export default async function BuatProkerPage() {
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

  const allowedNames = getCreatableDivisionNames(me.jabatan, me.hasProkerAccess);
  if (allowedNames.length === 0) {
    redirect("/aslab-proker");
  }

  const allowedDivisions = divisions.filter((d) => allowedNames.includes(d.name));

  return <BuatProkerForm allowedDivisions={allowedDivisions} />;
}
