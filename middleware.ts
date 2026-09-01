import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { authCookieOptions } from './utils/supabase/cookie-options'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
      cookieOptions: authCookieOptions,
    }
  )

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser()

  let isOnboarded = false;
  let isAslab = false;
  let isAdmin = false;
  let isAslabOnboarded = false;
  let effectiveIsAslab = false;
  let effectiveIsAdmin = false;

  if (user) {
    // Check onboarding status
    const { data: userData } = await supabase
      .from("User")
      .select("isOnboarded, role, divisi, jabatan")
      .eq("id", user.id)
      .single();

    isOnboarded = userData?.isOnboarded || false;
    isAslab = userData?.role === 'asisten_lab';
    isAdmin = userData?.role === 'admin';
    isAslabOnboarded = !!(userData?.divisi && userData?.jabatan);

    // Respect the "view as" role switch (see ProfileClient / Sidebar) so that
    // an admin who switched their active role to Asisten Lab (or vice versa)
    // isn't blocked from the routes that role's sidebar links to.
    const rawActiveRole = request.cookies.get('activeRole')?.value;
    const normalizedActiveRole = rawActiveRole === 'aslab' ? 'asisten_lab' : rawActiveRole;
    const availableRoles = isAdmin
      ? ['talent', 'asisten_lab', 'admin']
      : isAslab
        ? ['talent', 'asisten_lab']
        : ['talent'];
    const effectiveRole = (normalizedActiveRole && availableRoles.includes(normalizedActiveRole))
      ? normalizedActiveRole
      : (isAdmin ? 'admin' : isAslab ? 'asisten_lab' : 'talent');

    effectiveIsAslab = effectiveRole === 'asisten_lab';
    effectiveIsAdmin = effectiveRole === 'admin';
  }

  const { pathname } = request.nextUrl
  
  // Public routes (Auth pages)
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/verify-otp')
  
  // Protected routes
  // Assuming these routes are meant for logged-in users only
  const isProtectedRoute = pathname.startsWith('/home') ||
                           pathname.startsWith('/dashboard') ||
                           pathname.startsWith('/matchmaking') ||
                           pathname === '/competitions' ||
                           pathname.startsWith('/achievements') ||
                           pathname.startsWith('/library') || 
                           pathname.startsWith('/notifications') || 
                           pathname.startsWith('/onboarding') ||
                           pathname.startsWith('/aslab-onboarding') ||
                           pathname.startsWith('/aslab-proker') ||
                           pathname.startsWith('/my-divisi') ||
                           pathname.startsWith('/myshift') ||
                           pathname.startsWith('/profile') ||
                           pathname.startsWith('/team-invite') ||
                           pathname.startsWith('/agenda') ||
                           pathname.startsWith('/absensi') ||
                           pathname.startsWith('/faq');

  // Redirect root to /dashboard for logged-in users, /login for anonymous
  // visitors (and crawlers) — going straight there avoids bouncing through
  // /dashboard, which robots.txt disallows and would otherwise make Google
  // treat "/" itself as blocked.
  if (pathname === '/') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = user ? '/dashboard' : '/login'
    return NextResponse.redirect(redirectUrl)
  }

  if (pathname === '/home') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Logic to handle redirects
  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  if (user) {
    if (isAuthRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = isOnboarded ? '/dashboard' : '/onboarding'
      return NextResponse.redirect(redirectUrl)
    }

    if (isProtectedRoute) {
      if (!isOnboarded && !pathname.startsWith('/onboarding')) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/onboarding'
        return NextResponse.redirect(redirectUrl)
      }

      if (isOnboarded && pathname.startsWith('/onboarding')) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        return NextResponse.redirect(redirectUrl)
      }

      if (isOnboarded && isAslab && !isAslabOnboarded && !pathname.startsWith('/aslab-onboarding')) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/aslab-onboarding'
        return NextResponse.redirect(redirectUrl)
      }

      if (isOnboarded && isAslab && isAslabOnboarded && pathname.startsWith('/aslab-onboarding')) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        return NextResponse.redirect(redirectUrl)
      }
      
      // STRICT ROUTE WHITELIST based on Effective Role
      // Only apply whitelist to fully onboarded users navigating to other pages
      if (isOnboarded && (!isAslab || isAslabOnboarded)) {
        const tab = request.nextUrl.searchParams.get('tab');
        const view = request.nextUrl.searchParams.get('view');
        
        let allowed = false;

        if (effectiveIsAdmin) {
          if (pathname === '/dashboard') allowed = true;
          else if (pathname === '/myshift') allowed = true;
          else if (pathname === '/agenda') allowed = true;
          else if (pathname.startsWith('/absensi')) allowed = true; // Added to prevent breaking Riwayat Agenda
          else if (pathname === '/profile') allowed = true;
          else if (pathname === '/competitions') {
            if (!tab && !view) allowed = true; // default tab (Belmawa)
            else if (tab === 'Non-Belmawa' && !view) allowed = true;
            else if (tab === 'Internal' && !view) allowed = true;
            else if (tab === 'Preview Lomba' && !view) allowed = true;
            else if (tab === 'Guidebook' && !view) allowed = true;
            else if (view === 'draft' && tab === 'Guidebook') allowed = true;
            else if (view === 'draft' && tab === 'Proposal') allowed = true;
            else if (view === 'draft' && tab === 'Pitch Deck') allowed = true;
          }
        } else if (effectiveIsAslab) {
          if (pathname === '/dashboard') allowed = true;
          else if (pathname === '/aslab-proker' || pathname.startsWith('/aslab-proker/')) allowed = true;
          else if (pathname === '/aslab-onboarding') allowed = true;
          else if (pathname === '/my-divisi') allowed = true;
          else if (pathname === '/myshift') allowed = true;
          else if (pathname === '/agenda') allowed = true;
          else if (pathname.startsWith('/absensi')) allowed = true; // Added to prevent breaking Riwayat Agenda
          else if (pathname === '/notifications') allowed = true;
          else if (pathname === '/profile') allowed = true;
          else if (pathname === '/competitions') {
            if (!tab && !view) allowed = true;
            else if (tab === 'Proposal' && !view) allowed = true;
            else if (tab === 'Pitch Deck' && !view) allowed = true;
            else if (tab === 'Guidebook' && !view) allowed = true;
          }
        } else { // effective role is talent
          if (pathname === '/dashboard') allowed = true;
          else if (pathname.startsWith('/dashboard/team/')) allowed = true;
          else if (pathname.startsWith('/team-invite/')) allowed = true; // Added to prevent breaking invites
          else if (pathname === '/matchmaking') allowed = true;
          else if (pathname === '/faq') allowed = true;
          else if (pathname === '/notifications') allowed = true;
          else if (pathname === '/profile') allowed = true;
          else if (pathname === '/competitions') {
            if (!tab && !view) allowed = true;
            else if (tab === 'Non-Belmawa' && !view) allowed = true;
            else if (tab === 'Internal' && !view) allowed = true;
            else if (view === 'draft' && !tab) allowed = true;
            else if (view === 'draft' && tab === 'Proposal') allowed = true;
            else if (view === 'draft' && tab === 'Pitch Deck') allowed = true;
            else if (view === 'draft' && tab === 'Guidebook') allowed = true;
          }
        }

        if (!allowed && pathname !== '/dashboard') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
