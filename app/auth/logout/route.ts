import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function handleLogoutRequest(request: Request) {
  const cookieStore = await cookies();
  const url = new URL(request.url);
  const loginUrl = new URL("/login", url.origin);

  try {
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut().catch(() => {});
  } catch (e) {
    console.error("Logout error:", e);
  }

  // Create 302 redirect response to /login
  const response = NextResponse.redirect(loginUrl, { status: 302 });

  // Delete all cookies on response headers and cookieStore
  const allCookies = cookieStore.getAll();
  for (const c of allCookies) {
    response.cookies.set(c.name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    try {
      cookieStore.delete(c.name);
    } catch {}
  }

  return response;
}

export async function GET(request: Request) {
  return handleLogoutRequest(request);
}

export async function POST(request: Request) {
  return handleLogoutRequest(request);
}
