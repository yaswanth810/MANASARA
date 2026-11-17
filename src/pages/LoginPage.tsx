import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextRoute = searchParams.get("next") ?? "/account";

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate(nextRoute, { replace: true });
    }
  }, [user, authLoading, navigate, nextRoute]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const { error } = await signIn(values.email, values.password);
      if (error) {
        setServerError(
          error.message === "Invalid login credentials"
            ? "Incorrect email or password. Please try again."
            : error.message
        );
      } else {
        navigate(nextRoute, { replace: true });
      }
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // While checking auth state, show nothing (avoid flash)
  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center px-4 py-12">
      {/* ── Card ── */}
      <div className="card-surface w-full max-w-md px-8 py-10 rounded-2xl shadow-sm border border-soft-line">
        {/* ── Branding ── */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <span className="text-4xl select-none" aria-hidden="true">🌸</span>
          <h1 className="font-fraunces editorial-lg text-plum tracking-tight">
            MANASARA
          </h1>
          <p className="font-dm-sans text-sm text-dusty-pink font-medium tracking-widest uppercase">
            Handmade with love
          </p>
        </div>

        <h2 className="font-fraunces editorial-md text-plum mb-1 text-center">
          Welcome back
        </h2>
        <p className="font-dm-sans text-sm text-center mb-7" style={{ color: "#9e7a84" }}>
          Sign in to your account to continue
        </p>

        {/* ── Server Error ── */}
        {serverError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 font-dm-sans text-sm">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <span>{serverError}</span>
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Email */}
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="label-sm font-dm-sans text-plum font-medium"
            >
              Email address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dusty-pink pointer-events-none">
                <Mail size={16} />
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`input-base pl-9 w-full font-dm-sans ${
                  errors.email ? "border-red-400 focus:ring-red-300" : ""
                }`}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="font-dm-sans text-xs text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="label-sm font-dm-sans text-plum font-medium"
            >
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dusty-pink pointer-events-none">
                <Lock size={16} />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`input-base pl-9 pr-10 w-full font-dm-sans ${
                  errors.password ? "border-red-400 focus:ring-red-300" : ""
                }`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dusty-pink hover:text-plum transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="font-dm-sans text-xs text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Forgot password note */}
          <p className="font-dm-sans text-xs text-center" style={{ color: "#9e7a84" }}>
            Forgot your password?{" "}
            <span className="text-dusty-pink font-medium">
              Contact us via Instagram to reset your password.
            </span>
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 font-dm-sans font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 my-6">
          <span className="flex-1 h-px bg-soft-line" />
          <span className="font-dm-sans text-xs" style={{ color: "#c4a0ab" }}>
            or
          </span>
          <span className="flex-1 h-px bg-soft-line" />
        </div>

        {/* ── Sign up link ── */}
        <p className="font-dm-sans text-sm text-center" style={{ color: "#9e7a84" }}>
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="text-dusty-pink font-semibold hover:text-plum transition-colors underline underline-offset-2"
          >
            Sign up
          </Link>
        </p>
      </div>

      {/* ── Footer note ── */}
      <p className="font-dm-sans text-xs mt-6" style={{ color: "#b8929e" }}>
        &copy; {new Date().getFullYear()} MANASARA. All rights reserved.
      </p>
    </div>
  );
}
