"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock, AlertTriangle, RefreshCw, CheckCircle2,
  ShieldAlert, FileText, ArrowRight, Maximize, User, Mail, Phone, GraduationCap, Building2, Briefcase
} from "lucide-react";

interface Question {
  id: string;
  type: string;
  question: string;
  options?: string[];
}

interface Assessment {
  id: string;
  title: string;
  duration: number;
  subject: string;
  grade: string;
  questions: any;
}

export default function TeacherLivePage() {
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

  // Teacher Identity & Progress
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [teacherInfo, setTeacherInfo] = useState<{
    userId: string;
    name: string;
    branch: string;
    designation: string;
    email: string;
    phone: string;
    qualification: string;
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fullscreen enforcement
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);

  // Join form states
  const [formUserId, setFormUserId] = useState("");
  const [formName, setFormName] = useState("");
  const [formBranch, setFormBranch] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formQualification, setFormQualification] = useState("");
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Lookup state
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

  // Restore teacher identity and cached answers from localStorage
  useEffect(() => {
    if (!token) return;
    const localDataStr = localStorage.getItem(`director_teacher_${token}`);
    if (localDataStr) {
      try {
        const data = JSON.parse(localDataStr);
        if (data.participantId && data.teacherInfo) {
          setParticipantId(data.participantId);
          setTeacherInfo(data.teacherInfo);
          if (data.answers) {
            setAnswers(data.answers);
          }
          if (data.tabSwitches) {
            setTabSwitches(data.tabSwitches);
          }
          if (data.isTerminated) {
            setIsTerminated(data.isTerminated);
          }
          if (data.submitted) {
            setSubmitted(data.submitted);
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

  // Polling checks status every 3 seconds to sync waitroom and live exam transitions
  const pollSession = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/director/live/${token}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setReconnecting(false);

      // Verify if participant has been terminated on server
      if (participantId) {
        const me = data.participants?.find((p: any) => p.id === participantId);
        if (me) {
          if (me.terminated && !isTerminated) {
            setIsTerminated(true);
            saveToLocalState(answersRef.current, tabSwitchesRef.current, true, true);
          }
          if (me.completedAt && !submitted) {
            setSubmitted(true);
            saveToLocalState(answersRef.current, tabSwitchesRef.current, false, true);
          }
        }
      }

      if (data.status === "ACTIVE" && sessionStatus === "WAITING") {
        setStartedAt(data.startedAt);
        setDuration(data.assessment?.duration || 30);
        setSessionStatus("ACTIVE");
      } else if (data.status === "COMPLETED" && sessionStatus !== "COMPLETED") {
        setSessionStatus("COMPLETED");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      setReconnecting(true);
    }
  }, [token, sessionStatus, participantId, isTerminated, submitted]);

  useEffect(() => {
    if (!token || !sessionStatus || sessionStatus === "COMPLETED" || submitted || isTerminated) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(pollSession, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token, sessionStatus, pollSession, submitted, isTerminated]);

  // Fetch session status function
  const fetchSessionStatus = async () => {
    try {
      const res = await fetch(`/api/director/live/${token}/status`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load session details.");
      }
      setSessionStatus(data.status);
      setAssessment(data.assessment);
      setStartedAt(data.startedAt);
      setDuration(data.assessment?.duration || 30);

      if (participantId) {
        const me = data.participants?.find((p: any) => p.id === participantId);
        if (me) {
          if (me.terminated) {
            setIsTerminated(true);
          }
          if (me.completedAt) {
            setSubmitted(true);
          }
        }
      }

      setLoading(false);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
      setLoading(false);
    }
  };

  // Timer Countdown Logic
  useEffect(() => {
    if (sessionStatus !== "ACTIVE" || !startedAt || submitted || isTerminated) {
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
  }, [sessionStatus, startedAt, duration, submitted, isTerminated]);

  // Tab switch warning logic (Focus Interceptor)
  useEffect(() => {
    if (sessionStatus !== "ACTIVE" || !participantId || submitted || isTerminated) return;

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
  }, [sessionStatus, participantId, submitted, isTerminated]);

  const registerTabSwitch = async () => {
    if (submitted || isTerminated) return;

    const now = Date.now();
    if (now - lastSwitchTimeRef.current < 1000) return;
    lastSwitchTimeRef.current = now;

    const nextTabSwitches = tabSwitchesRef.current + 1;
    setTabSwitches(nextTabSwitches);

    // Save locally
    saveToLocalState(answersRef.current, nextTabSwitches, nextTabSwitches > 2, submitted);

    // Notify backend
    try {
      const res = await fetch(`/api/director/live/${token}/tabevent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      const data = await res.json();
      if (data.terminated || nextTabSwitches > 2) {
        setIsTerminated(true);
        exitFullscreen();
      } else {
        setShowWarning(true);
      }
    } catch (e) {
      console.error("Failed to log tab switch on server", e);
      if (nextTabSwitches > 2) {
        setIsTerminated(true);
        exitFullscreen();
      }
    }
  };

  // Save state to localStorage
  const saveToLocalState = (
    currentAnswers: Record<string, string>,
    currentTabs: number,
    terminatedFlag: boolean,
    submittedFlag: boolean
  ) => {
    if (!token || !participantId || !teacherInfo) return;
    localStorage.setItem(
      `director_teacher_${token}`,
      JSON.stringify({
        participantId,
        teacherInfo,
        answers: currentAnswers,
        tabSwitches: currentTabs,
        isTerminated: terminatedFlag,
        submitted: submittedFlag
      })
    );
  };

  // Auto-save periodically
  useEffect(() => {
    if (sessionStatus !== "ACTIVE" || submitted || isTerminated) return;
    const interval = setInterval(() => {
      saveToLocalState(answersRef.current, tabSwitchesRef.current, isTerminated, submitted);
    }, 10000);
    return () => clearInterval(interval);
  }, [sessionStatus, participantId, teacherInfo, isTerminated, submitted]);

  // Intercept refresh or unload
  useEffect(() => {
    if (sessionStatus !== "ACTIVE" || submitted || isTerminated) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Leaving this assessment will forfeit your live connection. Stay on the tab!";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionStatus, submitted, isTerminated]);

  // Fullscreen helper functions
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setShowFullscreenWarning(false);
    } catch {
      // Non-fatal fallback
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
  };

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFSChange = () => {
      const nowFS = !!document.fullscreenElement;
      setIsFullscreen(nowFS);

      if (!nowFS && participantId && (sessionStatus === "WAITING" || sessionStatus === "ACTIVE") && !submitted && !isTerminated) {
        setShowFullscreenWarning(true);
        if (sessionStatus === "ACTIVE") {
          registerTabSwitch();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, [sessionStatus, participantId, submitted, isTerminated]);

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) {
      setLookupError("Please enter Employee ID or Email.");
      return;
    }
    setSearchingLookup(true);
    setLookupError(null);

    try {
      const res = await fetch(`/api/director/live/${token}/lookup?query=${encodeURIComponent(lookupQuery.trim())}`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Teacher profile not found.");
      }

      setFormUserId(data.teacher.userId || "");
      setFormName(data.teacher.userName || "");
      setFormBranch(data.teacher.branch || "");
      setFormDesignation(data.teacher.designation || "");
      setFormEmail(data.teacher.email || "");
      setFormPhone(data.teacher.mobileNo || "");
      setFormQualification(data.teacher.qualifications || "");

      setIsPrefilled(true);
      setShowLookupModal(false);
      setJoinError(null);
    } catch (err: any) {
      setLookupError(err.message || "No matching teacher registry profile found.");
    } finally {
      setSearchingLookup(false);
    }
  };

  // Join waitlist handler
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserId.trim() || !formName.trim() || !formBranch.trim() || !formDesignation.trim() || !formEmail.trim() || !formPhone.trim()) {
      setJoinError("Please fill out all required fields.");
      return;
    }
    setSubmittingJoin(true);
    setJoinError(null);

    try {
      const res = await fetch(`/api/director/live/${token}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: formUserId,
          name: formName,
          branch: formBranch,
          designation: formDesignation,
          email: formEmail,
          phone: formPhone,
          qualification: formQualification,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to join teacher assessment session.");
      }

      const pId = data.participantId;
      const tInfo = {
        userId: formUserId,
        name: formName,
        branch: formBranch,
        designation: formDesignation,
        email: formEmail,
        phone: formPhone,
        qualification: formQualification || "None",
      };

      setParticipantId(pId);
      setTeacherInfo(tInfo);

      // Save directly to localStorage
      localStorage.setItem(
        `director_teacher_${token}`,
        JSON.stringify({
          participantId: pId,
          teacherInfo: tInfo,
          answers: {},
          tabSwitches: 0,
          isTerminated: false,
          submitted: false
        })
      );

      await enterFullscreen();
    } catch (err: any) {
      setJoinError(err.message || "Could not register teacher profile.");
    } finally {
      setSubmittingJoin(false);
    }
  };

  // Submission triggers
  const handleManualSubmit = async () => {
    if (!confirm("Are you sure you want to finalize and submit your answers? This action is irreversible.")) return;
    await submitAssessment();
  };

  const handleAutoSubmit = async () => {
    await submitAssessment();
  };

  const submitAssessment = async () => {
    if (!participantId || submitted || isTerminated) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/director/live/${token}/submit`, {
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
      exitFullscreen();
      setSubmitted(true);
      saveToLocalState(answersRef.current, tabSwitchesRef.current, false, true);
      fetchSessionStatus();
    } catch (e: any) {
      alert("Failed to submit: " + e.message);
      setLoading(false);
    }
  };

  // Render timing layout
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-700">
        <RefreshCw className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-sm font-medium text-gray-500">Synchronizing evaluation workspace...</p>
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
          <h2 className="text-xl font-black text-gray-900">Assessment Inaccessible</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{error}</p>
          <button onClick={fetchSessionStatus} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-none font-bold text-sm transition-all">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // TERMINATED SCREEN (DISQUALIFIED TEACHER - Tab switches exceed limit)
  if (isTerminated) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex relative overflow-hidden items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-none p-8 text-center space-y-6 shadow-sm">
          <div className="mx-auto h-16 w-16 rounded-none bg-red-50 border border-red-200 text-red-500 flex items-center justify-center animate-pulse">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-gray-900">Assessment Session Terminated</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              We noticed multiple tab switches or focus switches. To preserve exam integrity, this teacher evaluation session has been locked.
            </p>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-none text-left space-y-2 mt-4">
              <p className="text-xs text-gray-500">Teacher: <span className="font-bold text-gray-700">{teacherInfo?.name}</span></p>
              <p className="text-xs text-gray-500">Employee ID: <span className="font-bold text-gray-700">{teacherInfo?.userId}</span></p>
              <p className="text-xs text-gray-500">Assessment: <span className="font-bold text-blue-600">{assessment?.title}</span></p>
              <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Integrity Status: Disqualified (Tab Violation)</p>
            </div>
            <p className="text-sm text-emerald-600 font-medium mt-4">
              The session details and logs have been recorded for review by the Director.
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem(`director_teacher_${token}`);
              router.push("/");
            }}
            className="w-full bg-white hover:bg-gray-50 border border-gray-300 py-3.5 rounded-none text-gray-700 font-bold text-sm transition-all shadow-sm"
          >
            Close Portal
          </button>
        </div>
      </div>
    );
  }

  // THANK YOU SCREEN (SUCCESSFULLY SUBMITTED)
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex relative overflow-hidden items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-none p-8 text-center space-y-6 shadow-sm">
          <div className="mx-auto h-16 w-16 rounded-none bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-gray-900">Assessment Submitted</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your responses have been successfully uploaded and processed.
            </p>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-none text-left space-y-2 mt-4">
              <p className="text-xs text-gray-500">Teacher: <span className="font-bold text-gray-700">{teacherInfo?.name}</span></p>
              <p className="text-xs text-gray-500">Employee ID: <span className="font-bold text-gray-700">{teacherInfo?.userId}</span></p>
              <p className="text-xs text-gray-500">Assessment: <span className="font-bold text-blue-600">{assessment?.title}</span></p>
            </div>
            <p className="text-sm text-emerald-600 font-bold mt-6 leading-relaxed">
              Thank you! The evaluation summary is now available in the Director's session report.
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem(`director_teacher_${token}`);
              router.push("/");
            }}
            className="w-full bg-white hover:bg-gray-50 border border-gray-300 py-3.5 rounded-none text-gray-700 font-bold text-sm transition-all shadow-sm"
          >
            Exit Terminal
          </button>
        </div>
      </div>
    );
  }

  // ONBOARDING PROFILE FORM
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
              Entry is currently locked. The Director has already initiated this assessment session.
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
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-black text-gray-900">Session Completed</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              This conducted assessment session is complete and has been finalized by the Director.
            </p>
            <button onClick={() => router.push("/")} className="w-full bg-white hover:bg-gray-50 border border-gray-300 py-3 rounded-none font-bold text-sm text-gray-700 transition-all shadow-sm">
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 font-sans flex relative overflow-hidden items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-none p-8 space-y-6 shadow-sm relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 rounded-none bg-blue-50 border border-blue-200 items-center justify-center text-blue-600 mb-2">
              <FileText size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">Teacher Onboarding</h2>
            <p className="text-xs text-gray-500">Join the live teacher evaluation session</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-none p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Assessment</p>
              <h3 className="text-sm font-bold text-gray-700 truncate mt-0.5 max-w-[200px]">{assessment?.title}</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Duration</p>
              <h3 className="text-sm font-bold text-blue-600 mt-0.5">{assessment?.duration} Mins</h3>
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
              <p>Profile retrieved from registry! You can review your details before joining.</p>
            </div>
          )}

          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Employee ID *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    required
                    type="text"
                    placeholder="EMP123"
                    value={formUserId}
                    onChange={(e) => setFormUserId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-3 py-3 text-xs focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-bold text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Full Name *</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    placeholder="Enter full name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-none px-3 py-3 text-xs focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-bold text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Branch Hub *</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    required
                    type="text"
                    placeholder="e.g. Puducherry"
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-3 py-3 text-xs focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-bold text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Designation *</label>
                <div className="relative">
                  <Briefcase size={14} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    required
                    type="text"
                    placeholder="e.g. PRT Teacher"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-3 py-3 text-xs focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-bold text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Email Address *</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  required
                  type="email"
                  placeholder="teacher@achariya.org"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-3 py-3 text-xs focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-bold text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Mobile Number *</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  required
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-3 py-3 text-xs focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-bold text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Qualifications (Optional)</label>
              <div className="relative">
                <GraduationCap size={14} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. B.Ed, M.Sc in Physics"
                  value={formQualification}
                  onChange={(e) => setFormQualification(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-3 py-3 text-xs focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 font-bold text-gray-900"
                />
              </div>
            </div>

            <button
              disabled={submittingJoin}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-none text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer border border-blue-600"
            >
              {submittingJoin ? "Joining waiting queue..." : "Start Onboarding"}
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
                Already registered? Search your profile
              </button>
            </div>
          </form>
        </div>

        {/* Lookup Modal Overlay */}
        {showLookupModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white border border-gray-200 rounded-none p-6 space-y-6 shadow-sm relative animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-black text-gray-900">Find Registered Profile</h3>
                <p className="text-xs text-gray-500">Enter your Employee ID or registered email address to retrieve your details.</p>
              </div>

              {lookupError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-none text-xs flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <p>{lookupError}</p>
                </div>
              )}

              <form onSubmit={handleLookupSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Employee ID or Email</label>
                  <input
                    required
                    type="text"
                    placeholder="Enter Employee ID or email"
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

  // CANDIDATE WAITING ROOM
  if (sessionStatus === "WAITING") {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex relative overflow-hidden items-center justify-center p-6">
        {/* Fullscreen warning overlay in waitroom */}
        {showFullscreenWarning && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <div className="max-w-sm w-full bg-white border border-amber-300 rounded-none p-8 text-center space-y-6 shadow-sm">
              <div className="mx-auto h-16 w-16 rounded-none bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <Maximize size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-amber-600">Fullscreen Required</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  This evaluation session must be completed under fullscreen security. Return to continue waiting.
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
            <h2 className="text-2xl font-black text-gray-900">Live Lobby Waiting Room</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Hello <span className="font-extrabold text-gray-900">{teacherInfo?.name}</span>. You have joined the session successfully. The Director will start the assessment shortly.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-none p-4 divide-y divide-gray-100 text-left text-xs space-y-2">
            <div className="py-1.5 flex justify-between">
              <span className="text-gray-400">Employee ID</span>
              <span className="font-bold text-gray-700">{teacherInfo?.userId}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-gray-400">Teacher Name</span>
              <span className="font-bold text-gray-700">{teacherInfo?.name}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-gray-400">Branch Hub</span>
              <span className="font-bold text-gray-700">{teacherInfo?.branch}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-gray-400">Designation</span>
              <span className="font-bold text-gray-700">{teacherInfo?.designation}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-gray-400">Qualifications</span>
              <span className="font-bold text-gray-700">{teacherInfo?.qualification}</span>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 italic">Please stay on this page. Focus switches are strictly monitored.</p>
        </div>
      </div>
    );
  }

  // ACTIVE EXAM WORKSPACE
  if (sessionStatus === "ACTIVE") {
    const questions = Array.isArray(assessment?.questions)
      ? assessment?.questions
      : JSON.parse(assessment?.questions || "[]");

    return (
      <div className="min-h-screen bg-gray-50 font-sans flex flex-col relative overflow-x-hidden">
        {/* Fullscreen exited overlay */}
        {showFullscreenWarning && !showWarning && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <div className="max-w-sm w-full bg-white border border-amber-300 rounded-none p-8 text-center space-y-6 shadow-sm">
              <div className="mx-auto h-16 w-16 rounded-none bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <Maximize size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-amber-600">Fullscreen Exited</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Exiting fullscreen is counted as an integrity violation. Return to continue.
                </p>
                <p className="text-xs text-red-600 font-bold">Violations count: {tabSwitches} / 2</p>
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

        {/* Tab switch warning overlay */}
        {showWarning && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white border border-red-300 rounded-none p-8 text-center space-y-6 shadow-sm">
              <div className="mx-auto h-16 w-16 rounded-none bg-red-50 border border-red-200 text-red-500 flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-red-600">Security Warning Interceptor</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  You are being monitored. Leaving this tab, switching applications, or opening other terminals will result in automatic disqualification.
                </p>
                <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Violation warning count: {tabSwitches} / 2</p>
              </div>
              <button
                onClick={() => setShowWarning(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-none font-bold text-sm transition-all"
              >
                Return to Assessment
              </button>
            </div>
          </div>
        )}

        {/* Top Header Navbar */}
        <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200 p-4 z-40 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black truncate max-w-[200px] sm:max-w-xs text-gray-900">{assessment?.title}</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">{teacherInfo?.name} (Teacher Evaluation)</p>
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
                Submit Answers
              </button>
            </div>
          </div>
        </header>

        {/* Live take content */}
        <main className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-none p-4 flex items-center gap-3 text-xs text-amber-700">
            <ShieldAlert className="text-amber-500 shrink-0" size={16} />
            <p>Active proctor lock enabled. Leaving this page is recorded. Exiting fullscreen twice triggers automatic termination.</p>
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
                            saveToLocalState(newAnswers, tabSwitches, isTerminated, submitted);
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
                        saveToLocalState(newAnswers, tabSwitches, isTerminated, submitted);
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

  return null;
}
