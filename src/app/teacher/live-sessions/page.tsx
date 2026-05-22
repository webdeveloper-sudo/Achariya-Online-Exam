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
          <h2 className="text-3xl font-black text-gray-900">Conducted Exam Rooms</h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse and inspect historical performance logs of all real-time assessments hosted under your account.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by exam title, subject, token..."
              className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-4 py-2.5 text-xs text-gray-900 focus:border-blue-600 outline-none transition-all placeholder-gray-400"
            />
          </div>
          <button
            onClick={fetchSessions}
            className="p-2.5 bg-white border border-gray-300 rounded-none text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Aggregate Metric widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white/80 border border-gray-200 rounded-none p-6 shadow-sm relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/2 blur-xl" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Rooms Run</span>
            <Activity size={18} className="text-blue-600" />
          </div>
          <p className="text-4xl font-black text-gray-900">{loading ? "—" : totalSessions}</p>
          <p className="text-[10px] text-gray-400 mt-1">Launched from your workspace</p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-6 shadow-sm relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/2 blur-xl" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Average Turnout</span>
            <Users size={18} className="text-blue-600" />
          </div>
          <p className="text-4xl font-black text-gray-900">{loading ? "—" : avgTurnout}</p>
          <p className="text-[10px] text-gray-400 mt-1">Students per live room</p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-6 shadow-sm relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-brand-red/2 blur-xl" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Benchmark Avg Score</span>
            <Trophy size={18} className="text-brand-red" />
          </div>
          <p className="text-4xl font-black text-brand-red">{loading ? "—" : `${overallAvgScore} Qs`}</p>
          <p className="text-[10px] text-gray-400 mt-1">Across all completed exams</p>
        </div>
      </div>

      {/* Roster list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-gray-200 rounded-none h-60 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-none h-80 flex flex-col items-center justify-center gap-3 text-gray-500 shadow-sm">
          <Calendar size={40} className="text-gray-400" />
          <p className="font-bold">
            {searchQuery ? "No conducted rooms match your search" : "No live session history found"}
          </p>
          <p className="text-xs text-gray-500 max-w-sm text-center leading-relaxed">
            Invite students in real-time by going to the <Link href="/teacher/assessments" className="text-blue-600 font-bold hover:underline">Assessments Repository</Link> and clicking "Host Live" on any paper!
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
              <div key={session.id} className="bg-white/80 border border-gray-200 rounded-none p-6 relative overflow-hidden hover:border-blue-500/40 transition-all shadow-sm backdrop-blur-sm group flex flex-col justify-between min-h-[240px]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/2 blur-2xl pointer-events-none" />

                <div>
                  {/* Status and timestamp */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-none border ${
                      session.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      session.status === "ACTIVE" ? "bg-blue-50 text-blue-600 border-blue-100 animate-pulse" :
                      "bg-gray-100 text-gray-600 border-gray-200"
                    }`}>
                      {session.status}
                    </span>
                    <span className="text-[10px] text-gray-500">{formattedTime}</span>
                  </div>

                  {/* Title & metadata */}
                  <h4 className="font-black text-base text-gray-900 leading-tight mb-1 line-clamp-1">{session.assessment.title}</h4>
                  <p className="text-xs text-gray-500 mb-4">{session.assessment.subject} · {session.assessment.lesson}</p>
                </div>

                {/* Score Stats / metrics list */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-150 my-4 bg-gray-50/50 rounded-none px-3 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-gray-500 block uppercase">Students</span>
                    <span className="text-sm font-extrabold text-gray-900 mt-0.5 block">{session.stats.participantCount}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-500 block uppercase">Average</span>
                    <span className="text-sm font-extrabold text-blue-600 mt-0.5 block">
                      {session.status === "COMPLETED" ? `${session.stats.avgScore}/${totalQ}` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-500 block uppercase">Top Score</span>
                    <span className="text-sm font-extrabold text-emerald-600 mt-0.5 block">
                      {session.status === "COMPLETED" ? `${session.stats.highScore}/${totalQ}` : "—"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/teacher/live-sessions/${session.id}`}
                    className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-2.5 rounded-none text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Open Roster Report <ArrowRight size={12} />
                  </Link>

                  {session.status === "ACTIVE" && (
                    <Link
                      href={`/live/${session.token}/host`}
                      className="bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white px-3 py-2.5 rounded-none text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
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
