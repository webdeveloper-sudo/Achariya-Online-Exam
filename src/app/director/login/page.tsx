"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Shield, AlertCircle, HelpCircle } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function DirectorLogin() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const toastId = toast.loading("Verifying credentials...");

    try {
      const res = await fetch("/api/director/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to log in");
      }

      // Save token and director details to localStorage
      localStorage.setItem("directorToken", data.token);
      localStorage.setItem("directorUser", JSON.stringify(data.user));

      toast.update(toastId, {
        type: "success",
        message: "Authentication successful! Redirecting...",
      });
      router.push("/director/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      toast.update(toastId, {
        type: "error",
        message: err.message || "Failed to log in",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden bg-transparent">
      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 bg-blue-600 flex items-center justify-center text-white mx-auto mb-4 shadow-md">
            <Shield size={30} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Director Assessment Terminal</h2>
          <p className="text-sm text-gray-600 mt-2">
            Sign in to compile evaluations and supervise active teacher live rooms.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-md border border-gray-300 p-8 shadow-xl space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Registered Director Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-none pl-12 pr-4 py-3 text-sm focus:border-blue-600 outline-none text-gray-900 placeholder-gray-400 font-semibold"
                  placeholder="e.g. director.la@achariya.org"
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
                  className="w-full bg-white border border-gray-300 rounded-none pl-12 pr-4 py-3 text-sm focus:border-blue-600 outline-none text-gray-900 placeholder-gray-400 font-semibold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loading ? "Verifying Credentials..." : "Enter Director Terminal"}
            </button>
          </form>

          {/* Seed accounts notice */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-none flex items-start gap-3">
            <HelpCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-900">Seeded Director Profile</p>
              <p>Email: <code className="text-blue-700 font-bold">director.la@achariya.org</code></p>
              <p>Password: <code className="text-blue-700 font-bold">password123</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
