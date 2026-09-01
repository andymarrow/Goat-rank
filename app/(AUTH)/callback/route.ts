import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // The `next` param lets us redirect the user to a specific page after login
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error("Auth Callback Error:", error.message)
    }
  }

  // If there's an error, redirect to a generic auth error page or back to login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}