import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isLikelyFirstGoogleOAuthSignIn } from "@/lib/google-first-signin";

export async function POST(request: Request) {
  const { intent } = await request.json().catch(() => ({ intent: "login" }));

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

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (intent === "login" && isLikelyFirstGoogleOAuthSignIn(user)) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceRoleKey && user?.id) {
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
      await admin.auth.admin.deleteUser(user.id);
    }

    await supabase.auth.signOut();

    return NextResponse.json({ error: "google_not_registered" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
