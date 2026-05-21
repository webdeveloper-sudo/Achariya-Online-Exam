"use client";

import { useState, useEffect, use, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Calendar, Clock, Trophy, Users, BarChart2, ShieldAlert,
  ChevronDown, ChevronUp, AlertCircle, HelpCircle, Check, X, Shield
} from "lucide-react";

export default function TeacherLiveSessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const sessionId = unwrappedParams.id;
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("teacherToken");
    if (!t) {
      router.push("/teacher/login");
      return;
    }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token || !sessionId) return;
    fetchSessionDetails();
  }, [token, sessionId]);

  const fetchSessionDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/live/sessions/details/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSession(data.session);
      } else {
        setError(data.message || "Failed to load session details");
      }
    } catch (err) {
      console.error(err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentExpand = (studentId: string) => {
    setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <div className="h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <span className="font-bold">Compiling detailed session analytics...</span>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-8 space-y-6 max-w-2xl mx-auto text-center">
        <div className="h-16 w-16 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center text-rose-400 mx-auto">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-white">Analysis Compilation Failed</h3>
        <p className="text-slate-400 text-sm">{error || "The session report is unavailable or access was denied."}</p>
        <Link
          href="/teacher/live-sessions"
          className="inline-flex items-center gap-2 bg-slate-900 border border-white/5 px-6 py-3 rounded-2xl hover:bg-slate-800 text-sm font-bold text-slate-300"
        >
          <ArrowLeft size={16} /> Return to Conducted Rooms
        </Link>
      </div>
    );
  }

  const totalQuestions = session.assessment.totalQuestions;

  // Format Duration seconds
  const formatTime = (sec: number | null) => {
    if (sec === null || sec === undefined) return "N/A";
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return mins > 0 ? `${mins}m ${remainder}s` : `${remainder}s`;
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Back navigation & Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/teacher/live-sessions"
          className="p-3 bg-slate-900 border border-white/5 rounded-2xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Completed Assessment Report</span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
              session.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse"
            }`}>
              {session.status}
            </span>
          </div>
          <h2 className="text-2xl font-black mt-1 text-white">{session.assessment.title}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Subject: {session.assessment.subject} · Unit: {session.assessment.lesson} · Key code: <span className="font-mono text-indigo-400 font-bold">{session.token}</span>
          </p>
        </div>
      </div>

      {/* Overview Analytics Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl" />
          <div className="flex items-center gap-3 text-indigo-400 mb-3">
            <Users size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Student Roster</span>
          </div>
          <p className="text-3xl font-black">{session.stats.participantCount}</p>
          <p className="text-[10px] text-slate-500 mt-1">Turnout participated</p>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 rounded-full blur-xl" />
          <div className="flex items-center gap-3 text-violet-400 mb-3">
            <BarChart2 size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Class Average</span>
          </div>
          <p className="text-3xl font-black text-violet-400">{session.stats.avgScore} <span className="text-xs text-slate-500 font-bold">/ {totalQuestions} Qs</span></p>
          <p className="text-[10px] text-slate-500 mt-1">
            Accuracy: {totalQuestions > 0 ? ((session.stats.avgScore / totalQuestions) * 100).toFixed(0) : 0}%
          </p>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="flex items-center gap-3 text-emerald-400 mb-3">
            <Trophy size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Highest Score</span>
          </div>
          <p className="text-3xl font-black text-emerald-400">{session.stats.highScore} <span className="text-xs text-slate-500 font-bold">/ {totalQuestions}</span></p>
          <p className="text-[10px] text-slate-500 mt-1">Top-performer peak</p>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl" />
          <div className="flex items-center gap-3 text-rose-400 mb-3">
            <ShieldAlert size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Lowest Score</span>
          </div>
          <p className="text-3xl font-black text-rose-400">{session.stats.lowScore} <span className="text-xs text-slate-500 font-bold">/ {totalQuestions}</span></p>
          <p className="text-[10px] text-slate-500 mt-1">Lowest recorded grade</p>
        </div>
      </div>

      {/* Leaderboard & Detailed Student Log */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-black text-white">Student Leaderboard & Response Audit</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit detailed marks, duration metrics, anti-cheat indicators, and expand profiles to view single question answers.
          </p>
        </div>

        {session.participants.length === 0 ? (
          <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-12 text-center text-slate-500">
            No students joined this exam room.
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4 text-center w-16">Rank</th>
                    <th className="px-6 py-4">Student Details</th>
                    <th className="px-6 py-4">Grade & Section</th>
                    <th className="px-6 py-4">Duration Taken</th>
                    <th className="px-6 py-4">Integrity (Tab Switches)</th>
                    <th className="px-6 py-4">Marks Earned</th>
                    <th className="px-6 py-4 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {session.participants.map((p: any, idx: number) => {
                    const scorePercentage = totalQuestions > 0 ? (p.score / totalQuestions) * 100 : 0;
                    const isExpanded = expandedStudentId === p.id;

                    const assessmentQuestions = session.assessment.questions
                      ? (typeof session.assessment.questions === "string"
                          ? JSON.parse(session.assessment.questions)
                          : session.assessment.questions)
                      : [];

                    const studentAnswers = p.answers
                      ? (typeof p.answers === "string"
                          ? JSON.parse(p.answers)
                          : p.answers)
                      : {};

                    const answersArray = Array.isArray(assessmentQuestions)
                      ? assessmentQuestions.map((q: any, qIdx: number) => {
                          const studentAnswer = studentAnswers[q.id] || "No Answer";
                          const isCorrect = studentAnswer === q.correctAnswer;
                          return {
                            questionIndex: qIdx,
                            questionText: q.question,
                            studentAnswer,
                            correctAnswer: q.correctAnswer,
                            isCorrect,
                          };
                        })
                      : [];

                    // Color based on performance percentage
                    const barColor = scorePercentage >= 80 ? "bg-emerald-500" :
                                     scorePercentage >= 50 ? "bg-amber-500" : "bg-rose-500";

                    return (
                      <Fragment key={p.id}>
                        <tr className="hover:bg-white/[0.01] transition-colors">
                          {/* Rank */}
                          <td className="px-6 py-4 text-center">
                            {idx === 0 ? (
                              <span className="inline-flex h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black items-center justify-center text-[10px]" title="1st Place (Gold)">1st</span>
                            ) : idx === 1 ? (
                              <span className="inline-flex h-6 w-6 rounded-full bg-slate-300/10 border border-slate-300/30 text-slate-300 font-black items-center justify-center text-[10px]" title="2nd Place (Silver)">2nd</span>
                            ) : idx === 2 ? (
                              <span className="inline-flex h-6 w-6 rounded-full bg-amber-700/10 border border-amber-700/30 text-amber-600 font-black items-center justify-center text-[10px]" title="3rd Place (Bronze)">3rd</span>
                            ) : (
                              <span className="text-slate-500 font-bold">{idx + 1}</span>
                            )}
                          </td>

                          {/* Student Details */}
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-white text-sm">{p.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {p.studentId}</p>
                            </div>
                          </td>

                          {/* Grade & Section */}
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-300 bg-white/5 px-2.5 py-1 border border-white/5 rounded-xl">
                              {p.grade} - {p.section}
                            </span>
                          </td>

                          {/* Duration Taken */}
                          <td className="px-6 py-4 text-slate-300 font-mono">
                            {formatTime(p.timeTakenSeconds)}
                          </td>

                          {/* Integrity Info (Tab Switches) */}
                          <td className="px-6 py-4">
                            {p.tabSwitches > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full animate-pulse">
                                <ShieldAlert size={10} />
                                {p.tabSwitches} Warning{p.tabSwitches > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <Shield size={10} />
                                Verified Secured
                              </span>
                            )}
                          </td>

                          {/* Marks Earned / accuracy */}
                          <td className="px-6 py-4">
                            <div className="w-32 space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-300">{p.score !== null ? `${p.score} / ${totalQuestions}` : "Incomplete"}</span>
                                <span className="text-slate-500">{scorePercentage.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                                <div className={`h-full ${barColor} rounded-full`} style={{ width: `${scorePercentage}%` }} />
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => toggleStudentExpand(p.id)}
                              className="p-1.5 bg-white/5 border border-white/5 hover:border-emerald-500/20 rounded-lg hover:bg-emerald-500/5 text-slate-400 hover:text-emerald-400 transition-all flex items-center gap-1 font-bold text-[10px] mx-auto"
                            >
                              <span>Inspect</span>
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                          </td>
                        </tr>

                        {/* Collapsed Answers View */}
                        {isExpanded && (
                          <tr className="bg-slate-950/40">
                            <td colSpan={7} className="px-8 py-6 border-t border-b border-white/5">
                              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-black text-xs uppercase tracking-wider text-slate-400">Response Sheet Audit: {p.name}</h5>
                                  <span className="text-[10px] text-slate-500 font-mono">Time of Submission: {p.completedAt ? new Date(p.completedAt).toLocaleString() : "Never Completed"}</span>
                                </div>

                                {answersArray.length === 0 ? (
                                  <p className="text-xs text-slate-600 italic">No answered submissions recorded for this student.</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {answersArray.map((ans: any, aIdx: number) => (
                                      <div key={aIdx} className={`p-4 border rounded-2xl flex items-start gap-3 ${
                                        ans.isCorrect
                                          ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-300"
                                          : "bg-rose-500/5 border-rose-500/10 text-rose-300"
                                      }`}>
                                        <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                          ans.isCorrect
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "bg-rose-500/10 text-rose-400"
                                        }`}>
                                          {ans.isCorrect ? <Check size={10} /> : <X size={10} />}
                                        </span>
                                        <div className="text-xs space-y-1">
                                          <p className="font-bold text-white">Q{ans.questionIndex + 1}: {ans.questionText || `Question ${ans.questionIndex + 1}`}</p>
                                          <p className="text-[11px] text-slate-400 mt-1">
                                            Student Selection: <span className="font-extrabold text-slate-200">{ans.studentAnswer || "N/A"}</span>
                                          </p>
                                          {!ans.isCorrect && (
                                            <p className="text-[11px] text-emerald-400">
                                              ✔ Expected Solution: <span className="font-extrabold">{ans.correctAnswer}</span>
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
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
    </div>
  );
}
