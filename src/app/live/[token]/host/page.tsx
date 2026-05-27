"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users, Trophy, Copy, Check, Play, Square, Loader, ArrowLeft,
  Calendar, RefreshCw, AlertTriangle, ShieldCheck, HelpCircle, UserCheck, Eye
} from "lucide-react";

interface SSEParticipant {
  id: string;
  name: string;
  grade: string;
  section: string;
  studentId: string;
  joinedAt: string;
  completedAt?: string | null;
  score?: number | null;
  totalQuestions?: number | null;
  timeTakenSeconds?: number | null;
  tabSwitches?: number;
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

export default function TeacherHostPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  // Identity & Auth
  const [teacherToken, setTeacherToken] = useState<string | null>(null);

  // Connection & Core states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"WAITING" | "ACTIVE" | "COMPLETED" | null>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Real-time roster
  const [roster, setRoster] = useState<SSEParticipant[]>([]);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Timer Countdown Logic
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Check auth on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("teacherToken");
    const savedUser = localStorage.getItem("teacherUser");
    if (!savedToken || !savedUser) {
      router.push("/teacher/login");
      return;
    }
    setTeacherToken(savedToken);
  }, []);

  // Poll for session status every 3 seconds
  useEffect(() => {
    if (!token || !teacherToken) return;

    const interval = setInterval(() => {
      refreshSessionData();
    }, 3000);

    fetchSessionDetails();
    return () => clearInterval(interval);
  }, [token, teacherToken]);

  const fetchSessionDetails = async () => {
    try {
      const res = await fetch(`/api/live/${token}/status`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch session.");
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
        deriveLeaderboard(data.participants || []);
        if (data.sessionId) {
          router.push(`/teacher/live-sessions/${data.sessionId}`);
          return;
        }
      }
      setLoading(false);
    } catch (e: any) {
      setError(e.message || "Session could not be loaded.");
      setLoading(false);
    }
  };

  const refreshSessionData = async () => {
    try {
      const res = await fetch(`/api/live/${token}/status`);
      const data = await res.json();
      if (res.ok) {
        setRoster(data.participants || []);
        setSessionStatus(data.status);
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }
        if (data.status === "COMPLETED") {
          deriveLeaderboard(data.participants || []);
          if (data.sessionId) {
            router.push(`/teacher/live-sessions/${data.sessionId}`);
          }
        }
      }
    } catch (e) {
      console.error("Error refreshing status", e);
    }
  };

  const deriveLeaderboard = (participants: any[]) => {
    const sorted = [...participants].sort((a, b) => {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.timeTakenSeconds ?? Infinity) - (b.timeTakenSeconds ?? Infinity);
    });
    const formatted = sorted.map((p, idx) => ({
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
    setLeaderboard(formatted);
  };

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
    const joinUrl = `${window.location.origin}/live/${token}`;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startAssessment = async () => {
    if (roster.length === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/live/${token}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${teacherToken}`,
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
    if (!confirm("Are you sure you want to end this live assessment? All outstanding students will have their entries scored and finalized.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/live/${token}/end`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${teacherToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to end assessment.");
      }
      setLeaderboard(data.leaderboard || []);
      setSessionStatus("COMPLETED");
      if (sessionId) {
        router.push(`/teacher/live-sessions/${sessionId}`);
      }
    } catch (e: any) {
      alert("Error ending assessment: " + e.message);
    } finally {
      setActionLoading(false);
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
        <p className="text-sm text-gray-500">Loading educator hosting panel...</p>
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
          <button onClick={() => router.push("/teacher/assessments")} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-none font-bold text-sm transition-all">
            Return to Repository
          </button>
        </div>
      </div>
    );
  }

  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/live/${token}`;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col relative overflow-hidden">
      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6 relative z-10 overflow-y-auto">
        
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/teacher/assessments/${assessment?.id}`)}
              className="p-2.5 bg-white border border-gray-200 rounded-none hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded-none">Live Control</span>
                <span className="text-xs font-bold text-gray-400">· Room Status: {sessionStatus}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black mt-1 text-gray-900">{assessment?.title}</h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {sessionStatus === "WAITING" && (
              <button
                disabled={roster.length === 0 || actionLoading}
                onClick={startAssessment}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-600 px-5 py-3 rounded-none font-bold text-sm text-white flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {actionLoading ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
                Start Assessment
              </button>
            )}

            {sessionStatus === "ACTIVE" && (
              <button
                disabled={actionLoading}
                onClick={endAssessment}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:opacity-50 border border-red-600 px-5 py-3 rounded-none font-bold text-sm text-white flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {actionLoading ? <Loader size={16} className="animate-spin" /> : <Square size={16} />}
                End Assessment
              </button>
            )}

            {sessionStatus === "COMPLETED" && (
              <button
                disabled
                className="w-full sm:w-auto bg-white border border-gray-200 text-gray-400 px-5 py-3 rounded-none font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                Assessment Completed
              </button>
            )}
          </div>
        </div>

        {/* 1. WAITING ROOM SCREEN */}
        {sessionStatus === "WAITING" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Share link and meta column */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white/80 border border-gray-200 rounded-none p-6 space-y-6 shadow-sm backdrop-blur-sm">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Invite Students</h3>
                  <p className="text-xs text-gray-500 mt-1">Share the following live access connection URL with your roster class.</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-none p-4 space-y-3">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Access Link</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      type="text"
                      value={joinUrl}
                      className="bg-white border border-gray-300 rounded-none px-3 py-2 text-xs font-mono text-gray-500 flex-1 outline-none truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2.5 bg-blue-600 hover:bg-blue-700 rounded-none flex items-center justify-center text-white transition-all"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration Limit</span>
                    <span className="font-bold text-gray-700">{assessment?.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Questions</span>
                    <span className="font-bold text-gray-700">
                      {Array.isArray(assessment?.questions)
                        ? assessment?.questions.length
                        : JSON.parse(assessment?.questions || "[]").length} Questions
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live student roster column */}
            <div className="md:col-span-2 bg-white/80 border border-gray-200 rounded-none p-6 md:p-8 space-y-6 flex flex-col shadow-sm backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 border border-blue-200 text-blue-600 rounded-none flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-gray-900">Waiting Queue</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Students ready to initiate the assessment</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 border border-blue-200 rounded-none">
                  {roster.length} Connected
                </span>
              </div>

              {roster.length === 0 ? (
                <div className="flex-1 border-2 border-dashed border-gray-200 rounded-none p-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Users className="text-gray-300" size={32} />
                  <p className="text-sm font-bold text-gray-400">Roster Queue Empty</p>
                  <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                    Share the invitation link to wait for participants. Roster will update instantly in real time.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {roster.map((student, idx) => (
                    <div key={student.id || idx} className="bg-gray-50 border border-gray-200 rounded-none p-4 flex items-center gap-3 hover:border-blue-200 transition-all">
                      <div className="h-9 w-9 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-none flex items-center justify-center font-bold text-xs">
                        {student.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate text-gray-700">{student.name}</p>
                        <p className="text-[9px] text-gray-400 truncate mt-0.5">ID: {student.studentId} · Grade {student.grade}-{student.section}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. ACTIVE PROGRESS SCREEN */}
        {sessionStatus === "ACTIVE" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Live Stats */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white/80 border border-gray-200 rounded-none p-6 space-y-6 shadow-sm backdrop-blur-sm">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Assessment Terminal</h3>
                  <p className="text-xs text-gray-500 mt-1">Real-time supervision of active exam submissions.</p>
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
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Elapsed Limit</p>
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
              </div>
            </div>

            {/* Interactive Student Supervisor */}
            <div className="md:col-span-2 bg-white/80 border border-gray-200 rounded-none p-6 md:p-8 space-y-6 shadow-sm backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-none flex items-center justify-center">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-gray-900">Active Roster Monitoring</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Live updates of exam activity &amp; integrity logs</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {roster.map((student, idx) => {
                  const isSubmitted = !!student.completedAt;

                  return (
                    <div key={student.id || idx} className="bg-gray-50 border border-gray-200 rounded-none p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-none flex items-center justify-center text-xs font-bold border ${
                          isSubmitted ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-blue-50 text-blue-600 border-blue-200"
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-700">{student.name}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">ID: {student.studentId} · Class {student.grade}-{student.section}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 text-xs">
                        {student.tabSwitches && student.tabSwitches > 0 ? (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-none">
                            <AlertTriangle size={10} />
                            {student.tabSwitches} Tab Out{student.tabSwitches > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-gray-400">
                            <ShieldCheck size={11} className="text-emerald-500" />
                            Secure Lock
                          </span>
                        )}

                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-none border ${
                          isSubmitted
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-gray-100 text-gray-400 border-gray-200 animate-pulse"
                        }`}>
                          {isSubmitted ? "Submitted" : "Answering"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. COMPLETED LEADERBOARD SCREEN */}
        {sessionStatus === "COMPLETED" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Summary statistics column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/80 border border-gray-200 rounded-none p-6 space-y-6 shadow-sm backdrop-blur-sm">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Assessment Complete</h3>
                  <p className="text-xs text-gray-500 mt-1">Conducted session metrics and aggregated analytics.</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-none p-4">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Conducted</p>
                    <p className="text-sm font-bold text-gray-700 mt-1">
                      {startedAt ? new Date(startedAt).toLocaleDateString() : "N/A"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {startedAt ? new Date(startedAt).toLocaleTimeString() : ""}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-none p-4 text-center">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Top Score</p>
                      <p className="text-2xl font-black text-blue-600 mt-1">
                        {leaderboard.length > 0 ? Math.max(...leaderboard.map((l) => l.score)) : 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-none p-4 text-center">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Average</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">
                        {leaderboard.length > 0
                          ? Math.round((leaderboard.reduce((acc, curr) => acc + curr.score, 0) / leaderboard.length) * 10) / 10
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard panel */}
            <div className="lg:col-span-2 bg-white/80 border border-gray-200 rounded-none p-6 md:p-8 space-y-6 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 border border-blue-200 text-blue-600 rounded-none flex items-center justify-center">
                  <Trophy size={18} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900">Class Results Leaderboard</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Ranked by score (primary) and time taken (tie-breaker)</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-2">Rank</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Time Taken</th>
                      <th className="py-3 px-4">Integrity Logs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((student, idx) => {
                      const formattedTime = `${Math.floor(student.timeTakenSeconds / 60)}:${(student.timeTakenSeconds % 60).toString().padStart(2, "0")}`;

                      return (
                        <tr key={student.id || idx} className="hover:bg-gray-50/30 transition-all border-b border-gray-100">
                          <td className="py-4 px-2">
                            <span className={`h-6 w-6 rounded-none flex items-center justify-center text-xs font-black border ${
                              idx === 0 ? "bg-amber-100 text-amber-700 border-amber-200" :
                              idx === 1 ? "bg-gray-100 text-gray-600 border-gray-300" :
                              idx === 2 ? "bg-orange-100 text-orange-700 border-orange-200" :
                              "bg-gray-100 text-gray-400 border-gray-200"
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-gray-700">{student.name}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5">ID: {student.studentId} · Class {student.grade}-{student.section}</p>
                          </td>
                          <td className="py-4 px-4 font-black text-emerald-600 text-sm">
                            {student.score} / {student.totalQuestions}
                          </td>
                          <td className="py-4 px-4 font-mono font-medium text-gray-600">
                            {formattedTime}
                          </td>
                          <td className="py-4 px-4">
                            {student.tabSwitches > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-none">
                                <AlertTriangle size={10} />
                                {student.tabSwitches} Alert{student.tabSwitches > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-gray-400">
                                <ShieldCheck size={11} className="text-emerald-500" />
                                Locked
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {leaderboard.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    No participants successfully finalized submission.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
