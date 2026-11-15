// ─────────────────────────────────────────────────────────────────────────────
// MANASARA — Admin Login Page  /admin/login
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Mail, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAdminAuth } from '@/hooks/useAdminAuth'

// ── Validation schema ──────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { adminProfile, loading: authLoading } = useAdminAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect away if already authenticated
  useEffect(() => {
    if (!authLoading && adminProfile) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [adminProfile, authLoading, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)
    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })
      if (error) {
        // Distinguish common error types
        if (error.message.toLowerCase().includes('invalid')) {
          setServerError('Incorrect email or password. Please try again.')
        } else {
          setServerError(error.message)
        }
        return
      }
      navigate('/admin/dashboard', { replace: true })
    } catch {
      setServerError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show nothing while checking existing session
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF7F2]">
        <div className="w-8 h-8 rounded-full border-2 border-[#403238] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF7F2] px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EADFE0] px-8 py-10">
          {/* Wordmark */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold tracking-tight text-[#403238]"
              style={{ fontFamily: 'Fraunces, serif' }}
            >
              MANASARA
            </h1>
            <span className="inline-block mt-1 px-3 py-0.5 text-xs font-medium tracking-widest uppercase bg-[#F6E8EC] text-[#D98C9E] rounded-full">
              Admin
            </span>
          </div>

          {/* Error banner */}
          {serverError && (
            <div className="mb-5 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#403238] mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full rounded-lg border border-[#EADFE0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#403238] placeholder:text-gray-400 focus:border-[#D98C9E] focus:outline-none focus:ring-2 focus:ring-[#D98C9E]/20 disabled:opacity-50"
                  placeholder="admin@manasara.in"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[#403238] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full rounded-lg border border-[#EADFE0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#403238] placeholder:text-gray-400 focus:border-[#D98C9E] focus:outline-none focus:ring-2 focus:ring-[#D98C9E]/20 disabled:opacity-50"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg bg-[#403238] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2f2328] focus:outline-none focus:ring-2 focus:ring-[#403238]/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Admin-only notice */}
          <p className="mt-6 text-center text-xs text-gray-500">
            Admin access only. Customer accounts are not supported.
          </p>
        </div>
      </div>
    </div>
  )
}
