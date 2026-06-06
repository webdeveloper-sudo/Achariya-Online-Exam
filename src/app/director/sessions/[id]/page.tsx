"use client";

import { useState, useEffect, use, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Trophy, Users, BarChart2, ShieldAlert,
  ChevronDown, ChevronUp, AlertCircle, Check, X, Shield, Mail, Phone, Award, School, Briefcase,
  Download
} from "lucide-react";
import * as XLSX from "xlsx";

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export default function DirectorLiveSessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const sessionId = unwrappedParams.id;
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [sharingStudentId, setSharingStudentId] = useState<string | null>(null);
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);
  const [shareErrorMsg, setShareErrorMsg] = useState<string | null>(null);

  const handleExportExcel = () => {
    if (!session || !session.participants) return;

    const totalQuestionsCount = session.assessment?.totalQuestions || 0;
    const formatDuration = (sec: number | null) => {
      if (sec === null || sec === undefined) return "N/A";
      const mins = Math.floor(sec / 60);
      const remainder = sec % 60;
      return mins > 0 ? `${mins}m ${remainder}s` : `${remainder}s`;
    };

    const data = session.participants.map((p: any, idx: number) => {
      const scorePercentage = totalQuestionsCount > 0 && p.score !== null ? Math.round((p.score / totalQuestionsCount) * 100) : 0;
      return {
        "Rank": p.terminated ? "DQ" : (idx + 1),
        "Employee ID": p.userId || "N/A",
        "Name": p.name || "N/A",
        "Email": p.email || "N/A",
        "Phone": p.phone || "N/A",
        "Designation": p.designation || "N/A",
        "Branch": p.branch || "N/A",
        "Qualification": p.qualification || "N/A",
        "Registry State": p.activated ? "Activated" : "Non-activated",
        "Duration Taken": formatDuration(p.timeTakenSeconds),
        "Integrity Status": p.terminated ? "Disqualified" : (p.tabSwitches > 0 ? `${p.tabSwitches} Tab Switch Warning(s)` : "Verified Secured"),
        "Tab Switches": p.tabSwitches,
        "Score": p.score !== null ? p.score : "Evaluating",
        "Total Questions": totalQuestionsCount,
        "Score Percentage (%)": `${scorePercentage}%`,
        "Completed At": p.completedAt ? new Date(p.completedAt).toLocaleString() : "Never Completed"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Session Results");

    XLSX.writeFile(workbook, `${session.assessment.title.replace(/\s+/g, "_")}_Results.xlsx`);
  };

  const handleShareReport = async (participant: any) => {
    if (!token || !sessionId) return;
    setSharingStudentId(participant.id);
    setShareSuccessMsg(null);
    setShareErrorMsg(null);
    try {
      const res = await fetch(`/api/director/sessions/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participantId: participant.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShareSuccessMsg(`Assessment report successfully emailed to ${participant.name} (${participant.email})!`);
        setTimeout(() => setShareSuccessMsg(null), 5000);
      } else {
        setShareErrorMsg(data.message || "Failed to share report.");
        setTimeout(() => setShareErrorMsg(null), 5000);
      }
    } catch (err) {
      console.error("Error sharing report:", err);
      setShareErrorMsg("Network error trying to share report.");
      setTimeout(() => setShareErrorMsg(null), 5000);
    } finally {
      setSharingStudentId(null);
    }
  };

  useEffect(() => {
    const t = localStorage.getItem("directorToken");
    if (!t) {
      router.push("/director/login");
      return;
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (!token || !sessionId) return;
    fetchSessionDetails();
  }, [token, sessionId]);

  const fetchSessionDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/director/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSession(data.session);
      } else {
        setError(data.message || "Failed to load session details");
      }
    } catch (err) {
      console.error("Error loading session report:", err);
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
      <div className="p-8 space-y-6 flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <div className="h-10 w-10 border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <span className="font-bold">Compiling detailed session analytics...</span>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-8 space-y-6 max-w-2xl mx-auto text-center">
        <div className="h-16 w-16 bg-red-50 border border-red-200 rounded-none flex items-center justify-center text-red-500 mx-auto">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Analysis Compilation Failed</h3>
        <p className="text-gray-550 text-sm">{error || "The session report is unavailable or access was denied."}</p>
        <Link
          href="/director/sessions"
          className="inline-flex items-center gap-2 bg-white border border-gray-300 px-6 py-3 rounded-none hover:bg-gray-50 text-sm font-bold text-gray-700 shadow-sm transition-all"
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link
            href="/director/sessions"
            className="p-3 bg-white border border-gray-200 rounded-none hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors shadow-sm"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Conducted Session Report</span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-none border ${
                session.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-blue-50 text-blue-600 border-blue-200 animate-pulse"
              }`}>
                {session.status}
              </span>
            </div>
            <h2 className="text-2xl font-black mt-1 text-gray-900">{session.assessment.title}</h2>
            <p className="text-xs text-gray-500 mt-1">
              Focus: <span className="font-bold text-gray-700">{session.assessment.position}</span> · Institution: <span className="font-bold text-gray-700">{session.assessment.recruitmentFor}</span> · Room key: <span className="font-mono text-blue-600 font-bold">{session.token}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleExportExcel}
          type="button"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Download size={13} />
          Export Results (Excel)
        </button>
      </div>

      {/* Overview Analytics Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white/80 border border-gray-200 rounded-none p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-3">
            <Users size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Total Teachers</span>
          </div>
          <p className="text-3xl font-black text-gray-900">{session.stats.participantCount}</p>
          <p className="text-[10px] text-gray-400 mt-1">Joined onboarding queue</p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3 text-purple-600 mb-3">
            <BarChart2 size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Class Average</span>
          </div>
          <p className="text-3xl font-black text-purple-600">{session.stats.avgScore} <span className="text-xs text-gray-400 font-bold">/ {totalQuestions} Qs</span></p>
          <p className="text-[10px] text-gray-400 mt-1">
            Accuracy: {totalQuestions > 0 ? ((session.stats.avgScore / totalQuestions) * 100).toFixed(0) : 0}%
          </p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-3">
            <Trophy size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Highest Score</span>
          </div>
          <p className="text-3xl font-black text-emerald-600">{session.stats.highScore} <span className="text-xs text-gray-400 font-bold">/ {totalQuestions}</span></p>
          <p className="text-[10px] text-gray-400 mt-1">Top candidate peak</p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3 text-red-500 mb-3">
            <ShieldAlert size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Lowest Score</span>
          </div>
          <p className="text-3xl font-black text-red-500">{session.stats.lowScore} <span className="text-xs text-gray-400 font-bold">/ {totalQuestions}</span></p>
          <p className="text-[10px] text-gray-400 mt-1">Lowest recorded grade</p>
        </div>
      </div>

      {/* Leaderboard & Detailed Candidate Log */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-black text-gray-900">Teacher Leaderboard &amp; Response Audit</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit teacher details, registry activation state, anti-cheat focuses, response sheets, and duration logs.
          </p>
        </div>
        {shareSuccessMsg && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 text-xs font-bold rounded-none animate-in fade-in duration-200">
            <Check size={14} className="text-emerald-600 shrink-0" />
            <span>{shareSuccessMsg}</span>
          </div>
        )}
        {shareErrorMsg && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 p-4 text-xs font-bold rounded-none animate-in fade-in duration-200">
            <X size={14} className="text-red-600 shrink-0" />
            <span>{shareErrorMsg}</span>
          </div>
        )}

        {session.participants.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-none p-12 text-center text-gray-400 shadow-sm">
            No teachers registered or joined this room.
          </div>
        ) : (
          <div className="bg-white/80 border border-gray-200 rounded-none overflow-hidden shadow-sm backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-4 text-center w-16">Rank</th>
                    <th className="px-6 py-4">Teacher details</th>
                    <th className="px-6 py-4">Designation &amp; Branch</th>
                    <th className="px-6 py-4">Registry State</th>
                    <th className="px-6 py-4">Duration Taken</th>
                    <th className="px-6 py-4">Integrity (Tab Warnings)</th>
                    <th className="px-6 py-4">Marks Earned</th>
                    <th className="px-6 py-4 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {session.participants.map((p: any, idx: number) => {
                    const scorePercentage = totalQuestions > 0 && p.score !== null ? (p.score / totalQuestions) * 100 : 0;
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

                    const barColor = p.terminated ? "bg-red-500" :
                                     scorePercentage >= 80 ? "bg-emerald-500" :
                                     scorePercentage >= 50 ? "bg-blue-500" : "bg-red-400";

                    return (
                      <Fragment key={p.id}>
                        <tr className="hover:bg-gray-50/30 transition-all border-b border-gray-100">
                          {/* Rank */}
                          <td className="px-6 py-4 text-center">
                            {p.terminated ? (
                              <span className="text-red-500 font-extrabold text-[10px]">DQ</span>
                            ) : idx === 0 && p.score !== null ? (
                              <span className="inline-flex h-6 w-6 rounded-none bg-amber-100 border border-amber-300 text-amber-600 font-black items-center justify-center text-[10px]">1st</span>
                            ) : idx === 1 && p.score !== null ? (
                              <span className="inline-flex h-6 w-6 rounded-none bg-gray-100 border border-gray-300 text-gray-600 font-black items-center justify-center text-[10px]">2nd</span>
                            ) : idx === 2 && p.score !== null ? (
                              <span className="inline-flex h-6 w-6 rounded-none bg-orange-100 border border-orange-300 text-orange-700 font-black items-center justify-center text-[10px]">3rd</span>
                            ) : (
                              <span className="text-gray-400 font-bold">{idx + 1}</span>
                            )}
                          </td>

                          {/* Teacher details */}
                          <td className="px-6 py-4">
                            <div>
                              <Link
                                href={`/director/teachers/${encodeURIComponent(p.email)}`}
                                className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors hover:underline cursor-pointer"
                              >
                                {p.name}
                              </Link>
                              <p className="text-[10px] text-gray-500 font-bold mt-0.5">Emp ID: {p.userId}</p>
                              <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
                                <Mail size={11} className="shrink-0" />
                                <span className="truncate">{p.email}</span>
                              </p>
                              <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
                                <Phone size={11} className="shrink-0" />
                                <span>{p.phone}</span>
                              </p>
                            </div>
                          </td>

                          {/* Designation & Branch */}
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-gray-700">{p.designation || "N/A"}</p>
                              <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                <School size={11} className="text-blue-500 shrink-0" />
                                <span>{p.branch || "Branch N/A"}</span>
                              </p>
                              <p className="text-[10px] text-gray-400 italic">Qual: {p.qualification || "None"}</p>
                            </div>
                          </td>

                          {/* Registry State */}
                          <td className="px-6 py-4">
                            {p.activated ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Activated teacher
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                Non-activated teacher
                              </span>
                            )}
                          </td>

                          {/* Duration Taken */}
                          <td className="px-6 py-4 text-gray-600 font-mono">
                            {formatTime(p.timeTakenSeconds)}
                          </td>

                          {/* Integrity switches */}
                          <td className="px-6 py-4">
                            {p.terminated ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-none animate-pulse">
                                <ShieldAlert size={10} />
                                Disqualified (Tab Switched)
                              </span>
                            ) : p.tabSwitches > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-none">
                                <ShieldAlert size={10} />
                                {p.tabSwitches} Warning{p.tabSwitches > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-none">
                                <Shield size={10} />
                                Verified Secured
                              </span>
                            )}
                          </td>

                          {/* Marks accuracy */}
                          <td className="px-6 py-4">
                            {p.terminated ? (
                              <span className="font-extrabold text-red-500 text-xs uppercase">Disqualified</span>
                            ) : p.score !== null ? (
                              <div className="w-32 space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-gray-700">{`${p.score} / ${totalQuestions}`}</span>
                                  <span className="text-gray-400">{scorePercentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-1.5 rounded-none overflow-hidden border border-gray-200">
                                  <div className={`h-full ${barColor}`} style={{ width: `${scorePercentage}%` }} />
                                </div>
                              </div>
                            ) : (
                              <span className="text-amber-600 font-bold text-[11px] animate-pulse">Evaluating...</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => toggleStudentExpand(p.id)}
                                className="p-1.5 bg-white border border-gray-200 hover:border-blue-300 rounded-none hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-all flex items-center gap-1 font-bold text-[10px] cursor-pointer shadow-sm animate-in duration-200"
                              >
                                <span>Inspect</span>
                                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              </button>
                              
                              <button
                                onClick={() => handleShareReport(p)}
                                disabled={sharingStudentId === p.id}
                                type="button"
                                className={`p-1.5 border rounded-none transition-all flex items-center justify-center shadow-sm cursor-pointer ${
                                  sharingStudentId === p.id
                                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-white border-gray-200 hover:border-violet-300 hover:bg-violet-50 text-gray-500 hover:text-violet-600"
                                }`}
                                title="Share Report via Email"
                              >
                                <Mail size={12} className={sharingStudentId === p.id ? "animate-pulse" : ""} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Collapsed Answers View */}
                        {isExpanded && (
                          <tr className="bg-gray-50/50">
                            <td colSpan={8} className="px-8 py-6 border-t border-b border-gray-100">
                              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-black text-xs uppercase tracking-wider text-gray-500">Response Sheet Audit: {p.name}</h5>
                                  <span className="text-[10px] text-gray-400 font-mono">Time of Submission: {p.completedAt ? new Date(p.completedAt).toLocaleString() : "Never Completed"}</span>
                                </div>

                                {answersArray.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">No submissions reported for this educator.</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {answersArray.map((ans: any, aIdx: number) => (
                                      <div key={aIdx} className={`p-4 border rounded-none flex items-start gap-3 ${
                                        ans.isCorrect
                                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                          : "bg-red-50 border-red-200 text-red-700"
                                      }`}>
                                        <span className={`h-5 w-5 rounded-none flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border ${
                                          ans.isCorrect
                                            ? "bg-emerald-100 text-emerald-600 border-emerald-300"
                                            : "bg-red-100 text-red-600 border-red-300"
                                        }`}>
                                          {ans.isCorrect ? <Check size={10} /> : <X size={10} />}
                                        </span>
                                        <div className="text-xs space-y-1">
                                          <p className="font-bold text-gray-900">Q{ans.questionIndex + 1}: {ans.questionText || `Question ${ans.questionIndex + 1}`}</p>
                                          <p className="text-[11px] text-gray-500 mt-1">
                                            Educator Selection: <span className="font-extrabold text-gray-700">{ans.studentAnswer || "N/A"}</span>
                                          </p>
                                          {!ans.isCorrect && (
                                            <p className="text-[11px] text-emerald-600">
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
