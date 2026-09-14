import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DraftCompetitionManager from "@/components/admin/DraftCompetitionManager";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export default async function AdminStagingPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) redirect("/login");

	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: { role: true },
	});
	if (dbUser?.role !== "admin") redirect("/dashboard");

	return (
		<main className="min-h-screen bg-[#FAFAFA] p-6 md:p-10">
			<div className="mb-6">
				<h1 className="text-2xl md:text-3xl font-semibold text-[#0A1024]">Admin Staging</h1>
				<p className="mt-2 text-sm text-[#6E7980]">Kelola draft competition di sini. Data tersimpan ke Supabase.</p>
			</div>
			<DraftCompetitionManager />
		</main>
	);
}
