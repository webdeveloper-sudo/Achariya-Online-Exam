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
    <div className="min-h-screen text-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden bg-transparent">
      <div className="w-full max-w-md relative z-10">
        
        {/* Back Link */}
        {/* <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 transition-colors font-bold"
          >
            <ArrowLeft size={14} className="text-[#C72323]" /> Back to Gateway Selection
          </Link>
        </div> */}

        {/* Brand Header */}
        <div className="text-center mb-8">
          {/* Logo box: sharp flat edges (no rounded corners) */}
          <div className="h-14 w-14 bg-[#C72323] flex items-center justify-center text-white mx-auto mb-4 shadow-md">
            <BookOpen size={32} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Educator Hub Gateway</h2>
          <p className="text-sm text-gray-600 mt-2">
            Sign in to create, schedule, and evaluate online examinations.
          </p>
        </div>

        {/* Login Card - flat no-radius style */}
        <div className="bg-white/80 backdrop-blur-md border border-gray-300 p-8 shadow-xl space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 flex items-center gap-3 text-[#C72323] text-sm">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12 pr-4 py-3 bg-white text-gray-900 placeholder-gray-400"
                  placeholder="sarah@achariya.org"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 pr-4 py-3 bg-white text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button - flat no-radius style */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#20407D] hover:bg-blue-800 text-white font-bold py-3.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loading ? "Authenticating Terminal..." : "Enter Educator Terminal"}
            </button>
          </form>

          {/* Onboarding Trigger Alert */}
          <div className="p-4 bg-gray-50 border border-gray-200 flex items-start gap-3">
            <HelpCircle size={18} className="text-[#20407D] shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 space-y-1.5">
              <p className="font-bold text-gray-800">First time logging in?</p>
              <p>Your profile must be onboarded by the administrator. Once added, activate your account below.</p>
              <Link
                href="/teacher/activate"
                className="inline-flex items-center gap-1 text-[#20407D] font-black hover:underline"
              >
                Activate Educator Account Now →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

