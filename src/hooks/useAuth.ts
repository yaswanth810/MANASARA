// E:/MANASARA/src/hooks/useAuth.ts
// User authentication hook using Supabase Auth.
// Separate from useAdminAuth — this is for storefront customers.
//
// AuthProvider lives in AuthProvider.tsx (needs .tsx for JSX).
// This file exports: AuthContext, UserProfile, AuthContextValue, useAuth,
// and the helper functions used by AuthProvider.

import { createContext, useContext } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
  ) => Promise<{ error: string | null }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (
    data: Partial<Pick<UserProfile, 'full_name' | 'phone' | 'avatar_url'>>,
  ) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Context (exported so AuthProvider.tsx can consume it)
// ---------------------------------------------------------------------------

export const AuthContext = createContext<AuthContextValue | null>(null)

// ---------------------------------------------------------------------------
// Internal helpers (exported so AuthProvider.tsx can use them)
// ---------------------------------------------------------------------------

/** Fetch a user's profile row from the `profiles` table. */
export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[useAuth] fetchProfile error:', error.message)
    return null
  }
  return data as UserProfile
}

/** Map raw Supabase error messages to user-friendly strings. */
export function mapSignInError(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Please verify your email first.'
  }
  return raw
}

// ---------------------------------------------------------------------------
// useAuth hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>.')
  }
  return ctx
}
