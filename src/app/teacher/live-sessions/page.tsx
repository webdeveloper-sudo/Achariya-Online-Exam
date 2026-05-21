"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar, Search, RefreshCw, Trophy, Users, BarChart2,
  ArrowRight, Activity, Trash2, HelpCircle, Compass, Globe
} from "lucide-react";

export default function TeacherLiveSessionsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("teacherToken");
    const u = localStorage.getItem("teacherUser");
    if (!t || !u) {
      router.push("/teacher/login");
      return;
    }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchSessions();
  }, [token]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/live-sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = sessions.filter((s) =>
    s.assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.assessment.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.token.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute Quick aggregate metrics
  const totalSessions = sessions.length;
  const totalStudents = sessions.reduce((acc, curr) => acc + curr.stats.participantCount, 0);
  const avgTurnout = totalSessions > 0 ? (totalStudents / totalSessions).toFixed(1) : "0";
  
  const completedSessions = sessions.filter(s => s.status === "COMPLETED");
  const overallAvgScore = completedSessions.length > 0
    ? (completedSessions.reduce((acc, curr) => acc + curr.stats.avgScore, 0) / completedSessions.length).toFixed(1)
    : "0";

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">Conducted Exam Rooms</h2>
          <p className="text-sm text-slate-400 mt-1">
            Browse and inspect historical performance logs of all real-time assessments hosted under your account.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by exam title, subject, token..."
              className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:border-emerald-500 outline-none transition-all placeholder-slate-500"
            />
          </div>
          <button
            onClick={fetchSessions}
            className="p-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Aggregate Metric widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Rooms Run</span>
            <Activity size={18} className="text-emerald-400" />
          </div>
          <p className="text-4xl font-black">{loading ? "—" : totalSessions}</p>
          <p className="text-[10px] text-slate-500 mt-1">Launched from your workspace</p>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Turnout</span>
            <Users size={18} className="text-indigo-400" />
          </div>
          <p className="text-4xl font-black">{loading ? "—" : avgTurnout}</p>
          <p className="text-[10px] text-slate-500 mt-1">Students per live room</p>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Benchmark Avg Score</span>
            <Trophy size={18} className="text-violet-400" />
          </div>
          <p className="text-4xl font-black text-violet-400">{loading ? "—" : `${overallAvgScore} Qs`}</p>
          <p className="text-[10px] text-slate-500 mt-1">Across all completed exams</p>
        </div>
      </div>

      {/* Roster list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-900/30 border border-white/5 rounded-3xl h-60 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/20 border border-dashed border-white/5 rounded-3xl h-80 flex flex-col items-center justify-center gap-3 text-slate-600">
          <Calendar size={40} className="text-slate-700" />
          <p className="font-bold">
            {searchQuery ? "No conducted rooms match your search" : "No live session history found"}
          </p>
          <p className="text-xs text-slate-500 max-w-sm text-center leading-relaxed">
            Invite students in real-time by going to the <Link href="/teacher/assessments" className="text-emerald-400 font-bold hover:underline">Assessments Repository</Link> and clicking "Host Live" on any paper!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((session) => {
            const formattedTime = new Date(session.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short"
            });
            const totalQ = session.assessment.totalQuestions;

            return (
              <div key={session.id} className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden hover:border-white/10 transition-all shadow-xl group flex flex-col justify-between min-h-[240px]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/2 rounded-full blur-2xl pointer-events-none" />

                <div>
                  {/* Status and timestamp */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      session.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      session.status === "ACTIVE" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse" :
                      "bg-slate-800 text-slate-400 border-white/5"
                    }`}>
                      {session.status}
                    </span>
                    <span className="text-[10px] text-slate-500">{formattedTime}</span>
                  </div>

                  {/* Title & metadata */}
                  <h4 className="font-black text-base text-white leading-tight mb-1 line-clamp-1">{session.assessment.title}</h4>
                  <p className="text-xs text-slate-400 mb-4">{session.assessment.subject} · {session.assessment.lesson}</p>
                </div>

                {/* Score Stats / metrics list */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-white/5 my-4 bg-slate-950/20 rounded-2xl px-3 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">Students</span>
                    <span className="text-sm font-extrabold text-slate-200 mt-0.5 block">{session.stats.participantCount}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">Average</span>
                    <span className="text-sm font-extrabold text-violet-400 mt-0.5 block">
                      {session.status === "COMPLETED" ? `${session.stats.avgScore}/${totalQ}` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">Top Score</span>
                    <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">
                      {session.status === "COMPLETED" ? `${session.stats.highScore}/${totalQ}` : "—"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/teacher/live-sessions/${session.id}`}
                    className="flex-1 bg-white/5 hover:bg-emerald-600 hover:text-white border border-white/5 hover:border-emerald-600 text-slate-300 px-3 py-2.5 rounded-xl text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Open Roster Report <ArrowRight size={12} />
                  </Link>

                  {session.status === "ACTIVE" && (
                    <Link
                      href={`/live/${session.token}/host`}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2.5 rounded-xl text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Connect Room
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
