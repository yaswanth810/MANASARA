import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { AdminProfileRow } from '@/lib/database.types'

interface AuthState {
  userId: string | null
  adminProfile: AdminProfileRow | null
  loading: boolean
  error: string | null
}

export function useAdminAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    userId: null,
    adminProfile: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let mounted = true

    async function loadProfile(userId: string) {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (!mounted) return

      if (error || !data) {
        setState({ userId, adminProfile: null, loading: false, error: 'No active admin profile found.' })
      } else {
        setState({ userId, adminProfile: data, loading: false, error: null })
      }
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setState({ userId: null, adminProfile: null, loading: false, error: null })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (session?.user) {
        setState((s) => ({ ...s, loading: true }))
        loadProfile(session.user.id)
      } else {
        setState({ userId: null, adminProfile: null, loading: false, error: null })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return state
}
