import DraftCompetitionManager from "@/components/admin/DraftCompetitionManager";

export default function AdminStagingPage() {
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
