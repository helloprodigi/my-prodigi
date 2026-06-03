import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white p-12 rounded-3xl shadow-lg flex flex-col items-center gap-8 max-w-md w-full text-center border border-gray-100">
        <Image
          src="/assets/myprodigi.svg"
          alt="MyProdigi"
          width={420}
          height={140}
          priority
          className="h-auto w-[240px]"
        />
        <div>
          <h1 className="text-3xl font-bold text-[#0A1024] mb-3">Welcome Back!</h1>
          <p className="text-[#6E7980] leading-relaxed">Anda telah berhasil login. Silahkan lanjutkan ke halaman Dashboard untuk melihat aktivitas Anda.</p>
        </div>
        <Link 
          href="/home" 
          className="w-full bg-[#FFC700] text-[#0A1024] font-bold py-4 px-6 rounded-xl hover:bg-[#e6b400] transition-colors shadow-sm"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  )
}