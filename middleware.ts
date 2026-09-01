import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // We need to manage cookies across the request/response lifecycle securely
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // Call getUser() to securely verify the session token with the Supabase API
  const { data: { user } } = await supabase.auth.getUser()

  const url = new URL(request.url)

  // --- PROTECTED ROUTES LOGIC ---
  // If the user is NOT logged in and tries to access /dashboard or /create...
  if (!user && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/create'))) {
    // Redirect them to login, and pass a ?next parameter so we can send them back after!
    return NextResponse.redirect(new URL(`/login?next=${url.pathname}`, request.url))
  }

  // --- AUTH ROUTE LOGIC ---
  // If the user IS logged in and tries to go to the login page, redirect them to dashboard.
  if (user && url.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Return the original response (or the updated one with new cookies)
  return supabaseResponse
}

// This config ensures the middleware only runs on specific routes, saving server processing time
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks (don't block our LemonSqueezy webhooks!)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}