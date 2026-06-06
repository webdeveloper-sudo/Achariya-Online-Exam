"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar, Search, RefreshCw, Trophy, Users, Activity, ArrowRight
} from "lucide-react";

export default function DirectorSessionsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("directorToken");
    const u = localStorage.getItem("directorUser");
    if (!t || !u) {
      router.push("/director/login");
      return;
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    fetchSessions();
  }, [token]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/director/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Error loading director sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = sessions.filter((s) =>
    s.assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.assessment.position || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.token.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSessions = sessions.length;
  const totalTeachers = sessions.reduce((acc, curr) => acc + curr.stats.participantCount, 0);
  const avgTurnout = totalSessions > 0 ? (totalTeachers / totalSessions).toFixed(1) : "0";

  const completedSessions = sessions.filter((s) => s.status === "COMPLETED");
  const overallAvgScore = completedSessions.length > 0
    ? (completedSessions.reduce((acc, curr) => acc + curr.stats.avgScore, 0) / completedSessions.length).toFixed(1)
    : "0";

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Sessions Conducted</h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse and audit all real-time teacher examination rooms initiated under your account.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by exam title, focus, token..."
              className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-4 py-2.5 text-xs focus:border-blue-600 outline-none transition-all placeholder:text-gray-400 text-gray-900 shadow-sm"
            />
          </div>
          <button
            onClick={fetchSessions}
            className="p-2.5 bg-white border border-gray-300 rounded-none text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Aggregate Metric widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white/80 border border-gray-200 rounded-none p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Rooms Run</span>
            <Activity size={18} className="text-blue-600" />
          </div>
          <p className="text-4xl font-black text-gray-900">{loading ? "—" : totalSessions}</p>
          <p className="text-[10px] text-gray-400 mt-1">Conducted from Director Console</p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Average Turnout</span>
            <Users size={18} className="text-blue-600" />
          </div>
          <p className="text-4xl font-black text-gray-900">{loading ? "—" : avgTurnout}</p>
          <p className="text-[10px] text-gray-400 mt-1">Teachers per session</p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Benchmark Avg Score</span>
            <Trophy size={18} className="text-emerald-600" />
          </div>
          <p className="text-4xl font-black text-emerald-600">{loading ? "—" : `${overallAvgScore} Qs`}</p>
          <p className="text-[10px] text-gray-400 mt-1">Across all completed teacher evaluation sessions</p>
        </div>
      </div>

      {/* Sessions list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-gray-100 border border-gray-200 rounded-none h-60 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-none h-80 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Calendar size={40} className="text-gray-300" />
          <p className="font-bold text-sm">
            {searchQuery ? "No conducted rooms match your search" : "No live session history found"}
          </p>
          <p className="text-xs text-gray-400 max-w-sm text-center leading-relaxed">
            Invite teachers in real-time by going to the <Link href="/director/assessments" className="text-blue-600 font-bold hover:underline">Assessments Repository</Link> and clicking &quot;Host Live&quot; on any paper!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((session) => {
            const formattedTime = new Date(session.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            });
            const totalQ = session.assessment.totalQuestions;

            return (
              <div 
                key={session.id} 
                className={`group relative bg-white border border-gray-200 rounded-none p-6 hover:border-blue-500 transition-all duration-300 flex flex-col justify-between min-h-[250px] ${
                  session.status === "ACTIVE" ? "shadow-[0_0_15px_-3px_rgba(59,130,246,0.25)] border-blue-400" : "shadow-sm hover:shadow-md"
                }`}
              >
                {/* Status Bar for Active Rooms */}
                {session.status === "ACTIVE" && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse" />
                )}

                <div>
                  {/* Status and timestamp */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-none border ${
                      session.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      session.status === "ACTIVE" ? "bg-blue-50 text-blue-600 border-blue-200" :
                      "bg-gray-100 text-gray-500 border-gray-200"
                    }`}>
                      {session.status === "ACTIVE" && (
                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
                        </span>
                      )}
                      {session.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                      <Calendar size={11} />
                      {formattedTime}
                    </span>
                  </div>

                  {/* Title & metadata */}
                  <h4 className="font-black text-base text-gray-900 group-hover:text-blue-600 transition-colors leading-tight mb-2 line-clamp-1">{session.assessment.title}</h4>
                  
                  <div className="space-y-1 mb-3">
                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Focus:</span>
                      <span className="font-bold text-gray-700">{session.assessment.position}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium line-clamp-1">{session.assessment.recruitmentFor}</p>
                  </div>
                </div>

                {/* Score Stats */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 my-4 bg-gray-50/50 px-2 text-center">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-gray-400 block uppercase">Teachers</span>
                    <span className="text-sm font-black text-gray-800 flex items-center justify-center gap-1">
                      <Users size={12} className="text-gray-400" />
                      {session.stats.participantCount}
                    </span>
                  </div>
                  <div className="space-y-0.5 border-l border-gray-200">
                    <span className="text-[9px] font-bold text-gray-400 block uppercase">Average</span>
                    <span className="text-sm font-black text-blue-600 block">
                      {session.status === "COMPLETED" ? `${session.stats.avgScore}/${totalQ}` : "—"}
                    </span>
                  </div>
                  <div className="space-y-0.5 border-l border-gray-200">
                    <span className="text-[9px] font-bold text-gray-400 block uppercase">Top Score</span>
                    <span className="text-sm font-black text-emerald-600 flex items-center justify-center gap-1">
                      <Trophy size={11} className="text-emerald-500" />
                      {session.status === "COMPLETED" ? `${session.stats.highScore}/${totalQ}` : "—"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/director/sessions/${session.id}`}
                    className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-2.5 rounded-none text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group-hover:border-blue-500/30"
                  >
                    <span>Open Roster Report</span>
                    <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                  </Link>

                  {session.status === "ACTIVE" && (
                    <Link
                      href={`/live/director/${session.token}/host`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-none text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-sm"
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
