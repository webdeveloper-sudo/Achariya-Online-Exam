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

      if (data.status === "COMPLETED") {
        deriveLeaderboard(data.participants || []);
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
        if (data.status === "COMPLETED") {
          deriveLeaderboard(data.participants || []);
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader className="animate-spin text-emerald-400 mb-4" size={40} />
        <p className="text-sm text-slate-400">Loading educator hosting panel...</p>
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
          <h2 className="text-xl font-black text-white">Hosting Inaccessible</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
          <button onClick={() => router.push("/teacher/assessments")} className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-sm transition-all">
            Return to Repository
          </button>
        </div>
      </div>
    );
  }

  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/live/${token}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-[-10%] w-[50%] h-[40%] rounded-full bg-emerald-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[130px] pointer-events-none" />

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6 relative z-10 overflow-y-auto">
        
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/teacher/assessments/${assessment?.id}`)}
              className="p-2.5 bg-slate-900 border border-white/5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-md">Live Control</span>
                <span className="text-xs font-bold text-slate-500">· Room Status: {sessionStatus}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black mt-1">{assessment?.title}</h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {sessionStatus === "WAITING" && (
              <button
                disabled={roster.length === 0 || actionLoading}
                onClick={startAssessment}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all"
              >
                {actionLoading ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
                Start Assessment
              </button>
            )}

            {sessionStatus === "ACTIVE" && (
              <button
                disabled={actionLoading}
                onClick={endAssessment}
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 disabled:opacity-50 px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 transition-all"
              >
                {actionLoading ? <Loader size={16} className="animate-spin" /> : <Square size={16} />}
                End Assessment
              </button>
            )}

            {sessionStatus === "COMPLETED" && (
              <button
                disabled
                className="w-full sm:w-auto bg-slate-900 border border-white/5 text-slate-500 px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
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
              <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold">Invite Students</h3>
                  <p className="text-xs text-slate-400 mt-1">Share the following live access connection URL with your roster class.</p>
                </div>

                <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 space-y-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Access Link</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      type="text"
                      value={joinUrl}
                      className="bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-slate-400 flex-1 outline-none truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center justify-center text-white transition-all"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration Limit</span>
                    <span className="font-bold">{assessment?.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Questions</span>
                    <span className="font-bold">
                      {Array.isArray(assessment?.questions)
                        ? assessment?.questions.length
                        : JSON.parse(assessment?.questions || "[]").length} Questions
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live student roster column */}
            <div className="md:col-span-2 bg-slate-900/60 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 flex flex-col">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">Waiting Queue</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Students ready to initiate the assessment</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 border border-indigo-500/20 rounded-full">
                  {roster.length} Connected
                </span>
              </div>

              {roster.length === 0 ? (
                <div className="flex-1 border-2 border-dashed border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Users className="text-slate-700" size={32} />
                  <p className="text-sm font-bold text-slate-400">Roster Queue Empty</p>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Share the invitation link to wait for participants. Roster will update instantly in real time.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {roster.map((student, idx) => (
                    <div key={student.id || idx} className="bg-slate-950 border border-white/5 rounded-2xl p-4 flex items-center gap-3 hover:border-white/10 transition-all">
                      <div className="h-9 w-9 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-xs">
                        {student.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate text-slate-200">{student.name}</p>
                        <p className="text-[9px] text-slate-500 truncate mt-0.5">ID: {student.studentId} · Grade {student.grade}-{student.section}</p>
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
              <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold">Assessment Terminal</h3>
                  <p className="text-xs text-slate-400 mt-1">Real-time supervision of active exam submissions.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 text-center">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Active Roster</p>
                    <p className="text-2xl font-black text-indigo-400 mt-1">{roster.length}</p>
                  </div>
                  <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 text-center">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Submitted</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">
                      {roster.filter((r) => r.completedAt).length}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Elapsed Limit</p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">Duration: {assessment?.duration} Mins</p>
                  </div>
                  <div className={`px-4 py-2 border rounded-xl font-mono font-bold text-sm ${
                    timeLeft !== null && timeLeft < 60
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse"
                      : "bg-slate-900 border-white/5 text-emerald-400"
                  }`}>
                    {timeLeft !== null ? formatTime(timeLeft) : "00:00"}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Student Supervisor */}
            <div className="md:col-span-2 bg-slate-900/60 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">Active Roster Monitoring</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Live updates of exam activity & integrity logs</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {roster.map((student, idx) => {
                  const isSubmitted = !!student.completedAt;

                  return (
                    <div key={student.id || idx} className="bg-slate-950 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isSubmitted ? "bg-emerald-500/10 text-emerald-400" : "bg-indigo-500/10 text-indigo-400"
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{student.name}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">ID: {student.studentId} · Class {student.grade}-{student.section}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 text-xs">
                        {student.tabSwitches && student.tabSwitches > 0 ? (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            <AlertTriangle size={10} />
                            {student.tabSwitches} Tab Out{student.tabSwitches > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500">
                            <ShieldCheck size={11} className="text-emerald-500" />
                            Secure Lock
                          </span>
                        )}

                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          isSubmitted
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-900 text-slate-400 border border-white/5 animate-pulse"
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
              <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold">Assessment Complete</h3>
                  <p className="text-xs text-slate-400 mt-1">Conducted session metrics and aggregated analytics.</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-950 border border-white/5 rounded-2xl p-4">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Conducted</p>
                    <p className="text-sm font-bold text-slate-200 mt-1">
                      {startedAt ? new Date(startedAt).toLocaleDateString() : "N/A"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {startedAt ? new Date(startedAt).toLocaleTimeString() : ""}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 text-center">
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Top Score</p>
                      <p className="text-2xl font-black text-indigo-400 mt-1">
                        {leaderboard.length > 0 ? Math.max(...leaderboard.map((l) => l.score)) : 0}
                      </p>
                    </div>
                    <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 text-center">
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Average</p>
                      <p className="text-2xl font-black text-emerald-400 mt-1">
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
            <div className="lg:col-span-2 bg-slate-900/60 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                  <Trophy size={18} />
                </div>
                <div>
                  <h3 className="font-black text-lg">Class Results Leaderboard</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ranked by score (primary) and time taken (tie-breaker)</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-2">Rank</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Time Taken</th>
                      <th className="py-3 px-4">Integrity Logs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leaderboard.map((student, idx) => {
                      const formattedTime = `${Math.floor(student.timeTakenSeconds / 60)}:${(student.timeTakenSeconds % 60).toString().padStart(2, "0")}`;

                      return (
                        <tr key={student.id || idx} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-4 px-2">
                            <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-black ${
                              idx === 0 ? "bg-amber-500 text-slate-950" :
                              idx === 1 ? "bg-slate-300 text-slate-950" :
                              idx === 2 ? "bg-amber-700 text-white" :
                              "bg-slate-900 text-slate-500"
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-200">{student.name}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">ID: {student.studentId} · Class {student.grade}-{student.section}</p>
                          </td>
                          <td className="py-4 px-4 font-black text-emerald-400 text-sm">
                            {student.score} / {student.totalQuestions}
                          </td>
                          <td className="py-4 px-4 font-mono font-medium text-slate-300">
                            {formattedTime}
                          </td>
                          <td className="py-4 px-4">
                            {student.tabSwitches > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                                <AlertTriangle size={10} />
                                {student.tabSwitches} Alert{student.tabSwitches > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-slate-500">
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
                  <div className="text-center py-12 text-slate-500">
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
