import { NextResponse } from "next/server";

export async function POST() {
	return NextResponse.json(
		{ error: "Invite API belum diimplementasikan." },
		{ status: 501 },
	);
}
