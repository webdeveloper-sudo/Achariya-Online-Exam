"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Key,
  ShieldCheck,
  Mail,
  Loader
} from "lucide-react";

type Step = "IDENTIFY" | "OTP" | "PASSWORD" | "SUCCESS";

export default function TeacherActivate() {
  const router = useRouter();

  // Wizard Steps
  const [step, setStep] = useState<Step>("IDENTIFY");
  const [identifier, setIdentifier] = useState("");
  const [teacherInfo, setTeacherInfo] = useState<any>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);

  // Focus helper for OTP inputs
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Verify Profile
      const verifyRes = await fetch("/api/teacher/auth/verify-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.message || "Profile not registered. Please contact Admin.");
      }

      setTeacherInfo(verifyData.teacher);
      
      // 2. Dispatch OTP
      const otpRes = await fetch("/api/teacher/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
      });

      const otpData = await otpRes.json();

      if (otpRes.ok) {
        setOtpTimer(60);
        if (otpData.devOtp) {
          setSimulatedOtp(otpData.devOtp); // Simulation mode OTP
        }
        setStep("OTP");
      } else {
        throw new Error(otpData.message || "Failed to deliver verification code.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError(null);
    setSimulatedOtp(null);
    setOtp(["", "", "", "", "", ""]);
    try {
      const otpRes = await fetch("/api/teacher/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
      });

      const otpData = await otpRes.json();

      if (otpRes.ok) {
        setOtpTimer(60);
        if (otpData.devOtp) {
          setSimulatedOtp(otpData.devOtp);
        }
      } else {
        throw new Error(otpData.message || "Failed to resend code.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length < 6) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/teacher/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp: otpString })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Incorrect verification code.");
      }

      setStep("PASSWORD");
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const otpString = otp.join("");
      const res = await fetch("/api/teacher/auth/complete-activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp: otpString, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Activation failed.");
      }

      // Automatically sign in teacher
      localStorage.setItem("teacherToken", data.token);
      localStorage.setItem("teacherUser", JSON.stringify(data.user));

      setStep("SUCCESS");
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Back Link */}
        {step !== "SUCCESS" && (
          <div className="text-left">
            <Link
              href="/teacher/login"
              className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Back to Educator Sign In
            </Link>
          </div>
        )}

        {/* Wizard Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Educator Activation</h2>
          <p className="text-sm text-slate-400 mt-2">
            Register your master credentials and claim your educator account.
          </p>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex items-center justify-between px-12 py-2">
          {["IDENTIFY", "OTP", "PASSWORD", "SUCCESS"].map((s, idx) => {
            const isCompleted =
              step === "SUCCESS" ||
              (step === "PASSWORD" && idx < 2) ||
              (step === "OTP" && idx < 1);
            const isActive = step === s;

            return (
              <div key={s} className="flex items-center relative">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20"
                      : isCompleted
                      ? "bg-emerald-400/20 border border-emerald-400 text-emerald-400"
                      : "bg-slate-900 border border-white/5 text-slate-500"
                  }`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                {idx < 3 && (
                  <div className="absolute left-7 w-[48px] h-[1px] bg-slate-850 pointer-events-none hidden" />
                )}
              </div>
            );
          })}
        </div>

        {/* Card Frame */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-sm">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: IDENTIFY */}
          {step === "IDENTIFY" && (
            <form onSubmit={handleIdentify} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Step 1: Identify Profile</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered institutional Email Address or Employee ID assigned by the administrator.
                </p>
                <div className="relative pt-2">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder-slate-700"
                    placeholder="Email Address or Employee ID"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-600/10"
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" /> Verifying Profile...
                  </>
                ) : (
                  <>
                    Request Verification OTP <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Step 2: Authenticate OTP</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We've sent a 6-digit confirmation key to the email registered for your profile:{" "}
                  <span className="font-bold text-emerald-400">
                    {teacherInfo?.email ? (
                      (() => {
                        const parts = teacherInfo.email.split("@");
                        return parts[0].slice(0, 3) + "***@" + parts[1];
                      })()
                    ) : (
                      "your email"
                    )}
                  </span>. Please key it in below.
                </p>

                {/* Dev Mode Simulated OTP Alert */}
                {simulatedOtp && (
                  <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-3 my-4">
                    <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="text-xs text-emerald-300">
                      <p className="font-bold">Development Simulation Mode</p>
                      <p className="mt-1">
                        Use Simulated Activation Key: <span className="font-mono font-black text-white bg-slate-950 px-2 py-0.5 rounded text-sm tracking-widest">{simulatedOtp}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Numeric Input Boxes */}
                <div className="flex justify-between gap-2 pt-4">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpRefs[idx]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-full h-12 text-center text-lg font-bold bg-slate-950 border border-white/5 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                    />
                  ))}
                </div>

                {/* Resend Actions */}
                <div className="text-center pt-4">
                  {otpTimer > 0 ? (
                    <p className="text-xs text-slate-500 font-medium">
                      Resend code in {otpTimer}s
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-xs font-bold text-emerald-400 hover:underline"
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("IDENTIFY")}
                  className="px-4 py-3 bg-slate-950 border border-white/5 text-slate-400 rounded-xl hover:bg-slate-800 transition-colors shrink-0"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.join("").length < 6}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {loading ? "Authenticating..." : "Verify Code"}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SET PASSWORD */}
          {step === "PASSWORD" && (
            <form onSubmit={handleSetPassword} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Step 3: Secure Educator Credentials</h3>
                <p className="text-xs text-slate-400">
                  Establish a secure entrance password for your educator dashboard.
                </p>

                <div className="space-y-4 pt-3">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter New Password (min 6 chars)"
                      className="w-full bg-slate-950/80 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-white"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      className="w-full bg-slate-950/80 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-white"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || password.length < 6 || password !== confirmPassword}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-600/10"
              >
                {loading ? (
                  "Finalizing claim..."
                ) : (
                  <>
                    Complete Activation <Key size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === "SUCCESS" && (
            <div className="text-center space-y-6 py-4 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black">Portal Claimed!</h2>
                <p className="text-sm text-slate-400 px-4 leading-relaxed">
                  Excellent! Your educator profile has been successfully activated. Welcome to the Achariya Assessment Panel.
                </p>
              </div>
              <button
                onClick={() => router.push("/teacher/dashboard")}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-emerald-600/20 transition-all text-sm shadow-lg"
              >
                Go to Educator Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
