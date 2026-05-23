import { NextResponse } from "next/server";

export async function POST() {
	return NextResponse.json(
		{ error: "Parse CV API belum diimplementasikan." },
		{ status: 501 },
	);
}
