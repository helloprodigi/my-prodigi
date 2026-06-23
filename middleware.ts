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
  if (user) {
    // Check onboarding status
    const { data: userData } = await supabase
      .from("User")
      .select("isOnboarded")
      .eq("id", user.id)
      .single();
    
    isOnboarded = userData?.isOnboarded || false;
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
