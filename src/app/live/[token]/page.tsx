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

  // Lookup states
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [searchingLookup, setSearchingLookup] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isPrefilled, setIsPrefilled] = useState(false);
  const [isDuplicateFlow, setIsDuplicateFlow] = useState(false);

  // Time tracking
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Refs for tracking changes
  const answersRef = useRef<Record<string, string>>({});
  const tabSwitchesRef = useRef<number>(0);
  const lastSwitchTimeRef = useRef<number>(0);
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

    const preventCopy = (e: any) => e.preventDefault();
    const preventCut = (e: any) => e.preventDefault();
    const preventPaste = (e: any) => e.preventDefault();
    const preventContextMenu = (e: any) => e.preventDefault();
    const preventDrag = (e: any) => e.preventDefault();
    const preventSelect = (e: any) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
        return;
      }
      e.preventDefault();
    };

    const handleOrientationChange = () => {
      registerTabSwitch();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("copy", preventCopy);
    document.addEventListener("cut", preventCut);
    document.addEventListener("paste", preventPaste);
    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("dragstart", preventDrag);
    document.addEventListener("selectstart", preventSelect);
    window.addEventListener("orientationchange", handleOrientationChange);
    if (screen.orientation) {
      screen.orientation.addEventListener("change", handleOrientationChange);
    }

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("cut", preventCut);
      document.removeEventListener("paste", preventPaste);
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("dragstart", preventDrag);
      document.removeEventListener("selectstart", preventSelect);
      window.removeEventListener("orientationchange", handleOrientationChange);
      if (screen.orientation) {
        screen.orientation.removeEventListener("change", handleOrientationChange);
      }
    };
  }, [sessionStatus, participantId]);

  const registerTabSwitch = async () => {
    const now = Date.now();
    if (now - lastSwitchTimeRef.current < 1000) return;
    lastSwitchTimeRef.current = now;

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

      // Duplicate student detected — auto-open the lookup/retrieve modal
      if (res.status === 409 && data.duplicate) {
        setJoinError(null);
        setLookupQuery(formStudentId);
        setLookupError(null);
        setIsDuplicateFlow(true);
        setShowLookupModal(true);
        return;
      }

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

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) {
      setLookupError("Please enter your Student ID.");
      return;
    }
    setSearchingLookup(true);
    setLookupError(null);

    try {
      const res = await fetch(`/api/live/${token}/lookup?query=${encodeURIComponent(lookupQuery.trim())}`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Student profile not found.");
      }

      setFormName(data.student.name || "");
      setFormGrade(data.student.grade || "");
      setFormSection(data.student.section || "");
      setFormStudentId(data.student.studentId || "");

      setIsPrefilled(true);
      setShowLookupModal(false);
      setJoinError(null);
    } catch (err: any) {
      setLookupError(err.message || "No matching student profile found.");
    } finally {
      setSearchingLookup(false);
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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-700">
        <RefreshCw className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-sm font-medium text-gray-500">Syncing live session context...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-900 p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-none p-8 text-center space-y-4 shadow-sm">
          <div className="mx-auto h-12 w-12 rounded-none bg-red-50 border border-red-200 text-red-500 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-xl font-black text-gray-900">Session Unavailable</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{error}</p>
          <button onClick={fetchSessionStatus} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-none font-bold text-sm transition-all">
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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-900 p-6">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-none p-8 text-center space-y-4 shadow-sm">
            <div className="mx-auto h-12 w-12 rounded-none bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-xl font-black text-gray-900">Assessment in Progress</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Subsequent visits to this session after the assessment has started are not permitted. Entry is locked.
            </p>
            <button onClick={() => router.push("/")} className="w-full bg-white hover:bg-gray-50 border border-gray-300 py-3 rounded-none font-bold text-sm text-gray-700 transition-all shadow-sm">
              Return Home
            </button>
          </div>
        </div>
      );
    }

    if (sessionStatus === "COMPLETED") {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-900 p-6">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-none p-8 text-center space-y-4 shadow-sm">
            <div className="mx-auto h-12 w-12 rounded-none bg-red-50 border border-red-200 text-red-500 flex items-center justify-center">
              <Award size={24} />
            </div>
            <h2 className="text-xl font-black text-gray-900">Session has Ended</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              This conducted assessment is complete and the host has closed the exam.
            </p>
            <button onClick={() => router.push("/")} className="w-full bg-white hover:bg-gray-50 border border-gray-300 py-3 rounded-none font-bold text-sm text-gray-700 transition-all shadow-sm">
              Return Home
            </button>
          </div>
        </div>
      );
    }

    // WAITING - Render join form
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex relative overflow-hidden items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-none p-8 space-y-6 shadow-sm relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 rounded-none bg-blue-50 border border-blue-200 items-center justify-center text-blue-600 mb-2">
              <FileText size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">Live Assessment Portal</h2>
            <p className="text-xs text-gray-500">Join the live session hosted by <span className="font-bold text-emerald-600">{assessment?.createdByTeacherName}</span></p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-none p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Assessment</p>
              <h3 className="text-sm font-bold text-gray-700 truncate mt-0.5 max-w-[200px]">{assessment?.title}</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Duration</p>
              <h3 className="text-sm font-bold text-emerald-600 mt-0.5">{assessment?.duration} Mins</h3>
            </div>
          </div>

          {joinError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-none text-xs flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <p>{joinError}</p>
            </div>
          )}

          {isPrefilled && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-none text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
              <p>Profile retrieved! You can review or edit your details before joining.</p>
            </div>
          )}

          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Full Name</label>
              <input
                required
                type="text"
                placeholder="Enter your registered full name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-none px-4 py-3 text-sm focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-bold text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Grade / Class</label>
                <select
                  required
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-none px-4 py-3 text-sm focus:border-blue-600 outline-none transition-all font-bold text-gray-900 cursor-pointer"
                >
                  <option value="" disabled>Select Grade</option>
                  <option value="Grade I">Grade I</option>
                  <option value="Grade II">Grade II</option>
                  <option value="Grade III">Grade III</option>
                  <option value="Grade IV">Grade IV</option>
                  <option value="Grade V">Grade V</option>
                  <option value="Grade VI">Grade VI</option>
                  <option value="Grade VII">Grade VII</option>
                  <option value="Grade VIII">Grade VIII</option>
                  <option value="Grade IX">Grade IX</option>
                  <option value="Grade X">Grade X</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Section</label>
                <select
                  required
                  value={formSection}
                  onChange={(e) => setFormSection(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-none px-4 py-3 text-sm focus:border-blue-600 outline-none transition-all font-bold text-gray-900 cursor-pointer"
                >
                  <option value="" disabled>Select Section</option>
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                  <option value="Section C">Section C</option>
                  <option value="Section D">Section D</option>
                  <option value="Section E">Section E</option>
                  <option value="Section F">Section F</option>
                  <option value="Section G">Section G</option>
                  <option value="Section H">Section H</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Student ID / Roll No</label>
              <input
                required
                type="text"
                placeholder="Enter your institution Student ID"
                value={formStudentId}
                onChange={(e) => setFormStudentId(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-none px-4 py-3 text-sm focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-bold text-gray-900"
              />
            </div>

            <button
              disabled={submittingJoin}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white font-bold py-3.5 rounded-none text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {submittingJoin ? "Entering Live Session..." : "Join Waiting Room"}
              <ArrowRight size={16} />
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setLookupQuery("");
                  setLookupError(null);
                  setIsDuplicateFlow(false);
                  setShowLookupModal(true);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold transition-colors hover:underline cursor-pointer"
              >
                Already onboarded? Find Existing Profile
              </button>
            </div>
          </form>
        </div>

        {/* Lookup Modal Overlay */}
        {showLookupModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white border border-gray-200 rounded-none p-6 space-y-6 shadow-sm relative animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-black text-gray-900">Find Existing Profile</h3>
                <p className="text-xs text-gray-500">Enter your registered Student ID to pull up your profile details.</p>
              </div>

              {isDuplicateFlow && (
                <div className="p-3 bg-amber-50 border border-amber-300 text-amber-700 rounded-none text-xs flex items-start gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black">Account Already Registered</p>
                    <p className="mt-0.5">A student profile with this Student ID already exists. Enter your Student ID below to retrieve your account and join the waiting room.</p>
                  </div>
                </div>
              )}

              {lookupError && !isDuplicateFlow && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-none text-xs flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <p>{lookupError}</p>
                </div>
              )}

              <form onSubmit={handleLookupSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Student ID</label>
                  <input
                    required
                    type="text"
                    placeholder="Enter Student ID"
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-none px-4 py-3 text-sm focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 text-gray-900 font-bold"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLookupModal(false)}
                    className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 py-3 rounded-none text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={searchingLookup}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-none text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {searchingLookup ? (
                      <>
                        <RefreshCw className="animate-spin" size={12} />
                        Searching...
                      </>
                    ) : (
                      "Search Profile"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. STUDENT WAITING ROOM
  if (sessionStatus === "WAITING") {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex relative overflow-hidden items-center justify-center p-6">
        {/* Fullscreen warning overlay for waiting room */}
        {showFullscreenWarning && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <div className="max-w-sm w-full bg-white border border-amber-300 rounded-none p-8 text-center space-y-6 shadow-sm">
              <div className="mx-auto h-16 w-16 rounded-none bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <Maximize size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-amber-600">Fullscreen Required</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  This exam must be taken in fullscreen mode. Please return to fullscreen to continue waiting.
                </p>
              </div>
              <button
                onClick={enterFullscreen}
                className="w-full bg-amber-500 hover:bg-amber-400 text-white py-3.5 rounded-none font-black text-sm transition-all flex items-center justify-center gap-2"
              >
                <Maximize size={16} /> Return to Fullscreen
              </button>
            </div>
          </div>
        )}

        <div className="max-w-md w-full bg-white border border-gray-200 rounded-none p-8 text-center space-y-6 shadow-sm relative z-10">
          {reconnecting && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs py-2 px-4 rounded-none inline-flex items-center gap-2 mx-auto animate-pulse">
              <RefreshCw className="animate-spin" size={12} />
              Reconnecting to terminal stream...
            </div>
          )}

          <div className="mx-auto h-20 w-20 relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-16 w-16 rounded-none bg-blue-100 opacity-75"></span>
            <div className="h-16 w-16 bg-blue-50 border border-blue-200 rounded-none flex items-center justify-center text-blue-600">
              <RefreshCw className="animate-spin" size={28} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900">Live Waiting Room</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Welcome <span className="font-extrabold text-gray-900">{studentInfo?.name}</span>. You have successfully entered the queue. Waiting for your teacher to initiate the assessment.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-none p-4 divide-y divide-gray-100 text-left text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-gray-400">Student Name</span>
              <span className="font-bold text-gray-700">{studentInfo?.name}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-gray-400">Grade / Section</span>
              <span className="font-bold text-gray-700">{studentInfo?.grade} - {studentInfo?.section}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-gray-400">Student ID</span>
              <span className="font-bold text-gray-700">{studentInfo?.studentId}</span>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 italic">Please stay on this page. Leaving may require you to re-register.</p>
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
      <div className="min-h-screen bg-gray-50 font-sans flex flex-col relative overflow-x-hidden">

        {/* Fullscreen exit warning — highest priority overlay */}
        {showFullscreenWarning && !showWarning && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <div className="max-w-sm w-full bg-white border border-amber-300 rounded-none p-8 text-center space-y-6 shadow-sm">
              <div className="mx-auto h-16 w-16 rounded-none bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <Maximize size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-amber-600">Fullscreen Exited — Integrity Alert</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Exiting fullscreen has been recorded as a security violation. You must return to fullscreen to continue the assessment.
                </p>
                <p className="text-xs text-red-600 font-bold">Tab switches so far: {tabSwitches}</p>
              </div>
              <button
                onClick={enterFullscreen}
                className="w-full bg-amber-500 hover:bg-amber-400 text-white py-3.5 rounded-none font-black text-sm transition-all flex items-center justify-center gap-2"
              >
                <Maximize size={16} /> Re-enter Fullscreen to Continue
              </button>
            </div>
          </div>
        )}

        {/* Tab switch warning overlay */}
        {showWarning && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white border border-red-300 rounded-none p-8 text-center space-y-6 shadow-sm">
              <div className="mx-auto h-16 w-16 rounded-none bg-red-50 border border-red-200 text-red-500 flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-red-600">Security / Tab Intercept Alert</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Please stay on this assessment tab. Leaving or switching applications is monitored and may result in immediate disqualification.
                </p>
                <p className="text-xs text-red-600 font-bold">Violation count: {tabSwitches}</p>
              </div>
              <button
                onClick={() => setShowWarning(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-none font-bold text-sm transition-all"
              >
                I Understand, Return to Test
              </button>
            </div>
          </div>
        )}

        {/* Top Navbar */}
        <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200 p-4 z-40 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black truncate max-w-[200px] sm:max-w-xs text-gray-900">{assessment?.title}</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">{studentInfo?.name} ({studentInfo?.grade}-{studentInfo?.section})</p>
            </div>

            <div className="flex items-center gap-4">
              {reconnecting && (
                <div className="hidden md:flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-none animate-pulse">
                  <RefreshCw className="animate-spin" size={12} />
                  Reconnecting...
                </div>
              )}

              <div className={`flex items-center gap-2 px-4 py-2 rounded-none border ${
                timeLeft !== null && timeLeft < 60
                  ? "bg-red-50 border-red-200 text-red-600 animate-pulse font-black"
                  : "bg-gray-50 border-gray-200 text-blue-600"
              }`}>
                <Clock size={16} />
                <span className="text-sm font-mono tracking-wider font-bold">
                  {timeLeft !== null ? formatTime(timeLeft) : "00:00"}
                </span>
              </div>

              <button
                onClick={handleManualSubmit}
                className="bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white px-4 py-2 rounded-none text-xs font-bold transition-all shadow-sm"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </header>

        {/* Exam content */}
        <main className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-none p-4 flex items-center gap-3 text-xs text-amber-700">
            <ShieldAlert className="text-amber-500 shrink-0" size={16} />
            <p>Tab lock active. Leaving this window is recorded. Progress auto-saves every 10 seconds.</p>
          </div>

          <div className="space-y-6 pb-20">
            {questions.map((q: Question, idx: number) => (
              <div key={q.id || idx} className="bg-white border border-gray-200 rounded-none p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-none bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {q.type.replace("_", " ")}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 leading-relaxed">{q.question}</h3>

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
                          className={`flex items-center gap-3 text-left p-4 rounded-none border text-sm font-medium transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-400 text-gray-900 font-bold ring-2 ring-blue-200"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                          }`}
                        >
                          <span className={`h-6 w-6 rounded-none flex items-center justify-center text-xs font-black border ${
                            isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 text-gray-500 border-gray-200"
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
                      className="w-full bg-white border border-gray-300 rounded-none px-4 py-3 text-sm focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-bold text-gray-900"
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
      <div className="min-h-screen bg-gray-50 font-sans flex flex-col relative overflow-hidden">
        <div className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col md:flex-row gap-8 items-center justify-center relative z-10 py-12">
          {/* Submission confirmation Card */}
          <div className="w-full md:w-5/12 bg-white border border-gray-200 rounded-none p-8 space-y-6 text-center shadow-sm">
            <div className="mx-auto h-16 w-16 rounded-none bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">Assessment Submitted</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Thank you. Your responses have been processed and fully graded.
              </p>
            </div>

            {myRank && (
              <div className="bg-gray-50 border border-gray-200 rounded-none p-4 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Your Score</span>
                  <span className="font-black text-emerald-600 text-sm">{myRank.score} / {myRank.totalQuestions}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Accuracy</span>
                  <span className="font-bold text-gray-700">
                    {myRank.totalQuestions > 0 ? Math.round((myRank.score / myRank.totalQuestions) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Time Taken</span>
                  <span className="font-bold text-gray-700">
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
              className="w-full bg-white hover:bg-gray-50 border border-gray-300 py-3 rounded-none text-gray-700 font-bold text-sm transition-all shadow-sm"
            >
              Exit Terminal
            </button>
          </div>

          {/* Leaderboard Card */}
          <div className="w-full md:w-7/12 bg-white border border-gray-200 rounded-none p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-none bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900">Class Leaderboard</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Live graded and ranked classroom results</p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {leaderboard.map((student, idx) => {
                const isMe = student.studentId === studentInfo?.studentId;
                const formattedTime = `${Math.floor(student.timeTakenSeconds / 60)}:${(student.timeTakenSeconds % 60).toString().padStart(2, "0")}`;

                return (
                  <div
                    key={student.id || idx}
                    className={`flex items-center justify-between p-3.5 rounded-none border transition-all ${
                      isMe
                        ? "bg-blue-50 border-blue-300 text-gray-900 shadow-sm ring-2 ring-blue-200"
                        : "bg-white border-gray-200 text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`h-6 w-6 rounded-none flex items-center justify-center text-xs font-black shrink-0 border ${
                        idx === 0 ? "bg-amber-100 text-amber-700 border-amber-200" :
                        idx === 1 ? "bg-gray-100 text-gray-600 border-gray-300" :
                        idx === 2 ? "bg-orange-100 text-orange-700 border-orange-200" :
                        "bg-gray-100 text-gray-400 border-gray-200"
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isMe ? "text-gray-900" : "text-gray-700"}`}>{student.name}</p>
                        <p className="text-[9px] text-gray-400 truncate mt-0.5">ID: {student.studentId} · Class {student.grade}-{student.section}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-xs font-black ${isMe ? "text-emerald-600" : "text-emerald-500"}`}>{student.score} / {student.totalQuestions}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">Time: {formattedTime}</p>
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
