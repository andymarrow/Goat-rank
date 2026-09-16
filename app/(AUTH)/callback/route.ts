import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { sendWelcome } from '@/lib/email/send'
import { notify } from '@/lib/notify'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // The `next` param lets us redirect the user to a specific page after login
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // First authenticated request after confirming an address, which is the
      // only moment a welcome makes sense. Best effort and never awaited into
      // the redirect contract: a mail outage must not strand a new account on
      // an error page.
      await greet()

      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error("Auth Callback Error:", error.message)
    }
  }

  // If there's an error, redirect to a generic auth error page or back to login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

/**
 * Welcome a genuinely new account, once.
 *
 * `welcomed_at` is the guard: confirming an address twice, or signing in on a
 * second device, must not send it again.
 */
async function greet(): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) return

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('profiles')
      .select('username, welcomed_at')
      .eq('id', user.id)
      .maybeSingle()

    // No column yet (migration 0013) or already greeted: nothing to do.
    if (!profile || profile.welcomed_at) return

    const name = profile.username ?? user.email.split('@')[0]

    await admin.from('profiles').update({ welcomed_at: new Date().toISOString() }).eq('id', user.id)

    await notify({
      profileId: user.id,
      kind: 'system',
      title: `Welcome to GOAT Rank, ${name}`,
      body: 'Back a contender and the leaderboard moves by what you paid. 30% of it reaches a charity.',
      href: '/',
    })

    await sendWelcome(user.email, name)
  } catch (error) {
    console.error('welcome failed:', error)
  }
}
