"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock, AlertTriangle, RefreshCw, CheckCircle2, Trophy,
  ChevronRight, ShieldAlert, Award, FileText, ArrowRight, CornerDownRight, Maximize
} from "lucide-react";

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface Assessment {
  id: string;
  title: string;
  duration: number;
  subject: string;
  lesson: string;
  questions: any;
  createdByTeacherName: string;
}

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  grade: string;
  section: string;
  studentId: string;
  score: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  tabSwitches: number;
}

export default function StudentLivePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  // Connection & Core states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"WAITING" | "ACTIVE" | "COMPLETED" | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(30); // in minutes
  const [reconnecting, setReconnecting] = useState(false);

  // Student Identity & Progress
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<{
    name: string; grade: string; section: string; studentId: string;
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  // Fullscreen enforcement
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);

  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Join form states
  const [formName, setFormName] = useState("");
  const [formGrade, setFormGrade] = useState("");
  const [formSection, setFormSection] = useState("");
  const [formStudentId, setFormStudentId] = useState("");
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Time tracking
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Refs for tracking changes
  const answersRef = useRef<Record<string, string>>({});
  const tabSwitchesRef = useRef<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update refs when state changes
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    tabSwitchesRef.current = tabSwitches;
  }, [tabSwitches]);

  // Restores student identity and cached answers from localStorage
  useEffect(() => {
    if (!token) return;
    const localDataStr = localStorage.getItem(`live_student_${token}`);
    if (localDataStr) {
      try {
        const data = JSON.parse(localDataStr);
        if (data.participantId && data.studentInfo) {
          setParticipantId(data.participantId);
          setStudentInfo(data.studentInfo);
          if (data.answers) {
            setAnswers(data.answers);
          }
          if (data.tabSwitches) {
            setTabSwitches(data.tabSwitches);
          }
        }
      } catch (e) {
        console.error("Error loading localStorage data", e);
      }
    }
  }, [token]);

  // Initial session status retrieval
  useEffect(() => {
    if (!token) return;
    fetchSessionStatus();
  }, [token]);

  // Polling — replaces SSE. Checks /status every 3s.
  // Detects WAITING→ACTIVE and ACTIVE→COMPLETED transitions.
  const pollSession = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/live/${token}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setReconnecting(false);

      if (data.status === "ACTIVE" && sessionStatus === "WAITING") {
        setStartedAt(data.startedAt);
        setDuration(data.assessment?.duration || 30);
        setSessionStatus("ACTIVE");
      } else if (data.status === "COMPLETED" && sessionStatus !== "COMPLETED") {
        // Build leaderboard from participants
        const sorted = [...(data.participants || [])].sort((a: any, b: any) => {
          const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
          if (scoreDiff !== 0) return scoreDiff;
          return (a.timeTakenSeconds ?? Infinity) - (b.timeTakenSeconds ?? Infinity);
        });
        const lb = sorted.map((p: any, idx: number) => ({
          rank: idx + 1, id: p.id, name: p.name, grade: p.grade,
          section: p.section, studentId: p.studentId,
          score: p.score ?? 0, totalQuestions: p.totalQuestions ?? 0,
          timeTakenSeconds: p.timeTakenSeconds ?? 0, tabSwitches: p.tabSwitches ?? 0,
        }));
        setLeaderboard(lb);
        setSessionStatus("COMPLETED");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      setReconnecting(true);
    }
  }, [token, sessionStatus]);

  useEffect(() => {
    if (!token || !sessionStatus || sessionStatus === "COMPLETED") return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(pollSession, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token, sessionStatus, pollSession]);

  // Fetch session status function
  const fetchSessionStatus = async () => {
    try {
      const res = await fetch(`/api/live/${token}/status`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load session details.");
      }
      setSessionStatus(data.status);
      setAssessment(data.assessment);
      setStartedAt(data.startedAt);
      setDuration(data.assessment?.duration || 30);

      if (data.status === "COMPLETED") {
        // Derive leaderboard
        const sorted = [...(data.participants || [])].sort((a: any, b: any) => {
          const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
          if (scoreDiff !== 0) return scoreDiff;
          return (a.timeTakenSeconds ?? Infinity) - (b.timeTakenSeconds ?? Infinity);
        });
        const formattedLeaderboard = sorted.map((p: any, idx: number) => ({
          rank: idx + 1,
          id: p.id,
          name: p.name,
          grade: p.grade,
          section: p.section,
          studentId: p.studentId,
          score: p.score ?? 0,
          totalQuestions: p.totalQuestions ?? 0,
          timeTakenSeconds: p.timeTakenSeconds ?? 0,
          tabSwitches: p.tabSwitches ?? 0,
        }));
        setLeaderboard(formattedLeaderboard);
      }
      setLoading(false);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
      setLoading(false);
    }
  };

  // Timer Countdown Logic
  useEffect(() => {
    if (sessionStatus !== "ACTIVE" || !startedAt) {
      setTimeLeft(null);
      return;
    }

    const durationSeconds = duration * 60;
    const startMs = new Date(startedAt).getTime();

    const interval = setInterval(() => {
      const nowMs = Date.now();
      const elapsedSeconds = Math.floor((nowMs - startMs) / 1000);
      const remaining = durationSeconds - elapsedSeconds;

      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        handleAutoSubmit();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStatus, startedAt, duration]);

  // Tab switch warn logic (Tab Lock Behavior)
  useEffect(() => {
    if (sessionStatus !== "ACTIVE" || !participantId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerTabSwitch();
      }
    };

    const handleWindowBlur = () => {
      registerTabSwitch();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [sessionStatus, participantId]);

  const registerTabSwitch = async () => {
    setTabSwitches((prev) => prev + 1);
    setShowWarning(true);

    // Save locally
    saveToLocalState(answersRef.current, tabSwitchesRef.current + 1);

    // Notify backend
    try {
      await fetch(`/api/live/${token}/tabevent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
    } catch (e) {
      console.error("Failed to log tab switch on server", e);
    }
  };

  // Save to localStorage every 10s and on answer changes
  const saveToLocalState = (currentAnswers: Record<string, string>, currentTabs: number) => {
    if (!token || !participantId || !studentInfo) return;
    localStorage.setItem(
      `live_student_${token}`,
      JSON.stringify({
        participantId,
        studentInfo,
        answers: currentAnswers,
        tabSwitches: currentTabs,
      })
    );
  };

  // Auto-save intervals
  useEffect(() => {
    if (sessionStatus !== "ACTIVE") return;
    const interval = setInterval(() => {
      saveToLocalState(answersRef.current, tabSwitchesRef.current);
    }, 10000);
    return () => clearInterval(interval);
  }, [sessionStatus, participantId, studentInfo]);

  // Intercept beforeunload
  useEffect(() => {
    if (sessionStatus !== "ACTIVE") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Leaving will lose connection but progress is saved locally. Stay on this page!";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionStatus]);

  // ── Fullscreen helpers ─────────────────────────────────────────────────────
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setShowFullscreenWarning(false);
    } catch {
      // Browser denied (e.g. iframe) — non-fatal, exam still works
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
  };

  // Detect ESC / any programmatic fullscreen exit
  useEffect(() => {
    const handleFSChange = () => {
      const nowFS = !!document.fullscreenElement;
      setIsFullscreen(nowFS);

      // If exited fullscreen while exam is live → block + log integrity
      if (!nowFS && participantId && (sessionStatus === "WAITING" || sessionStatus === "ACTIVE")) {
        setShowFullscreenWarning(true);
        // During active exam, also count as a tab switch
        if (sessionStatus === "ACTIVE") {
          registerTabSwitch();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, participantId]);
  // ─────────────────────────────────────────────────────────────────────────

  // Handles joining
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formGrade.trim() || !formSection.trim() || !formStudentId.trim()) {
      setJoinError("Please fill out all required fields.");
      return;
    }
    setSubmittingJoin(true);
    setJoinError(null);

    try {
      const res = await fetch(`/api/live/${token}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          grade: formGrade,
          section: formSection,
          studentId: formStudentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to join live session.");
      }

      const pId = data.participantId;
      const sInfo = {
        name: formName,
        grade: formGrade,
        section: formSection,
        studentId: formStudentId,
      };

      setParticipantId(pId);
      setStudentInfo(sInfo);

      // Save to localStorage
      localStorage.setItem(
        `live_student_${token}`,
        JSON.stringify({
          participantId: pId,
          studentInfo: sInfo,
          answers: {},
          tabSwitches: 0,
        })
      );

      // Enter fullscreen — this must be triggered by user gesture (form submit = valid gesture)
      await enterFullscreen();
    } catch (err: any) {
      setJoinError(err.message || "Could not join session.");
    } finally {
      setSubmittingJoin(false);
    }
  };

  // Submit test manual or auto
  const handleManualSubmit = async () => {
    if (!confirm("Are you sure you want to submit your assessment? This cannot be undone.")) return;
    await submitAssessment();
  };

  const handleAutoSubmit = async () => {
    await submitAssessment();
  };

  const submitAssessment = async () => {
    if (!participantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/live/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          answers: answersRef.current,
          tabSwitches: tabSwitchesRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit assessment.");
      }
      // Exit fullscreen on submit — exam is done
      exitFullscreen();
      // Re-fetch to transition correctly to COMPLETED or Waiting for results
      fetchSessionStatus();
    } catch (e: any) {
      alert("Failed to submit: " + e.message);
      setLoading(false);
    }
  };

  // Render correct format of remaining time
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <RefreshCw className="animate-spin text-emerald-400 mb-4" size={40} />
        <p className="text-sm font-medium text-slate-400">Syncing live session context...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="max-w-md w-full bg-slate-900 border border-white/5 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-xl font-black text-white">Session Unavailable</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
          <button onClick={fetchSessionStatus} className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-sm transition-all">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // 1. JOIN FORM FLOW
  if (!participantId) {
    if (sessionStatus === "ACTIVE") {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
          <div className="max-w-md w-full bg-slate-900 border border-white/5 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-xl font-black text-white">Assessment in Progress</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Subsequent visits to this session after the assessment has started are not permitted. Entry is locked.
            </p>
            <button onClick={() => router.push("/")} className="w-full bg-white/5 hover:bg-white/10 border border-white/5 py-3 rounded-xl font-bold text-sm text-slate-300 transition-all">
              Return Home
            </button>
          </div>
        </div>
      );
    }

    if (sessionStatus === "COMPLETED") {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
          <div className="max-w-md w-full bg-slate-900 border border-white/5 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Award size={24} />
            </div>
            <h2 className="text-xl font-black text-white">Session has Ended</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              This conducted assessment is complete and the host has closed the exam.
            </p>
            <button onClick={() => router.push("/")} className="w-full bg-white/5 hover:bg-white/10 border border-white/5 py-3 rounded-xl font-bold text-sm text-slate-300 transition-all">
              Return Home
            </button>
          </div>
        </div>
      );
    }

    // WAITING - Render join form
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex relative overflow-hidden items-center justify-center p-6">
        <div className="absolute top-0 left-[-10%] w-[50%] h-[40%] rounded-full bg-indigo-900/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[130px] pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-8 space-y-6 shadow-2xl relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 items-center justify-center text-indigo-400 mb-2">
              <FileText size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">Live Assessment Portal</h2>
            <p className="text-xs text-slate-400">Join the live session hosted by <span className="font-bold text-emerald-400">{assessment?.createdByTeacherName}</span></p>
          </div>

          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Assessment</p>
              <h3 className="text-sm font-bold text-slate-200 truncate mt-0.5 max-w-[200px]">{assessment?.title}</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Duration</p>
              <h3 className="text-sm font-bold text-emerald-400 mt-0.5">{assessment?.duration} Mins</h3>
            </div>
          </div>

          {joinError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <p>{joinError}</p>
            </div>
          )}

          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Full Name</label>
              <input
                required
                type="text"
                placeholder="Enter your registered full name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Grade / Class</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Grade 10"
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Section</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. A"
                  value={formSection}
                  onChange={(e) => setFormSection(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Student ID / Roll No</label>
              <input
                required
                type="text"
                placeholder="Enter your institution Student ID"
                value={formStudentId}
                onChange={(e) => setFormStudentId(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-bold"
              />
            </div>

            <button
              disabled={submittingJoin}
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all disabled:opacity-50"
            >
              {submittingJoin ? "Entering Live Session..." : "Join Waiting Room"}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. STUDENT WAITING ROOM
  if (sessionStatus === "WAITING") {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex relative overflow-hidden items-center justify-center p-6">
        <div className="absolute top-0 left-[-10%] w-[50%] h-[40%] rounded-full bg-indigo-900/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[130px] pointer-events-none" />

        {/* Fullscreen warning overlay for waiting room */}
        {showFullscreenWarning && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <div className="max-w-sm w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-amber-500/5">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Maximize size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-amber-400">Fullscreen Required</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  This exam must be taken in fullscreen mode. Please return to fullscreen to continue waiting.
                </p>
              </div>
              <button
                onClick={enterFullscreen}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
              >
                <Maximize size={16} /> Return to Fullscreen
              </button>
            </div>
          </div>
        )}

        <div className="max-w-md w-full bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-8 text-center space-y-6 shadow-2xl relative z-10">
          {reconnecting && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs py-2 px-4 rounded-xl inline-flex items-center gap-2 mx-auto animate-pulse">
              <RefreshCw className="animate-spin" size={12} />
              Reconnecting to terminal stream...
            </div>
          )}

          <div className="mx-auto h-20 w-20 relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-emerald-500/15 opacity-75"></span>
            <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
              <RefreshCw className="animate-spin" size={28} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Live Waiting Room</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Welcome <span className="font-extrabold text-white">{studentInfo?.name}</span>. You have successfully entered the queue. Waiting for your teacher to initiate the assessment.
            </p>
          </div>

          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 divide-y divide-white/5 text-left text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Student Name</span>
              <span className="font-bold text-slate-300">{studentInfo?.name}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Grade / Section</span>
              <span className="font-bold text-slate-300">{studentInfo?.grade} - {studentInfo?.section}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Student ID</span>
              <span className="font-bold text-slate-300">{studentInfo?.studentId}</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic">Please stay on this page. Leaving may require you to re-register.</p>
        </div>
      </div>
    );
  }

  // 3. LIVE ASSESSMENT TAKING (STUDENT VIEW)
  if (sessionStatus === "ACTIVE") {
    const questions = Array.isArray(assessment?.questions)
      ? assessment?.questions
      : JSON.parse(assessment?.questions || "[]");

    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col relative overflow-x-hidden">

        {/* Fullscreen exit warning — highest priority overlay */}
        {showFullscreenWarning && !showWarning && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <div className="max-w-sm w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-amber-500/5">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Maximize size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-amber-400">Fullscreen Exited — Integrity Alert</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Exiting fullscreen has been recorded as a security violation. You must return to fullscreen to continue the assessment.
                </p>
                <p className="text-xs text-rose-400 font-bold">Tab switches so far: {tabSwitches}</p>
              </div>
              <button
                onClick={enterFullscreen}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
              >
                <Maximize size={16} /> Re-enter Fullscreen to Continue
              </button>
            </div>
          </div>
        )}

        {/* Tab switch warning overlay */}
        {showWarning && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-slate-900 border border-rose-500/20 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-rose-500/5">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-rose-400">Security / Tab Intercept Alert</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Please stay on this assessment tab. Leaving or switching applications is monitored and may result in immediate disqualification.
                </p>
                <p className="text-xs text-rose-400 font-bold">Violation count: {tabSwitches}</p>
              </div>
              <button
                onClick={() => setShowWarning(false)}
                className="w-full bg-rose-600 hover:bg-rose-500 py-3.5 rounded-xl font-bold text-sm transition-all"
              >
                I Understand, Return to Test
              </button>
            </div>
          </div>
        )}

        {/* Top Navbar */}
        <header className="sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-white/5 p-4 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black truncate max-w-[200px] sm:max-w-xs">{assessment?.title}</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">{studentInfo?.name} ({studentInfo?.grade}-{studentInfo?.section})</p>
            </div>

            <div className="flex items-center gap-4">
              {reconnecting && (
                <div className="hidden md:flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl animate-pulse">
                  <RefreshCw className="animate-spin" size={12} />
                  Reconnecting...
                </div>
              )}

              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                timeLeft !== null && timeLeft < 60
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse font-black"
                  : "bg-slate-950 border-white/5 text-emerald-400"
              }`}>
                <Clock size={16} />
                <span className="text-sm font-mono tracking-wider font-bold">
                  {timeLeft !== null ? formatTime(timeLeft) : "00:00"}
                </span>
              </div>

              <button
                onClick={handleManualSubmit}
                className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </header>

        {/* Exam content */}
        <main className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-400">
            <ShieldAlert className="text-amber-500 shrink-0" size={16} />
            <p>Tab lock active. Leaving this window is recorded. Progress auto-saves every 10 seconds.</p>
          </div>

          <div className="space-y-6 pb-20">
            {questions.map((q: Question, idx: number) => (
              <div key={q.id || idx} className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {q.type.replace("_", " ")}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 leading-relaxed">{q.question}</h3>

                {(q.type === "multiple_choice" || q.type === "true_false") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(q.options && q.options.length > 0 ? q.options : ["True", "False"]).map((opt: string, optIdx: number) => {
                      const optLabel = String.fromCharCode(65 + optIdx);
                      const isSelected = answers[q.id] === opt;

                      return (
                        <button
                          key={optIdx}
                          onClick={() => {
                            const newAnswers = { ...answers, [q.id]: opt };
                            setAnswers(newAnswers);
                            saveToLocalState(newAnswers, tabSwitches);
                          }}
                          className={`flex items-center gap-3 text-left p-4 rounded-2xl border text-sm font-medium transition-all ${
                            isSelected
                              ? "bg-indigo-600/10 border-indigo-500/40 text-white font-bold ring-4 ring-indigo-500/10"
                              : "bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200"
                          }`}
                        >
                          <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-black ${
                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-500 border border-white/5"
                          }`}>
                            {optLabel}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === "short_answer" && (
                  <div className="w-full">
                    <input
                      type="text"
                      value={answers[q.id] || ""}
                      onChange={(e) => {
                        const newAnswers = { ...answers, [q.id]: e.target.value };
                        setAnswers(newAnswers);
                        saveToLocalState(newAnswers, tabSwitches);
                      }}
                      placeholder="Type your answer here..."
                      className="w-full bg-slate-950/60 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-bold"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // 4. SUBMITTED - WAITING FOR RESULTS / LEADERBOARD
  if (sessionStatus === "COMPLETED") {
    const myRank = leaderboard.find((p) => p.studentId === studentInfo?.studentId);

    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-[-10%] w-[50%] h-[40%] rounded-full bg-emerald-900/5 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/5 blur-[130px] pointer-events-none" />

        <div className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col md:flex-row gap-8 items-center justify-center relative z-10 py-12">
          {/* Submission confirmation Card */}
          <div className="w-full md:w-5/12 bg-slate-900/60 border border-white/5 rounded-3xl p-8 space-y-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/5">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Assessment Submitted</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Thank you. Your responses have been processed and fully graded.
              </p>
            </div>

            {myRank && (
              <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Your Score</span>
                  <span className="font-black text-emerald-400 text-sm">{myRank.score} / {myRank.totalQuestions}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Accuracy</span>
                  <span className="font-bold text-slate-200">
                    {myRank.totalQuestions > 0 ? Math.round((myRank.score / myRank.totalQuestions) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Time Taken</span>
                  <span className="font-bold text-slate-200">
                    {Math.floor(myRank.timeTakenSeconds / 60)}m {myRank.timeTakenSeconds % 60}s
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                localStorage.removeItem(`live_student_${token}`);
                router.push("/");
              }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/5 py-3 rounded-xl text-slate-300 font-bold text-sm transition-all"
            >
              Exit Terminal
            </button>
          </div>

          {/* Leaderboard Card */}
          <div className="w-full md:w-7/12 bg-slate-900/60 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="font-black text-lg">Class Leaderboard</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Live graded and ranked classroom results</p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {leaderboard.map((student, idx) => {
                const isMe = student.studentId === studentInfo?.studentId;
                const formattedTime = `${Math.floor(student.timeTakenSeconds / 60)}:${(student.timeTakenSeconds % 60).toString().padStart(2, "0")}`;

                return (
                  <div
                    key={student.id || idx}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isMe
                        ? "bg-indigo-500/15 border-indigo-500/30 text-white shadow-lg shadow-indigo-500/5 ring-2 ring-indigo-500/20"
                        : "bg-slate-950/40 border-white/5 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        idx === 0 ? "bg-amber-500 text-slate-950" :
                        idx === 1 ? "bg-slate-300 text-slate-950" :
                        idx === 2 ? "bg-amber-750 text-white" :
                        "bg-slate-900 text-slate-500"
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isMe ? "text-white" : "text-slate-200"}`}>{student.name}</p>
                        <p className="text-[9px] text-slate-500 truncate mt-0.5">ID: {student.studentId} · Class {student.grade}-{student.section}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-xs font-black ${isMe ? "text-emerald-400" : "text-emerald-500"}`}>{student.score} / {student.totalQuestions}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">Time: {formattedTime}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
