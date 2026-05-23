import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function isLikelyFirstGoogleOAuthSignIn(user: any): boolean {
  if (!user) return false;

  const provider = user.app_metadata?.provider;
  if (provider !== "google") return false;

  const createdAt = user.created_at;
  const lastSignInAt = user.last_sign_in_at;

  if (!createdAt || !lastSignInAt) return false;

  const createdAtMs = Date.parse(createdAt);
  const lastSignInAtMs = Date.parse(lastSignInAt);

  if (Number.isNaN(createdAtMs) || Number.isNaN(lastSignInAtMs)) return false;

  return Math.abs(lastSignInAtMs - createdAtMs) < 15_000;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const intent = url.searchParams.get("intent") ?? "login";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components can skip cookie writes here.
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
  }

  if (intent === "login") {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (isLikelyFirstGoogleOAuthSignIn(user)) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (serviceRoleKey && user?.id) {
        const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
        await admin.auth.admin.deleteUser(user.id);
      }

      await supabase.auth.signOut();

      return NextResponse.redirect(new URL("/login?error=google_not_registered", url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
