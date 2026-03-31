import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function useSupabaseSession() {
  const enabled = Boolean(supabase)
  const [session, setSession] = useState(() => (enabled ? undefined : null))

  useEffect(() => {
    if (!supabase) return

    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  const loading = enabled && session === undefined
  return { session: session ?? null, loading, enabled }
}

