import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------
const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(80, "Full name is too long"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[6-9]\d{9}$/.test(val),
        "Please enter a valid 10-digit Indian mobile number"
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

// ---------------------------------------------------------------------------
// Password strength helper
// ---------------------------------------------------------------------------
function getPasswordStrength(password: string): {
  score: number; // 0–4
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map: Record<number, { label: string; color: string }> = {
    1: { label: "Weak", color: "#ef4444" },
    2: { label: "Fair", color: "#f59e0b" },
    3: { label: "Good", color: "#84cc16" },
    4: { label: "Strong", color: "#22c55e" },
  };

  return { score, ...(map[score] ?? { label: "Weak", color: "#ef4444" }) };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SignupPage() {
  const { signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [watchedPassword, setWatchedPassword] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/account", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  // Track password for strength indicator
  useEffect(() => {
    const subscription = watch((values) => {
      setWatchedPassword(values.password ?? "");
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  async function onSubmit(values: SignupFormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const { error } = await signUp(
        values.email,
        values.password,
        values.fullName,
        values.phone || undefined
      );
      if (error) {
        if (error.message?.toLowerCase().includes("already registered")) {
          setServerError(
            "An account with this email already exists. Try logging in instead."
          );
        } else {
          setServerError(error.message ?? "Something went wrong. Please try again.");
        }
      } else {
        setSignupSuccess(true);
      }
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // While checking auth state, avoid flash
  if (authLoading) return null;

  // ── Success screen ──
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center px-4 py-12">
        <div className="card-surface w-full max-w-md px-8 py-10 rounded-2xl shadow-sm border border-soft-line flex flex-col items-center text-center gap-5">
          <span className="text-5xl select-none" aria-hidden="true">🌸</span>
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 size={48} className="text-muted-leaf" />
            <h2 className="font-fraunces editorial-md text-plum">
              Almost there!
            </h2>
            <p className="font-dm-sans text-sm" style={{ color: "#9e7a84" }}>
              We've sent a verification link to your email address. Please check
              your inbox (and spam folder) and click the link to activate your
              account.
            </p>
          </div>
          <div
            className="w-full rounded-xl px-4 py-3 font-dm-sans text-sm"
            style={{ background: "#F6E8EC", color: "#7a4f5c" }}
          >
            Once verified, you can{" "}
            <Link
              to="/login"
              className="text-dusty-pink font-semibold hover:text-plum transition-colors underline underline-offset-2"
            >
              sign in here
            </Link>
            .
          </div>
        </div>
      </div>
    );
  }

  const strength = getPasswordStrength(watchedPassword);

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
          Create your account
        </h2>
        <p className="font-dm-sans text-sm text-center mb-7" style={{ color: "#9e7a84" }}>
          Join MANASARA and discover handcrafted treasures
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
          {/* Full Name */}
          <div className="space-y-1">
            <label
              htmlFor="fullName"
              className="label-sm font-dm-sans text-plum font-medium"
            >
              Full name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dusty-pink pointer-events-none">
                <User size={16} />
              </span>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Priya Sharma"
                className={`input-base pl-9 w-full font-dm-sans ${
                  errors.fullName ? "border-red-400 focus:ring-red-300" : ""
                }`}
                {...register("fullName")}
              />
            </div>
            {errors.fullName && (
              <p className="font-dm-sans text-xs text-red-500 mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>

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

          {/* Mobile Number (optional) */}
          <div className="space-y-1">
            <label
              htmlFor="phone"
              className="label-sm font-dm-sans text-plum font-medium"
            >
              Mobile number{" "}
              <span className="font-normal" style={{ color: "#b8929e" }}>
                (optional)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dusty-pink pointer-events-none">
                <Phone size={16} />
              </span>
              {/* India flag + dial code */}
              <span
                className="absolute left-9 top-1/2 -translate-y-1/2 font-dm-sans text-sm select-none pointer-events-none"
                style={{ color: "#9e7a84" }}
              >
                🇮🇳 +91
              </span>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                maxLength={10}
                placeholder="98765 43210"
                className={`input-base pl-24 w-full font-dm-sans ${
                  errors.phone ? "border-red-400 focus:ring-red-300" : ""
                }`}
                {...register("phone")}
              />
            </div>
            {errors.phone ? (
              <p className="font-dm-sans text-xs text-red-500 mt-1">
                {errors.phone.message}
              </p>
            ) : (
              <p className="font-dm-sans text-xs mt-1" style={{ color: "#b8929e" }}>
                Used to link your past orders
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
                autoComplete="new-password"
                placeholder="Min. 8 characters"
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

            {/* Password strength bar */}
            {watchedPassword.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((segment) => (
                    <div
                      key={segment}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        background:
                          strength.score >= segment
                            ? strength.color
                            : "#EADFE0",
                      }}
                    />
                  ))}
                </div>
                {strength.label && (
                  <p
                    className="font-dm-sans text-xs font-medium"
                    style={{ color: strength.color }}
                  >
                    {strength.label} password
                  </p>
                )}
              </div>
            )}

            {errors.password && (
              <p className="font-dm-sans text-xs text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label
              htmlFor="confirmPassword"
              className="label-sm font-dm-sans text-plum font-medium"
            >
              Confirm password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dusty-pink pointer-events-none">
                <Lock size={16} />
              </span>
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className={`input-base pl-9 pr-10 w-full font-dm-sans ${
                  errors.confirmPassword ? "border-red-400 focus:ring-red-300" : ""
                }`}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dusty-pink hover:text-plum transition-colors"
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="font-dm-sans text-xs text-red-500 mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Terms note */}
          <p className="font-dm-sans text-xs text-center" style={{ color: "#b8929e" }}>
            By creating an account, you agree to our{" "}
            <span className="text-dusty-pink font-medium">Terms of Service</span> and{" "}
            <span className="text-dusty-pink font-medium">Privacy Policy</span>.
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
                Creating account…
              </>
            ) : (
              <>
                Create account
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

        {/* ── Login link ── */}
        <p className="font-dm-sans text-sm text-center" style={{ color: "#9e7a84" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-dusty-pink font-semibold hover:text-plum transition-colors underline underline-offset-2"
          >
            Log in
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
