import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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
                           pathname.startsWith('/competitions') || 
                           pathname.startsWith('/achievements') || 
                           pathname.startsWith('/library') || 
                           pathname.startsWith('/notifications') || 
                           pathname.startsWith('/onboarding') ||
                           pathname.startsWith('/aslab-onboarding') ||
                           pathname.startsWith('/aslab-proker') ||
                           pathname.startsWith('/my-divisi') ||
                           pathname.startsWith('/myshift') ||
                           pathname.startsWith('/profile') ||
                           pathname.startsWith('/team-invite');

  // Redirect root to /dashboard
  if (pathname === '/') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
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
      
      // Role-based route protection (based on the currently active/viewed role)
      if (pathname.startsWith('/absensi') && !effectiveIsAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      if (pathname.startsWith('/myshift') && !effectiveIsAslab && !effectiveIsAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      if (pathname.startsWith('/agenda') && !effectiveIsAdmin && !effectiveIsAslab) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      if (pathname.startsWith('/matchmaking') && effectiveIsAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
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
