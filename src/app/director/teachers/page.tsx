"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, RefreshCw, FolderOpen, AlertTriangle, ShieldCheck, ShieldAlert,
  Mail, Phone, Award, Users, ChevronDown, ChevronUp,
  CheckCircle2, BookOpen, School
} from "lucide-react";

export default function DirectorTeachersPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

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
    fetchTeachers();
  }, [token]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/director/teachers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error("Error loading teacher registry:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.userId.toLowerCase().includes(q) ||
      (t.phone || "").includes(q) ||
      (t.designation || "").toLowerCase().includes(q) ||
      (t.branch || "").toLowerCase().includes(q)
    );
  });

  const totalTeachers = teachers.length;
  const totalAttempts = teachers.reduce((acc, t) => acc + t.assessmentCount, 0);
  const disqualifiedCount = teachers.filter((t) => t.hasTerminated).length;
  const completedCount = teachers.filter((t) => t.latestCompletedAt && !t.hasTerminated).length;

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Teacher Registry</h2>
          <p className="text-sm text-gray-500 mt-1">
            Centralised registry of all unique educators who participated in live evaluations — deduplicated by Employee ID and Email.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:max-w-sm">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, employee ID, branch..."
              className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-4 py-2.5 text-xs focus:border-blue-600 outline-none text-gray-900 placeholder-gray-400 shadow-sm"
            />
          </div>
          <button
            onClick={fetchTeachers}
            className="p-2.5 bg-white border border-gray-300 rounded-none text-gray-400 hover:text-gray-950 transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 border border-gray-200 rounded-none p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Unique Teachers</span>
            <Users size={16} className="text-blue-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">{loading ? "—" : totalTeachers}</p>
          <p className="text-[10px] text-gray-400 mt-1">In registry</p>
        </div>
        <div className="bg-white/80 border border-gray-200 rounded-none p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Total Attempts</span>
            <BookOpen size={16} className="text-purple-600" />
          </div>
          <p className="text-3xl font-black text-purple-600">{loading ? "—" : totalAttempts}</p>
          <p className="text-[10px] text-gray-400 mt-1">Across all assessments</p>
        </div>
        <div className="bg-white/80 border border-gray-200 rounded-none p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Completed</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600">{loading ? "—" : completedCount}</p>
          <p className="text-[10px] text-gray-400 mt-1">Fully submitted</p>
        </div>
        <div className="bg-white/80 border border-gray-200 rounded-none p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Disqualified</span>
            <ShieldAlert size={16} className="text-red-500" />
          </div>
          <p className="text-3xl font-black text-red-500">{loading ? "—" : disqualifiedCount}</p>
          <p className="text-[10px] text-gray-400 mt-1">Tab-violation lockouts</p>
        </div>
      </div>

      {/* Teacher registry table */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-none h-96 animate-pulse shadow-sm" />
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white/40 border border-dashed border-gray-300 rounded-none h-80 flex flex-col items-center justify-center gap-3 text-gray-400 shadow-sm backdrop-blur-sm">
          <FolderOpen size={44} className="text-gray-300" />
          <p className="font-bold text-sm text-gray-600">
            {searchQuery ? "No teachers match your search" : "No teachers have registered yet"}
          </p>
          <p className="text-xs text-gray-400 max-w-xs text-center leading-relaxed">
            Teachers appear here once they join a live evaluation session for any of your assessments.
          </p>
        </div>
      ) : (
        <div className="bg-white/80 border border-gray-200 rounded-none overflow-hidden shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">Educator details</th>
                  <th className="px-6 py-4">Designation &amp; Branch</th>
                  <th className="px-6 py-4 text-center">Registry State</th>
                  <th className="px-6 py-4 text-center">Evaluations Taken</th>
                  <th className="px-6 py-4">Latest Score</th>
                  <th className="px-6 py-4">Integrity Flag</th>
                  <th className="px-6 py-4 text-center w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => {
                  const isExpanded = expandedEmail === t.email;
                  const latestPercentage =
                    t.latestScore !== null && t.latestTotalQuestions
                      ? Math.round((t.latestScore / t.latestTotalQuestions) * 100)
                      : null;

                  return (
                    <Fragment key={t.email}>
                      <tr className="hover:bg-gray-50/30 transition-all border-b border-gray-100">
                        {/* Name, email, phone */}
                        <td className="px-6 py-4 space-y-1 max-w-[200px]">
                          <Link
                            href={`/director/teachers/${encodeURIComponent(t.email)}`}
                            className="font-black text-sm text-gray-900 hover:text-blue-600 hover:underline transition-colors cursor-pointer block"
                          >
                            {t.name}
                          </Link>
                          <p className="text-[10px] text-gray-500 font-bold">Emp ID: {t.userId}</p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
                            <Mail size={11} className="shrink-0" />
                            <span className="truncate">{t.email}</span>
                          </p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
                            <Phone size={11} className="shrink-0" />
                            <span>{t.phone}</span>
                          </p>
                        </td>

                        {/* Designation & Branch */}
                        <td className="px-6 py-4 space-y-1">
                          <p className="font-bold text-gray-700">{t.designation || "Not Specified"}</p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <School size={11} className="text-blue-600 shrink-0" />
                            <span>{t.branch || "Branch N/A"}</span>
                          </p>
                          <p className="text-[10px] text-gray-450 italic">Qual: {t.qualification || "None"}</p>
                        </td>

                        {/* Registry state */}
                        <td className="px-6 py-4 text-center">
                          {t.activated ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                              Activated
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                              Non-activated
                            </span>
                          )}
                        </td>

                        {/* Assessments count badge */}
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="text-2xl font-black text-blue-600">{t.assessmentCount}</span>
                            <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                              {t.assessmentCount === 1 ? "attempt" : "attempts"}
                            </span>
                          </div>
                        </td>

                        {/* Latest score */}
                        <td className="px-6 py-4">
                          {t.hasTerminated ? (
                            <span className="font-black text-red-500 text-xs uppercase">Disqualified</span>
                          ) : t.latestScore !== null && t.latestTotalQuestions ? (
                            <div className="space-y-1">
                              <p className="font-black text-sm text-emerald-600">{latestPercentage}%</p>
                              <p className="text-[10px] text-gray-500 font-bold">{t.latestScore} / {t.latestTotalQuestions} Marks</p>
                            </div>
                          ) : t.latestCompletedAt === null ? (
                            <span className="text-amber-500 font-bold text-xs">Not Submitted</span>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>

                        {/* Integrity status */}
                        <td className="px-6 py-4">
                          {t.hasTerminated ? (
                            <div className="flex items-center gap-1.5 text-red-500 font-bold">
                              <ShieldAlert size={13} className="shrink-0 animate-pulse" />
                              <span className="text-xs">Disqualified</span>
                            </div>
                          ) : t.tabSwitches > 0 ? (
                            <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                              <AlertTriangle size={13} className="shrink-0" />
                              <span className="text-xs">{t.tabSwitches} Warning{t.tabSwitches > 1 ? "s" : ""}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                              <ShieldCheck size={13} className="shrink-0" />
                              <span className="text-xs">Clean Record</span>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Link
                              href={`/director/teachers/${encodeURIComponent(t.email)}`}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white rounded-none font-bold text-[10px] transition-all cursor-pointer shadow-sm"
                            >
                              Full Profile
                            </Link>
                            {t.assessmentCount > 1 && (
                              <button
                                onClick={() => setExpandedEmail(isExpanded ? null : t.email)}
                                className="p-1.5 bg-white border border-gray-200 hover:border-gray-400 rounded-none hover:bg-gray-50 text-gray-500 transition-all flex items-center gap-1 font-bold text-[10px] mx-auto cursor-pointer"
                              >
                                <span>{isExpanded ? "Collapse" : `All ${t.assessmentCount} Attempts`}</span>
                                {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded: Attempt history */}
                      {isExpanded && t.attempts && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={7} className="px-8 py-6 border-t border-b border-gray-100">
                            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                              <h5 className="font-black text-xs uppercase tracking-wider text-gray-500 mb-2">
                                Evaluation Attempt History — {t.name}
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {t.attempts.map((attempt: any, aIdx: number) => {
                                  const aPct = attempt.score !== null && attempt.totalQuestions
                                    ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                                    : null;
                                  return (
                                    <div key={attempt.id || aIdx} className="bg-white border border-gray-200 rounded-none p-4 space-y-2 shadow-sm">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Attempt #{aIdx + 1}</span>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 border rounded-none ${
                                          attempt.terminated ? "bg-red-50 text-red-600 border-red-200" :
                                          attempt.completedAt ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                          "bg-amber-50 text-amber-500 border-amber-200"
                                        }`}>
                                          {attempt.terminated ? "Disqualified" : attempt.completedAt ? "Completed" : "Incomplete"}
                                        </span>
                                      </div>
                                      <p className="font-bold text-gray-800 text-xs truncate">{attempt.assessmentTitle || "Academic Exam"}</p>
                                      <p className="text-[10px] text-gray-450">Focus: <span className="font-bold text-gray-600">{attempt.position || "N/A"}</span></p>
                                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                        <span className="text-[10px] text-gray-400">
                                          {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : attempt.joinedAt ? new Date(attempt.joinedAt).toLocaleDateString() : "—"}
                                        </span>
                                        <span className={`font-black text-sm ${attempt.terminated ? "text-red-500" : aPct !== null ? (aPct >= 60 ? "text-emerald-600" : "text-amber-500") : "text-gray-400"}`}>
                                          {attempt.terminated ? "DQ" : aPct !== null ? `${aPct}%` : "—"}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
