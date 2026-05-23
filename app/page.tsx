import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/assets/myprodigi.svg"
          alt="MyProdigi"
          width={420}
          height={140}
          priority
          className="h-auto w-[280px] sm:w-[360px] md:w-[420px]"
        />
        <p className="text-base text-[#6E7980]">this is homePage</p>
      </div>
    </main>
  )
}