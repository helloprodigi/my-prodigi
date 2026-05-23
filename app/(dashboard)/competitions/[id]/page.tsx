type CompetitionDetailPageProps = {
	params: Promise<{
		id: string;
	}>;
};

export default async function CompetitionDetailPage({ params }: CompetitionDetailPageProps) {
	const { id } = await params;

	return (
		<main className="min-h-screen p-6">
			<h1 className="text-2xl font-semibold text-[#1f2a37]">Competition Detail</h1>
			<p className="mt-2 text-sm text-[#6E7980]">Competition ID: {id}</p>
		</main>
	);
}
