"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar, Search, RefreshCw, Trophy, Users, BarChart2,
  ArrowRight, Activity, Trash2, HelpCircle, Compass, Globe,
  ChevronDown, ChevronUp, Shield, ShieldAlert, Check, X, AlertCircle
} from "lucide-react";
import Loader from "@/components/Loader";

export default function TeacherLiveSessionsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<{ [key: string]: any }>({});
  const [detailsLoading, setDetailsLoading] = useState<{ [key: string]: boolean }>({});
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const formatTime = (sec: number | null) => {
    if (sec === null || sec === undefined) return "N/A";
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return mins > 0 ? `${mins}m ${remainder}s` : `${remainder}s`;
  };

  const handleToggleSession = async (sessionId: string) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      setExpandedStudentId(null);
      return;
    }

    setExpandedSessionId(sessionId);
    setExpandedStudentId(null);

    if (!sessionDetails[sessionId]) {
      setDetailsLoading((prev) => ({ ...prev, [sessionId]: true }));
      try {
        const res = await fetch(`/api/live/sessions/details/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSessionDetails((prev) => ({ ...prev, [sessionId]: data.session }));
        }
      } catch (err) {
        console.error("Error loading session details:", err);
      } finally {
        setDetailsLoading((prev) => ({ ...prev, [sessionId]: false }));
      }
    }
  };

  const toggleStudentExpand = (studentId: string) => {
    setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
  };

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
        <Loader variant="card" message="Loading conducted rooms..." className="min-h-[250px]" />
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
                <div className="flex flex-col gap-2 mt-auto">
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

                  <button
                    onClick={() => handleToggleSession(session.id)}
                    className="w-full bg-[#20407D] hover:bg-[#20407D]/90 text-white border border-[#20407D] px-3 py-2.5 rounded-none text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    <span>{expandedSessionId === session.id ? "Hide Attended Students" : "Inspect Attended Students"}</span>
                    {expandedSessionId === session.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {/* Collapsible Attendee Details Section */}
                {expandedSessionId === session.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 w-full text-left space-y-4 animate-in fade-in slide-in-from-top duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-gray-700">Student Attendance List</span>
                      <span className="text-[10px] text-gray-400 font-mono">Count: {session.stats.participantCount}</span>
                    </div>

                    {detailsLoading[session.id] ? (
                      <Loader variant="inline" message="Fetching attendees details..." />
                    ) : !sessionDetails[session.id] || sessionDetails[session.id].participants.length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-2 text-center">No students attended this exam.</p>
                    ) : (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {sessionDetails[session.id].participants.map((p: any) => {
                          const scorePercentage = totalQ > 0 ? (p.score / totalQ) * 100 : 0;
                          const isStudentExpanded = expandedStudentId === p.id;
                          const integrityColor = p.tabSwitches > 0 ? "text-[#C72323] font-bold" : "text-emerald-600";

                          const assessmentQuestions = sessionDetails[session.id].assessment.questions
                            ? (typeof sessionDetails[session.id].assessment.questions === "string"
                                ? JSON.parse(sessionDetails[session.id].assessment.questions)
                                : sessionDetails[session.id].assessment.questions)
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

                          return (
                            <div key={p.id} className="p-3 bg-gray-50 border border-gray-300 rounded-none space-y-2 text-xs">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-extrabold text-gray-900">{p.name}</p>
                                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {p.studentId} · {p.grade}-{p.section}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-gray-900">{p.score !== null ? `${p.score}/${totalQ}` : "—"}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{scorePercentage.toFixed(0)}% accuracy</p>
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[9px] text-gray-505 border-t border-gray-200 pt-2">
                                <span>Switches: <span className={integrityColor}>{p.tabSwitches}</span></span>
                                <span>Duration: <span className="font-mono text-gray-700">{formatTime(p.timeTakenSeconds)}</span></span>
                                <button
                                  onClick={() => toggleStudentExpand(p.id)}
                                  className="px-2 py-1 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-bold text-[9px] flex items-center gap-0.5 cursor-pointer rounded-none"
                                >
                                  <span>{isStudentExpanded ? "Close" : "Inspect"}</span>
                                  {isStudentExpanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                                </button>
                              </div>

                              {isStudentExpanded && (
                                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 animate-in slide-in-from-top-2 duration-150">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Attempt Details</span>
                                    <span className="text-[8px] text-gray-450 font-mono">{p.completedAt ? new Date(p.completedAt).toLocaleTimeString() : ""}</span>
                                  </div>

                                  {answersArray.length === 0 ? (
                                    <p className="text-[10px] text-gray-450 italic">No answers logged.</p>
                                  ) : (
                                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                      {answersArray.map((ans: any, aIdx: number) => (
                                        <div key={aIdx} className={`p-2.5 border text-[11px] space-y-1 ${
                                          ans.isCorrect
                                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                                            : "bg-red-50/75 border-red-200 text-brand-red"
                                        }`}>
                                          <div className="flex items-start gap-1.5">
                                            <span className="mt-0.5 shrink-0">
                                              {ans.isCorrect ? <Check size={11} className="text-emerald-650" /> : <X size={11} className="text-[#C72323]" />}
                                            </span>
                                            <div className="space-y-1">
                                              <p className="font-extrabold text-gray-900 leading-snug">Q{ans.questionIndex + 1}: {ans.questionText}</p>
                                              <p className="text-[10px] text-gray-500">
                                                Student Selection: <span className="font-black text-gray-800">{ans.studentAnswer}</span>
                                              </p>
                                              {!ans.isCorrect && (
                                                <p className="text-[10px] text-emerald-700 font-bold">
                                                  ✔ Expected Solution: <span className="font-black">{ans.correctAnswer}</span>
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
