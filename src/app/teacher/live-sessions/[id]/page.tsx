"use client";

import { useState, useEffect, use, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Calendar, Clock, Trophy, Users, BarChart2, ShieldAlert,
  ChevronDown, ChevronUp, AlertCircle, HelpCircle, Check, X, Shield
} from "lucide-react";
import Loader from "@/components/Loader";

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
    return <Loader variant="card" message="Compiling detailed session analytics..." className="min-h-[60vh]" />;
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
          className="p-3 bg-white border border-gray-300 rounded-none hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Completed Assessment Report</span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-none border ${
              session.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100 animate-pulse"
            }`}>
              {session.status}
            </span>
          </div>
          <h2 className="text-2xl font-black mt-1 text-gray-900">{session.assessment.title}</h2>
          <p className="text-xs text-gray-500 mt-1">
            Subject: {session.assessment.subject} · Unit: {session.assessment.lesson} · Key code: <span className="font-mono text-blue-600 font-bold">{session.token}</span>
          </p>
        </div>
      </div>

      {/* Overview Analytics Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white/80 border border-gray-200 rounded-none p-5 shadow-sm relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/2 blur-xl" />
          <div className="flex items-center gap-3 text-blue-600 mb-3">
            <Users size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Student Roster</span>
          </div>
          <p className="text-3xl font-black text-gray-900">{session.stats.participantCount}</p>
          <p className="text-[10px] text-gray-400 mt-1">Turnout participated</p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-5 shadow-sm relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/2 blur-xl" />
          <div className="flex items-center gap-3 text-blue-600 mb-3">
            <BarChart2 size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Class Average</span>
          </div>
          <p className="text-3xl font-black text-blue-600">{session.stats.avgScore} <span className="text-xs text-gray-400 font-bold">/ {totalQuestions} Qs</span></p>
          <p className="text-[10px] text-gray-400 mt-1">
            Accuracy: {totalQuestions > 0 ? ((session.stats.avgScore / totalQuestions) * 100).toFixed(0) : 0}%
          </p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-5 shadow-sm relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/2 blur-xl" />
          <div className="flex items-center gap-3 text-emerald-600 mb-3">
            <Trophy size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Highest Score</span>
          </div>
          <p className="text-3xl font-black text-emerald-600">{session.stats.highScore} <span className="text-xs text-gray-400 font-bold">/ {totalQuestions}</span></p>
          <p className="text-[10px] text-gray-400 mt-1">Top-performer peak</p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-5 shadow-sm relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-red/2 blur-xl" />
          <div className="flex items-center gap-3 text-brand-red mb-3">
            <ShieldAlert size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Lowest Score</span>
          </div>
          <p className="text-3xl font-black text-brand-red">{session.stats.lowScore} <span className="text-xs text-gray-400 font-bold">/ {totalQuestions}</span></p>
          <p className="text-[10px] text-gray-400 mt-1">Lowest recorded grade</p>
        </div>
      </div>

      {/* Leaderboard & Detailed Student Log */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-black text-gray-900">Student Leaderboard & Response Audit</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit detailed marks, duration metrics, anti-cheat indicators, and expand profiles to view single question answers.
          </p>
        </div>

        {session.participants.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-none p-12 text-center text-gray-500 shadow-sm">
            No students joined this exam room.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-none overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-4 text-center w-16">Rank</th>
                    <th className="px-6 py-4">Student Details</th>
                    <th className="px-6 py-4">Grade & Section</th>
                    <th className="px-6 py-4">Duration Taken</th>
                    <th className="px-6 py-4">Integrity (Tab Switches)</th>
                    <th className="px-6 py-4">Marks Earned</th>
                    <th className="px-6 py-4 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
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
                                     scorePercentage >= 50 ? "bg-amber-500" : "bg-brand-red";

                    return (
                      <Fragment key={p.id}>
                        <tr className="hover:bg-gray-50/30 transition-colors">
                          {/* Rank */}
                          <td className="px-6 py-4 text-center">
                            {idx === 0 ? (
                              <span className="inline-flex h-6 w-6 rounded-none bg-amber-50 border border-amber-200 text-amber-600 font-black items-center justify-center text-[10px]" title="1st Place (Gold)">1st</span>
                            ) : idx === 1 ? (
                              <span className="inline-flex h-6 w-6 rounded-none bg-gray-50 border border-gray-200 text-gray-500 font-black items-center justify-center text-[10px]" title="2nd Place (Silver)">2nd</span>
                            ) : idx === 2 ? (
                              <span className="inline-flex h-6 w-6 rounded-none bg-amber-100 border border-amber-300 text-amber-700 font-black items-center justify-center text-[10px]" title="3rd Place (Bronze)">3rd</span>
                            ) : (
                              <span className="text-gray-400 font-bold">{idx + 1}</span>
                            )}
                          </td>

                          {/* Student Details */}
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {p.studentId}</p>
                            </div>
                          </td>

                          {/* Grade & Section */}
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-700 bg-gray-50 px-2.5 py-1 border border-gray-200 rounded-none">
                              {p.grade} - {p.section}
                            </span>
                          </td>

                          {/* Duration Taken */}
                          <td className="px-6 py-4 text-gray-700 font-mono">
                            {formatTime(p.timeTakenSeconds)}
                          </td>

                          {/* Integrity Info (Tab Switches) */}
                          <td className="px-6 py-4">
                            {p.tabSwitches > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-red bg-red-50 border border-red-100 px-2 py-0.5 rounded-none animate-pulse">
                                <ShieldAlert size={10} />
                                {p.tabSwitches} Warning{p.tabSwitches > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-none">
                                <Shield size={10} />
                                Verified Secured
                              </span>
                            )}
                          </td>

                          {/* Marks Earned / accuracy */}
                          <td className="px-6 py-4">
                            <div className="w-32 space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-gray-700">{p.score !== null ? `${p.score} / ${totalQuestions}` : "Incomplete"}</span>
                                <span className="text-gray-500">{scorePercentage.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-none overflow-hidden border border-gray-200">
                                <div className={`h-full ${barColor} rounded-none`} style={{ width: `${scorePercentage}%` }} />
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => toggleStudentExpand(p.id)}
                              className="p-1.5 bg-white border border-gray-300 hover:border-gray-400 rounded-none text-gray-650 hover:text-gray-900 transition-all flex items-center gap-1 font-bold text-[10px] mx-auto cursor-pointer"
                            >
                              <span>Inspect</span>
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                          </td>
                        </tr>

                        {/* Collapsed Answers View */}
                        {isExpanded && (
                          <tr className="bg-gray-50/50">
                            <td colSpan={7} className="px-8 py-6 border-t border-b border-gray-250">
                              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-black text-xs uppercase tracking-wider text-gray-600">Response Sheet Audit: {p.name}</h5>
                                  <span className="text-[10px] text-gray-400 font-mono">Time of Submission: {p.completedAt ? new Date(p.completedAt).toLocaleString() : "Never Completed"}</span>
                                </div>

                                {answersArray.length === 0 ? (
                                  <p className="text-xs text-gray-500 italic">No answered submissions recorded for this student.</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {answersArray.map((ans: any, aIdx: number) => (
                                      <div key={aIdx} className={`p-4 border rounded-none flex items-start gap-3 ${
                                        ans.isCorrect
                                          ? "bg-emerald-50 border-emerald-150 text-emerald-800"
                                          : "bg-red-50 border-red-150 text-brand-red"
                                      }`}>
                                        <span className={`h-5 w-5 rounded-none flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                          ans.isCorrect
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-red-100 text-brand-red"
                                        }`}>
                                          {ans.isCorrect ? <Check size={10} /> : <X size={10} />}
                                        </span>
                                        <div className="text-xs space-y-1">
                                          <p className="font-bold text-gray-900">Q{ans.questionIndex + 1}: {ans.questionText || `Question ${ans.questionIndex + 1}`}</p>
                                          <p className="text-[11px] text-gray-500 mt-1">
                                            Student Selection: <span className="font-extrabold text-gray-800">{ans.studentAnswer || "N/A"}</span>
                                          </p>
                                          {!ans.isCorrect && (
                                            <p className="text-[11px] text-emerald-700 font-bold">
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
