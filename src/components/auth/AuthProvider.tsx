// E:/MANASARA/src/components/auth/AuthProvider.tsx
// Full AuthProvider implementation — needs .tsx for JSX.
// Re-exports AuthProvider so App.tsx can import from here cleanly.

import { useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  AuthContext,
  fetchProfile,
  mapSignInError,
} from '@/hooks/useAuth'
import type { UserProfile, AuthContextValue } from '@/hooks/useAuth'

// ---------------------------------------------------------------------------
// AuthProvider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // -------------------------------------------------------------------------
  // Load profile whenever the authenticated user changes
  // -------------------------------------------------------------------------
  const loadProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null)
      return
    }
    const fetched = await fetchProfile(currentUser.id)
    setProfile(fetched)
  }, [])

  // -------------------------------------------------------------------------
  // Bootstrap: get existing session, then subscribe to auth state changes
  // -------------------------------------------------------------------------
  useEffect(() => {
    let mounted = true

    // Eagerly resolve any existing session so the UI is not stuck loading
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!mounted) return
      setSession(existingSession)
      setUser(existingSession?.user ?? null)
      await loadProfile(existingSession?.user ?? null)
      setLoading(false)
    })

    // Subscribe to sign-in / sign-out / token refresh events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      setUser(newSession?.user ?? null)
      await loadProfile(newSession?.user ?? null)
      // Resolve loading state in case the subscription fires before getSession()
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  // -------------------------------------------------------------------------
  // signUp
  // -------------------------------------------------------------------------
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      phone?: string,
    ): Promise<{ error: string | null }> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (error) {
        return { error: error.message }
      }

      const newUser = data.user
      if (newUser) {
        // Upsert profile row so it exists even before email confirmation
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: newUser.id,
              full_name: fullName,
              phone: phone ?? null,
            },
            { onConflict: 'id' },
          )

        if (profileError) {
          console.error('[AuthProvider] signUp profile upsert error:', profileError.message)
        }
      }

      return { error: null }
    },
    [],
  )

  // -------------------------------------------------------------------------
  // signIn
  // -------------------------------------------------------------------------
  const signIn = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: mapSignInError(error.message) }
      }

      return { error: null }
    },
    [],
  )

  // -------------------------------------------------------------------------
  // signOut
  // -------------------------------------------------------------------------
  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut()
    // onAuthStateChange will clear user/session/profile; set locally too for
    // immediate UI response without waiting for the subscription callback.
    setUser(null)
    setSession(null)
    setProfile(null)
  }, [])

  // -------------------------------------------------------------------------
  // updateProfile
  // -------------------------------------------------------------------------
  const updateProfile = useCallback(
    async (
      data: Partial<Pick<UserProfile, 'full_name' | 'phone' | 'avatar_url'>>,
    ): Promise<{ error: string | null }> => {
      if (!user) {
        return { error: 'Not authenticated.' }
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          { id: user.id, ...data },
          { onConflict: 'id' },
        )

      if (upsertError) {
        return { error: upsertError.message }
      }

      // Keep Supabase Auth user metadata in sync when full_name changes
      if (data.full_name !== undefined) {
        const { error: metaError } = await supabase.auth.updateUser({
          data: { full_name: data.full_name },
        })
        if (metaError) {
          console.error('[AuthProvider] updateUser meta error:', metaError.message)
        }
      }

      // Refresh local profile state from the source of truth
      const updated = await fetchProfile(user.id)
      setProfile(updated)

      return { error: null }
    },
    [user],
  )

  // -------------------------------------------------------------------------
  // refreshProfile
  // -------------------------------------------------------------------------
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user) return
    const fetched = await fetchProfile(user.id)
    setProfile(fetched)
  }, [user])

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------
  const value: AuthContextValue = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
