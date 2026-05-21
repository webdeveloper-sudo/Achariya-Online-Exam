"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowLeft, BookOpen, AlertCircle, HelpCircle } from "lucide-react";

export default function TeacherLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/teacher/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to log in");
      }

      // Save token and user details to localStorage
      localStorage.setItem("teacherToken", data.token);
      localStorage.setItem("teacherUser", JSON.stringify(data.user));

      router.push("/teacher/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back to Portal Selection
          </Link>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-lg shadow-emerald-500/5">
            <BookOpen size={30} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Educator Assessment Terminal</h2>
          <p className="text-sm text-slate-400 mt-2">
            Sign in to create, schedule, and evaluate online examinations.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-white placeholder-slate-600"
                  placeholder="e.g. sarah@achariya.org"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-white placeholder-slate-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/35 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? "Verifying Credentials..." : "Enter Educator Terminal"}
            </button>
          </form>

          {/* Onboarding Trigger Alert */}
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-3">
            <HelpCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1.5">
              <p className="font-bold text-slate-200">First time logging in?</p>
              <p>Your profile must be onboarded by the administrator. Once added, activate your account below.</p>
              <Link
                href="/teacher/activate"
                className="inline-flex items-center gap-1 text-emerald-400 font-bold hover:underline"
              >
                Activate Teacher Account Now →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
