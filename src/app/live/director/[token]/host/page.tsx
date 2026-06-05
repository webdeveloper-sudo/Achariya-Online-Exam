"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users, Trophy, Copy, Check, Play, Square, Loader, ArrowLeft,
  Calendar, RefreshCw, AlertTriangle, ShieldCheck, Mail, Send, Plus, Trash2, Award
} from "lucide-react";

interface SSEParticipant {
  id: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  branch: string;
  designation: string;
  userId: string;
  joinedAt: string;
  completedAt?: string | null;
  score?: number | null;
  totalQuestions?: number | null;
  timeTakenSeconds?: number | null;
  tabSwitches: number;
  terminated: boolean;
}

export default function DirectorHostPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  // Director identity
  const [directorToken, setDirectorToken] = useState<string | null>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"WAITING" | "ACTIVE" | "COMPLETED" | null>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Roster
  const [roster, setRoster] = useState<SSEParticipant[]>([]);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Email Invitation Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState<string[]>([""]);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [sendingInvites, setSendingInvites] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Time remaining
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Check auth
  useEffect(() => {
    const savedToken = localStorage.getItem("directorToken");
    const savedUser = localStorage.getItem("directorUser");
    if (!savedToken || !savedUser) {
      router.push("/director/login");
      return;
    }
    setDirectorToken(savedToken);
  }, [router]);

  // Fetch and poll
  const fetchSessionDetails = useCallback(async () => {
    if (!token) return;
    try {
      const headers: Record<string, string> = {};
      if (directorToken) {
        headers["Authorization"] = `Bearer ${directorToken}`;
      }
      const res = await fetch(`/api/director/live/${token}/status`, { headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load teacher evaluation session.");
      }
      setSessionStatus(data.status);
      setAssessment(data.assessment);
      setStartedAt(data.startedAt);
      setEndedAt(data.endedAt);
      setRoster(data.participants || []);
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
      if (data.status === "COMPLETED") {
        if (data.sessionId) {
          router.push(`/director/sessions/${data.sessionId}`);
          return;
        }
      }
      setLoading(false);
    } catch (e: any) {
      setError(e.message || "Session could not be loaded.");
      setLoading(false);
    }
  }, [token, directorToken, router]);

  // Initialize default email invitation template when assessment loads
  useEffect(() => {
    if (assessment) {
      if (!customSubject) {
        setCustomSubject(`Invitation to Complete Teacher Assessment: ${assessment.title || "Academic Evaluation"}`);
      }
      if (!customBody) {
        setCustomBody(`Hello Teacher,\n\nYou have been invited by the Director of Academics to participate in a live assessment session.\n\nAssessment Title: ${assessment.title || "General Evaluation"}\n\nPlease join the waiting room using the link below.`);
      }
    }
  }, [assessment, customSubject, customBody]);

  // Initial load
  useEffect(() => {
    if (!token || !directorToken) return;
    fetchSessionDetails();
  }, [token, directorToken, fetchSessionDetails]);

  // Periodic polling every 3 seconds
  useEffect(() => {
    if (!token || !directorToken || loading) return;

    const interval = setInterval(async () => {
      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${directorToken}`
        };
        const res = await fetch(`/api/director/live/${token}/status`, { headers });
        const data = await res.json();
        if (res.ok) {
          setRoster(data.participants || []);
          setSessionStatus(data.status);
          setStartedAt(data.startedAt);
          setEndedAt(data.endedAt);
          if (data.sessionId) {
            setSessionId(data.sessionId);
          }
          if (data.status === "COMPLETED") {
            if (data.sessionId) {
              router.push(`/director/sessions/${data.sessionId}`);
            }
          }
        }
      } catch (e) {
        console.error("Error syncing status", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [token, directorToken, loading, router]);

  // Timer countdown
  useEffect(() => {
    if (sessionStatus !== "ACTIVE" || !startedAt || !assessment) {
      setTimeLeft(null);
      return;
    }

    const durationSeconds = assessment.duration * 60;
    const startMs = new Date(startedAt).getTime();

    const interval = setInterval(() => {
      const nowMs = Date.now();
      const elapsedSeconds = Math.floor((nowMs - startMs) / 1000);
      const remaining = durationSeconds - elapsedSeconds;

      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStatus, startedAt, assessment]);

  const handleCopyLink = () => {
    const joinUrl = `${window.location.origin}/live/director/${token}`;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startAssessment = async () => {
    if (roster.length === 0) {
      alert("At least one teacher must register and join the waiting room before starting.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/director/live/${token}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${directorToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to start assessment.");
      }
      setStartedAt(data.startedAt);
      setSessionStatus("ACTIVE");
    } catch (e: any) {
      alert("Error starting assessment: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const endAssessment = async () => {
    if (!confirm("Are you sure you want to end this live assessment? All outstanding teachers will have their responses compiled and evaluated.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/director/live/${token}/end`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${directorToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to end assessment.");
      }
      setRoster(data.leaderboard || []);
      setSessionStatus("COMPLETED");
      if (sessionId) {
        router.push(`/director/sessions/${sessionId}`);
      }
    } catch (e: any) {
      alert("Error ending assessment: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Mail invitations
  const addEmailField = () => {
    if (inviteEmails.length >= 25) return;
    setInviteEmails([...inviteEmails, ""]);
  };

  const removeEmailField = (idx: number) => {
    const updated = [...inviteEmails];
    updated.splice(idx, 1);
    setInviteEmails(updated);
  };

  const updateEmailField = (idx: number, val: string) => {
    const updated = [...inviteEmails];
    updated[idx] = val;
    setInviteEmails(updated);
  };

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    const validEmails = inviteEmails.filter(email => email.trim() !== "");
    if (validEmails.length === 0) {
      setInviteFeedback({ type: "error", message: "Please provide at least one valid email address." });
      return;
    }
    setSendingInvites(true);
    setInviteFeedback(null);

    const joinUrl = `${window.location.origin}/live/director/${token}`;

    try {
      const res = await fetch("/api/director/live/send-invitation", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${directorToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          emails: validEmails,
          joinUrl,
          assessmentTitle: assessment?.title,
          customSubject,
          customBody
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invitation dispatch failed.");
      }
      setInviteFeedback({ type: "success", message: `Successfully sent ${validEmails.length} invitations.` });
      setInviteEmails([""]);
      setTimeout(() => {
        setIsInviteOpen(false);
        setInviteFeedback(null);
      }, 2000);
    } catch (err: any) {
      setInviteFeedback({ type: "error", message: err.message || "Could not dispatch emails." });
    } finally {
      setSendingInvites(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-700">
        <Loader className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-sm text-gray-500">Loading live assessment room...</p>
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
          <h2 className="text-xl font-black text-gray-900">Hosting Inaccessible</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{error}</p>
          <button onClick={() => router.push("/director/assessments")} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-none font-bold text-sm transition-all">
            Return to Assessments
          </button>
        </div>
      </div>
    );
  }

  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/live/director/${token}`;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col relative overflow-hidden">
      {/* Main container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6 relative z-10 overflow-y-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/director/assessments`)}
              className="p-2.5 bg-white border border-gray-200 rounded-none hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 border border-blue-200 rounded-none">Director Live Control Deck</span>
                <span className="text-xs font-bold text-gray-400">· Status: {sessionStatus}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black mt-1 text-gray-900">{assessment?.title}</h1>
            </div>
          </div>

          {/* Core Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {sessionStatus === "WAITING" && (
              <button
                disabled={roster.length === 0 || actionLoading}
                onClick={startAssessment}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-600 text-white px-5 py-3 rounded-none font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {actionLoading ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
                Start Assessment
              </button>
            )}

            {sessionStatus === "ACTIVE" && (
              <button
                disabled={actionLoading}
                onClick={endAssessment}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:opacity-50 border border-red-600 text-white px-5 py-3 rounded-none font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {actionLoading ? <Loader size={16} className="animate-spin" /> : <Square size={16} />}
                End Session
              </button>
            )}

            {sessionStatus === "COMPLETED" && (
              <span className="w-full sm:w-auto text-gray-500 border border-gray-200 bg-white px-5 py-3 rounded-none font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
                Session Complete
              </span>
            )}
          </div>
        </div>

        {/* 1. WAITING ROOM VIEW (WAITING FOR TEACHERS) */}
        {sessionStatus === "WAITING" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white/80 border border-gray-200 rounded-none p-6 space-y-6 shadow-sm backdrop-blur-sm">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Invite Teachers</h3>
                  <p className="text-xs text-gray-500 mt-1">Share the access URL or dispatch email invitations instantly.</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-none p-4 space-y-3">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Join Link</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      type="text"
                      value={joinUrl}
                      className="bg-white border border-gray-300 rounded-none px-3 py-2 text-xs font-mono text-gray-600 flex-1 outline-none truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2.5 bg-blue-600 hover:bg-blue-700 rounded-none flex items-center justify-center text-white transition-all"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="w-full bg-white hover:bg-gray-50 border border-gray-300 py-3 rounded-none font-bold text-xs flex items-center justify-center gap-2 text-gray-700 transition-all shadow-sm"
                >
                  <Mail size={14} /> Send Email Invitations (Max 25)
                </button>

                <div className="border-t border-gray-100 pt-4 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subject</span>
                    <span className="font-bold text-blue-600">{assessment?.subject || "General"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Grade Level</span>
                    <span className="font-bold text-gray-700">{assessment?.grade || "All"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Questions</span>
                    <span className="font-bold text-gray-700">
                      {Array.isArray(assessment?.questions)
                        ? assessment?.questions.length
                        : JSON.parse(assessment?.questions || "[]").length} Qs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-white/80 border border-gray-200 rounded-none p-6 md:p-8 space-y-6 flex flex-col shadow-sm backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 border border-blue-200 text-blue-600 rounded-none flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-gray-900">Teachers Waitlist Lobby</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Educators currently joined and awaiting start</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 border border-blue-200 rounded-none">
                  {roster.length} Teachers Online
                </span>
              </div>

              {roster.length === 0 ? (
                <div className="flex-1 border-2 border-dashed border-gray-200 rounded-none p-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Users className="text-gray-300" size={32} />
                  <p className="text-sm font-bold text-gray-400">Waitlist lobby is empty</p>
                  <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                    Share the evaluation invitation link. Educators will populate here automatically in real time.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {roster.map((teacher, idx) => (
                    <div key={teacher.id || idx} className="bg-gray-50 border border-gray-200 rounded-none p-4 space-y-3 hover:border-blue-300 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-blue-50 border border-blue-200 text-blue-600 rounded-none flex items-center justify-center font-bold text-xs shrink-0">
                          {teacher.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate text-gray-700">{teacher.name}</p>
                          <p className="text-[9px] text-gray-400 truncate mt-0.5">{teacher.designation} · {teacher.branch}</p>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 pt-2 flex flex-col gap-1 text-[9px] text-gray-400">
                        <p className="truncate">Employee ID: <span className="font-semibold text-gray-600">{teacher.userId}</span></p>
                        <p className="truncate">Email: {teacher.email}</p>
                        <p className="truncate">Qualifications: {teacher.qualification}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. ACTIVE MONITORING ROOM (EXAM IN PROGRESS) */}
        {sessionStatus === "ACTIVE" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Live Analytics Panel */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white/80 border border-gray-200 rounded-none p-6 space-y-6 shadow-sm backdrop-blur-sm">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Session Proctor Stats</h3>
                  <p className="text-xs text-gray-500 mt-1">Real-time status updates of active educators.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-none p-4 text-center">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Active Roster</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">{roster.length}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-none p-4 text-center">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Submitted</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">
                      {roster.filter((r) => r.completedAt).length}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-none p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Timer</p>
                    <p className="text-sm font-bold text-gray-700 mt-0.5">Duration: {assessment?.duration} Mins</p>
                  </div>
                  <div className={`px-4 py-2 border rounded-none font-mono font-bold text-sm ${
                    timeLeft !== null && timeLeft < 60
                      ? "bg-red-50 border-red-200 text-red-600 animate-pulse font-black"
                      : "bg-gray-50 border-gray-200 text-blue-600"
                  }`}>
                    {timeLeft !== null ? formatTime(timeLeft) : "00:00"}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Questions</span>
                    <span className="font-bold text-gray-700">
                      {Array.isArray(assessment?.questions)
                        ? assessment?.questions.length
                        : JSON.parse(assessment?.questions || "[]").length} Qs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Focus Rate</span>
                    <span className="font-bold text-emerald-600">
                      {roster.length > 0
                        ? Math.round(((roster.filter(p => p.tabSwitches === 0).length) / roster.length) * 100)
                        : 100}% Secure
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Proctor Monitoring Board */}
            <div className="md:col-span-2 bg-white/80 border border-gray-200 rounded-none p-6 md:p-8 space-y-6 shadow-sm backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 border border-blue-200 text-blue-600 rounded-none flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-gray-900">Teachers Live Proctor Board</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Focus switch integrity and compliance reports</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {roster.map((teacher, idx) => {
                  const isSubmitted = !!teacher.completedAt;
                  const isDisqualified = teacher.terminated || teacher.tabSwitches > 2;

                  return (
                    <div key={teacher.id || idx} className="bg-gray-50 border border-gray-200 rounded-none p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-none flex items-center justify-center text-xs font-bold shrink-0 border ${
                          isDisqualified ? "bg-red-50 text-red-600 border-red-200" :
                          isSubmitted ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                          "bg-blue-50 text-blue-600 border-blue-200"
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-700">{teacher.name}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">Emp ID: {teacher.userId} · {teacher.designation} ({teacher.branch})</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 text-xs">
                        {isDisqualified ? (
                          <span className="flex items-center gap-1 text-[11px] font-black uppercase text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-none animate-pulse">
                            <AlertTriangle size={10} />
                            Disqualified
                          </span>
                        ) : teacher.tabSwitches > 0 ? (
                          <span className="flex items-center gap-1 text-[11px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-none">
                            <AlertTriangle size={10} />
                            {teacher.tabSwitches} Warning{teacher.tabSwitches > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-black uppercase text-gray-400">
                            <ShieldCheck size={11} className="text-emerald-500" />
                            Secure Lock
                          </span>
                        )}

                        <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-none border shrink-0 ${
                          isDisqualified ? "bg-red-50 text-red-600 border-red-200" :
                          isSubmitted ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                          "bg-gray-100 text-gray-500 border-gray-200 animate-pulse"
                        }`}>
                          {isDisqualified ? "Locked Out" : isSubmitted ? `Score: ${teacher.score}/${teacher.totalQuestions}` : "Writing"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. COMPLETED STATE VIEW */}
        {sessionStatus === "COMPLETED" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/80 border border-gray-200 rounded-none p-6 space-y-6 shadow-sm backdrop-blur-sm">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Session Completed</h3>
                  <p className="text-xs text-gray-500 mt-1">Summary of evaluation results</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-none p-4">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Session Closed</p>
                    <p className="text-sm font-bold text-gray-700 mt-1">
                      {endedAt ? new Date(endedAt).toLocaleDateString() : "N/A"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {endedAt ? new Date(endedAt).toLocaleTimeString() : ""}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-none p-4 text-center">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Top Score</p>
                      <p className="text-2xl font-black text-blue-600 mt-1">
                        {roster.length > 0 ? Math.max(...roster.map((r) => r.score || 0)) : 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-none p-4 text-center">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Average Score</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">
                        {roster.length > 0
                          ? Math.round((roster.reduce((acc, curr) => acc + (curr.score || 0), 0) / roster.length) * 10) / 10
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white/80 border border-gray-200 rounded-none p-6 md:p-8 space-y-6 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 border border-blue-200 text-blue-600 rounded-none flex items-center justify-center">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900">Evaluation Roster Summary</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Educator outcomes and session metrics</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-2">Rank</th>
                      <th className="py-3 px-4">Teacher</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Time Taken</th>
                      <th className="py-3 px-4">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((teacher, idx) => {
                      const isDisqualified = teacher.terminated || teacher.tabSwitches > 2;
                      const formattedTime = teacher.timeTakenSeconds
                        ? `${Math.floor(teacher.timeTakenSeconds / 60)}:${(teacher.timeTakenSeconds % 60).toString().padStart(2, "0")}`
                        : "N/A";

                      return (
                        <tr key={teacher.id || idx} className="hover:bg-gray-50/30 transition-all border-b border-gray-100">
                          <td className="py-4 px-2">
                            <span className={`h-6 w-6 rounded-none flex items-center justify-center text-xs font-black border ${
                              isDisqualified ? "bg-gray-100 text-gray-400 border-gray-200" :
                              idx === 0 ? "bg-amber-100 text-amber-700 border-amber-200" :
                              idx === 1 ? "bg-gray-100 text-gray-600 border-gray-300" :
                              idx === 2 ? "bg-orange-100 text-orange-700 border-orange-200" :
                              "bg-gray-100 text-gray-400 border-gray-200"
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-gray-700">{teacher.name}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5">Emp ID: {teacher.userId} · {teacher.designation} ({teacher.branch})</p>
                          </td>
                          <td className={`py-4 px-4 font-black text-sm ${isDisqualified ? "text-gray-400 line-through" : "text-emerald-600"}`}>
                            {teacher.score} / {teacher.totalQuestions}
                          </td>
                          <td className="py-4 px-4 font-mono font-medium text-gray-600">
                            {formattedTime}
                          </td>
                          <td className="py-4 px-4">
                            {isDisqualified ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-none">
                                <AlertTriangle size={10} />
                                Disqualified
                              </span>
                            ) : teacher.tabSwitches > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-none">
                                <AlertTriangle size={10} />
                                {teacher.tabSwitches} Warning{teacher.tabSwitches > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-gray-400">
                                <ShieldCheck size={11} className="text-emerald-500" />
                                Secure Pass
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EMAIL INVITATIONS POPUP MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="max-w-5xl h-full w-full bg-white border border-gray-200 rounded-none p-8 space-y-6 shadow-sm relative overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="text-lg font-black flex items-center gap-2 text-gray-900">
                <Mail className="text-blue-600" size={20} />
                Send Customizable Invitations
              </h3>
              <button
                onClick={() => {
                  setIsInviteOpen(false);
                  setInviteFeedback(null);
                }}
                className="text-gray-400 hover:text-gray-900 text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>

            {inviteFeedback && (
              <div className={`p-3 border rounded-none text-xs flex items-center gap-2 ${
                inviteFeedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}>
                <AlertTriangle size={14} className="shrink-0" />
                <p>{inviteFeedback.message}</p>
              </div>
            )}

            <form onSubmit={handleSendInvites} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                
                {/* Left Column: Emails */}
                <div className="space-y-4 max-w-xl">
                  <div>
                    <h4 className="text-sm mb-2 font-black uppercase text-blue-600 tracking-wider">1. Recipient Emails</h4>
                    <p className="text-[11px] text-gray-500 mt-1">Specify target email addresses (Max 25 teachers).</p>
                  </div>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {inviteEmails.map((email, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          required
                          type="email"
                          placeholder="teacher@example.com"
                          value={email}
                          onChange={(e) => updateEmailField(idx, e.target.value)}
                          className="bg-white border border-gray-300 rounded-none px-4 py-3 text-[12px] focus:border-blue-600 outline-none flex-1 font-bold text-gray-700 transition-all placeholder:text-gray-400"
                        />
                        {inviteEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmailField(idx)}
                            className="p-2.5 bg-red-50 border border-red-200 rounded-none text-red-500 hover:bg-red-100 transition-all shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {inviteEmails.length < 25 && (
                    <button
                      type="button"
                      onClick={addEmailField}
                      className="w-full bg-white hover:bg-gray-50 border border-dashed border-gray-300 py-2.5 rounded-none font-bold text-[11px] text-gray-500 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus size={12} /> Add Teacher Input
                    </button>
                  )}
                </div>

                {/* Right Column: Email Template Details */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                  <div>
                    <h4 className="text-sm mb-2 mt-4 font-black uppercase text-emerald-600 tracking-wider">2. Customize Email Template</h4>
                    <p className="text-[11px] text-gray-500 mt-1">Refine the subject line and dynamic message body.</p>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div className="space-y-3">
                      <label className="text-[11px] mb-3 text-gray-500 font-bold uppercase">Subject Line</label>
                      <input
                        required
                        type="text"
                        placeholder="Invitation Subject..."
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-none px-4 py-3 mt-2 text-xs focus:border-blue-600 outline-none font-bold text-gray-700 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] text-gray-500 font-bold mb-3 uppercase">Message Body</label>
                      <textarea
                        required
                        rows={6}
                        placeholder="Invitation Message..."
                        value={customBody}
                        onChange={(e) => setCustomBody(e.target.value)}
                        className="w-full h-[26vh] bg-white border border-gray-300 rounded-none px-4 py-3 mt-2 text-xs focus:border-blue-600 outline-none font-semibold text-gray-700 transition-all resize-none custom-scrollbar"
                      />
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-none p-3">
                      <p className="text-[11px] leading-relaxed text-gray-500">
                        <span className="font-bold text-gray-600 mr-2">Pro-Tip:</span> The premium assessment portal logo, interactive &quot;Start Live Assessment&quot; button, instructions, and proctoring rules will be dynamically appended below your custom body.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              <div className="border-t border-gray-100 pt-4">
                <button
                  disabled={sendingInvites}
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white font-bold py-3.5 rounded-none text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  {sendingInvites ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                  {sendingInvites ? "Sending Invitations..." : "Dispatch Custom Invites"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
