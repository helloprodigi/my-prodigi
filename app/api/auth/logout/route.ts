import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const url = new URL(request.url);
  const loginUrl = new URL("/login", url.origin);

  try {
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut().catch(() => {});
  } catch (e) {
    console.error("Logout API Error:", e);
  }

  const response = NextResponse.redirect(loginUrl, { status: 302 });

  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    response.cookies.set(cookie.name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    try {
      cookieStore.delete(cookie.name);
    } catch {}
  }

  return response;
}
