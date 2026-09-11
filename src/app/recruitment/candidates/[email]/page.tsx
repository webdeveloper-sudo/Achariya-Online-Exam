"use client";

import { useState, useEffect, use, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, Calendar, Award, Shield, ShieldAlert,
  ChevronDown, ChevronUp, AlertCircle, Check, X, Clock, User, Briefcase, GraduationCap
} from "lucide-react";
import Loader from "@/components/Loader";

export default function RecruiterCandidateDetailsPage({ params }: { params: Promise<{ email: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const encodedEmail = unwrappedParams.email;
  
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("recruiterToken");
    if (!t) {
      router.push("/recruitment/login");
      return;
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (!token || !encodedEmail) return;
    fetchCandidateTimeline();
  }, [token, encodedEmail]);

  const fetchCandidateTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recruitment/candidates/${encodedEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data.profile);
        setAttempts(data.attempts || []);
      } else {
        setError(data.message || "Failed to load candidate timeline");
      }
    } catch (err) {
      console.error("Error loading candidate profile:", err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const toggleAttemptExpand = (attemptId: string) => {
    setExpandedAttemptId(expandedAttemptId === attemptId ? null : attemptId);
  };

  const formatTime = (sec: number | null) => {
    if (sec === null || sec === undefined) return "N/A";
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return mins > 0 ? `${mins}m ${remainder}s` : `${remainder}s`;
  };

  if (loading) {
    return <Loader variant="card" message="Compiling candidate assessment history..." className="min-h-[60vh]" />;
  }

  if (error || !profile) {
    return (
      <div className="p-8 space-y-6 max-w-2xl mx-auto text-center">
        <div className="h-16 w-16 bg-red-50 border border-red-200 flex items-center justify-center text-red-500 mx-auto">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Profile Lookup Failed</h3>
        <p className="text-gray-500 text-sm">{error || "The requested candidate profile is unavailable."}</p>
        <Link
          href="/recruitment/candidates"
          className="inline-flex items-center gap-2 bg-white border border-gray-300 px-6 py-3 rounded-none hover:bg-gray-50 text-sm font-bold text-gray-700 transition-all shadow-sm"
        >
          <ArrowLeft size={16} /> Return to Candidates Activities
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Link
          href="/recruitment/candidates"
          className="p-3 bg-white border border-gray-200 rounded-none hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Candidate Directory</span>
          <h2 className="text-2xl font-black mt-1 text-gray-900">Applicant Profile</h2>
        </div>
      </div>

      {/* Candidate Profile Banner */}
      <div className="bg-white/80 border border-gray-200 rounded-none shadow-sm backdrop-blur-sm p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
        {/* Initials Avatar */}
        <div className="h-20 w-20 rounded-none bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-black text-2xl uppercase shadow-inner shrink-0">
          {profile.name ? profile.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2) : <User size={32} />}
        </div>

        {/* Profile Parameters */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-2xl font-black text-gray-900">{profile.name}</h3>
            <p className="text-xs text-blue-600 font-bold mt-1">Qualification: {profile.qualification || "Not Specified"}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2.5 text-xs text-gray-600">
              <Mail size={14} className="text-gray-400 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-600">
              <Phone size={14} className="text-gray-400 shrink-0" />
              <span>{profile.phone || "No Mobile Specified"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-600">
              <Award size={14} className="text-gray-400 shrink-0" />
              <span>Experience: {profile.experience || "No experience reported"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Roster Timeline */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-black text-gray-900">Chronological Assessment Timeline</h3>
          <p className="text-xs text-gray-500 mt-1">
            Browse candidate&apos;s historical attempts, comparative accuracy scores, integrity indexes, and detailed answer audits.
          </p>
        </div>

        {attempts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-none p-12 text-center text-gray-400 font-bold shadow-sm">
            No assessment attempts found for this candidate.
          </div>
        ) : (
          <div className="space-y-6">
            {attempts.map((attempt: any, idx: number) => {
              const totalQuestions = attempt.totalQuestions;
              const scorePercentage = totalQuestions > 0 && attempt.score !== null ? (attempt.score / totalQuestions) * 100 : 0;
              const isExpanded = expandedAttemptId === attempt.id;

              const assessmentQuestions = attempt.assessment?.questions
                ? (typeof attempt.assessment.questions === "string"
                    ? JSON.parse(attempt.assessment.questions)
                    : attempt.assessment.questions)
                : [];

              const studentAnswers = attempt.answers
                ? (typeof attempt.answers === "string"
                    ? JSON.parse(attempt.answers)
                    : attempt.answers)
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

              const barColor = attempt.terminated ? "bg-red-500" :
                               scorePercentage >= 80 ? "bg-emerald-500" :
                               scorePercentage >= 50 ? "bg-blue-500" : "bg-red-400";

              return (
                <div key={attempt.id} className="bg-white border border-gray-200 rounded-none shadow-sm relative overflow-hidden space-y-6 p-6">
                  {/* Timeline Badge */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                  
                  {/* Header Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attempt #{attempts.length - idx}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-none border ${
                          attempt.terminated ? "bg-red-50 text-red-600 border-red-200" :
                          attempt.completedAt ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                          "bg-amber-50 text-amber-600 border-amber-200 animate-pulse"
                        }`}>
                          {attempt.terminated ? "Disqualified" : attempt.completedAt ? "Completed" : "In Progress"}
                        </span>
                      </div>
                      <h4 className="font-black text-base text-gray-900">{attempt.assessment.title}</h4>
                      <p className="text-[11px] text-gray-500">
                        Position: <span className="font-bold text-gray-700">{attempt.assessment.position}</span> · Target: <span className="font-bold text-gray-700">{attempt.assessment.recruitmentFor}</span> · Dept: <span className="font-bold text-gray-700">{attempt.assessment.department} ({attempt.assessment.teaching})</span>
                      </p>
                    </div>

                    <div className="text-right space-y-1 text-gray-400 text-[10px] md:text-xs">
                      <p className="flex items-center gap-1.5 justify-end">
                        <Calendar size={12} />
                        <span>Joined: {new Date(attempt.joinedAt).toLocaleString()}</span>
                      </p>
                      {attempt.completedAt && (
                        <p className="flex items-center gap-1.5 justify-end">
                          <Clock size={12} />
                          <span>Duration: {formatTime(attempt.timeTakenSeconds)}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Indicators Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Score Bar */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Marks &amp; Accuracy</span>
                      {attempt.terminated ? (
                        <p className="font-extrabold text-red-500 text-sm uppercase">Auto Disqualified</p>
                      ) : attempt.score !== null ? (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-gray-700">{`${attempt.score} / ${totalQuestions} Marks`}</span>
                            <span className={`${
                              scorePercentage >= 80 ? "text-emerald-600" :
                              scorePercentage >= 50 ? "text-blue-600" : "text-red-500"
                            }`}>{scorePercentage.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-none overflow-hidden border border-gray-200">
                            <div className={`h-full ${barColor}`} style={{ width: `${scorePercentage}%` }} />
                          </div>
                        </div>
                      ) : (
                        <p className="text-amber-600 font-bold text-xs animate-pulse">Evaluating Attempt...</p>
                      )}
                    </div>

                    {/* Security Proctor Roster */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Integrity Score</span>
                      {attempt.terminated ? (
                        <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs">
                          <ShieldAlert size={14} className="shrink-0 animate-pulse" />
                          <span>Tab Focus Violations (Disqualified)</span>
                        </div>
                      ) : attempt.tabSwitches > 0 ? (
                        <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
                          <ShieldAlert size={14} className="shrink-0" />
                          <span>{attempt.tabSwitches} Focus Violation Warnings</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                          <Shield size={14} className="shrink-0" />
                          <span>Fully Compliant (0 switches)</span>
                        </div>
                      )}
                    </div>

                    {/* Action Roster */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => toggleAttemptExpand(attempt.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white rounded-none text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        <span>{isExpanded ? "Close Audit" : "Inspect Response Sheet"}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded audit list */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 pt-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between">
                        <h5 className="font-black text-xs uppercase tracking-wider text-gray-500">Answer sheet transcript</h5>
                        <span className="text-[10px] text-gray-400 font-mono">Room ID: {attempt.sessionToken}</span>
                      </div>

                      {answersArray.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No responses recorded for this attempt.</p>
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
                                  Candidate Selection: <span className="font-extrabold text-gray-700">{ans.studentAnswer || "No Answer"}</span>
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
