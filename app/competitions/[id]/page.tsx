import { cookies } from "next/headers";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import CompetitionCard from "@/components/CompetitionCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const adminDb = createAdminClient();
  const { data: comp } = await adminDb
    .from("Competition")
    .select("title, organizer, deadline")
    .eq("id", id)
    .single();

  if (!comp) return { title: "Lomba Tidak Ditemukan | MyProdigi" };

  const deadlineLabel = new Date(comp.deadline).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const description = `Diselenggarakan oleh ${comp.organizer}. Deadline ${deadlineLabel}. Cek detailnya di MyProdigi!`;

  return {
    title: `${comp.title} | MyProdigi`,
    description,
    openGraph: { title: comp.title, description, type: "website" },
    twitter: { card: "summary", title: comp.title, description },
  };
}

// Public, unauthenticated-friendly page — this is the link ShareCompetitionButton
// hands out, so it must render for visitors who aren't logged in at all. It
// lives outside the (dashboard) route group on purpose (no sidebar chrome)
// and reads with the admin client so it never depends on a viewer's RLS session.
// Styled as a standalone "preview modal" — real page underneath (so direct
// links, refresh, and crawlers all just work), but reads visually as the
// dedicated competition preview a shared link should open to.
export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const adminDb = createAdminClient();
  const { data: comp, error } = await adminDb
    .from("Competition")
    .select("*")
    .eq("id", id)
    .single();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  const buatTimHref = user
    ? `/matchmaking?competitionId=${id}`
    : `/login?redirect=${encodeURIComponent(`/matchmaking?competitionId=${id}`)}`;

  if (error || !comp) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-red-500 text-center">Lomba Tidak Ditemukan</h1>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Link ini mungkin sudah tidak berlaku, atau lomba yang dimaksud sudah dihapus.
        </p>
        <Link href="/" className="text-sm font-semibold text-[#0A1024] hover:underline">
          Kembali ke MyProdigi
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center px-4 py-8 sm:py-12">
      <Link href="/" className="mb-6 sm:mb-8" aria-label="Kembali ke MyProdigi">
        <Image src="/assets/myprodigi-logo.svg" alt="MyProdigi" width={218} height={50} className="h-9 w-auto object-contain" />
      </Link>

      <div className="relative w-full max-w-xl">
        <Link
          href="/"
          aria-label="Tutup"
          className="absolute -top-3 -right-3 z-10 p-2 bg-white border border-gray-200 rounded-full text-gray-500 shadow-sm hover:text-[#0A1024] hover:bg-gray-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A1024]"
        >
          <X className="w-4 h-4" />
        </Link>

        <CompetitionCard competition={comp} buatTimHref={buatTimHref} />
      </div>
    </div>
  );
}
