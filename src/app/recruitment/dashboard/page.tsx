"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity, Users, CheckCircle, ShieldAlert, FolderOpen,
  PlusCircle, ArrowRight, HelpCircle, GraduationCap
} from "lucide-react";

export default function RecruiterDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [recruiter, setRecruiter] = useState<any>(null);
  const [myAssessments, setMyAssessments] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("recruiterToken");
    const savedUser = localStorage.getItem("recruiterUser");
    if (!savedToken || !savedUser) {
      router.push("/recruitment/login");
      return;
    }
    setToken(savedToken);
    setRecruiter(JSON.parse(savedUser));
  }, [router]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        // Fetch assessments
        const assessmentRes = await fetch("/api/recruitment/assessment", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const assessmentData = await assessmentRes.json();
        setMyAssessments(assessmentData.myAssessments || []);

        // Fetch candidates
        const candidatesRes = await fetch("/api/recruitment/candidates", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const candidatesData = await candidatesRes.json();
        setCandidates(candidatesData.participants || []);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Derived statistics
  const totalAssessments = myAssessments.length;
  const totalCandidates = candidates.length;
  
  // Calculate average score
  const gradedCandidates = candidates.filter(c => c.score !== null);
  const averageScore = gradedCandidates.length > 0
    ? Math.round((gradedCandidates.reduce((acc, curr) => acc + (curr.score || 0), 0) / 
      gradedCandidates.reduce((acc, curr) => acc + (curr.totalQuestions || 1), 0)) * 100)
    : 0;

  // Integrity Rate (participants who weren't terminated / total participants)
  const disqualifiedCandidates = candidates.filter(c => c.terminated).length;
  const integrityRate = totalCandidates > 0
    ? Math.round(((totalCandidates - disqualifiedCandidates) / totalCandidates) * 100)
    : 100;

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/80 border border-gray-200 rounded-none p-8 relative overflow-hidden shadow-sm backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/2 blur-2xl" />
        <div>
          <h2 className="text-3xl font-black text-gray-900">HR Assessment Hub</h2>
          <p className="text-sm text-gray-500 mt-1.5">
            Welcome back, <span className="text-blue-600 font-bold">{recruiter?.name || "HR Officer"}</span>. Generate and host candidate examinations with real-time proctor monitoring.
          </p>
        </div>
        <Link
          href="/recruitment/generate"
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3.5 rounded-none font-bold transition-all text-xs flex items-center gap-2 shadow-sm text-white cursor-pointer shrink-0"
        >
          <PlusCircle size={16} /> AI Assessment Workspace
        </Link>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white/80 border border-gray-200 rounded-none p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Saved Assessments</span>
            <Activity size={18} className="text-blue-600" />
          </div>
          <p className="text-4xl font-black text-gray-900">{loading ? "—" : totalAssessments}</p>
          <p className="text-[10px] text-gray-400 mt-1">Hiring templates saved</p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Applicants</span>
            <Users size={18} className="text-blue-600" />
          </div>
          <p className="text-4xl font-black text-gray-900">{loading ? "—" : totalCandidates}</p>
          <p className="text-[10px] text-gray-400 mt-1">Processed live submissions</p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Average Score</span>
            <CheckCircle size={18} className="text-emerald-600" />
          </div>
          <p className="text-4xl font-black text-emerald-600">{loading ? "—" : `${averageScore}%`}</p>
          <p className="text-[10px] text-gray-400 mt-1">Hiring grading performance</p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Integrity Compliance</span>
            <ShieldAlert size={18} className="text-brand-red" />
          </div>
          <p className="text-4xl font-black text-brand-red">{loading ? "—" : `${integrityRate}%`}</p>
          <p className="text-[10px] text-gray-400 mt-1">
            {disqualifiedCandidates > 0 ? `${disqualifiedCandidates} disqualified` : "Zero safety alerts"}
          </p>
        </div>
      </div>

      {/* Split dashboard sections */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900">Recent Candidate Activities</h3>
            <Link href="/recruitment/candidates" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              View All Activities <ArrowRight size={12} />
            </Link>
          </div>

          <div className="bg-white/80 border border-gray-200 rounded-none overflow-hidden shadow-sm backdrop-blur-sm">
            {loading ? (
              <div className="p-12 text-center text-gray-500 text-sm">Loading data streams...</div>
            ) : candidates.length === 0 ? (
              <div className="p-12 text-center text-gray-500 space-y-2">
                <FolderOpen size={36} className="mx-auto text-gray-450" />
                <p className="text-sm">No candidate attempts found yet.</p>
                <Link href="/recruitment/assessments" className="inline-block mt-2 text-xs font-bold text-blue-600 hover:underline">
                  Launch a Host Live session to start →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px] py-4">
                      <th className="px-6 py-4">Applicant Name</th>
                      <th className="px-6 py-4">Hiring For</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Accuracy</th>
                      <th className="px-6 py-4">Focus Quality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {candidates.slice(0, 5).map((c) => {
                      const percentage = c.score !== null && c.totalQuestions ? Math.round((c.score / c.totalQuestions) * 100) : null;
                      return (
                        <tr key={c.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900 max-w-[150px] truncate">{c.name}</td>
                          <td className="px-6 py-4 text-gray-650">
                            {c.session?.assessment?.position || "Candidate"} • {c.session?.assessment?.recruitmentFor || "Achariya"}
                          </td>
                          <td className="px-6 py-4">
                            {c.terminated ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold bg-red-50 text-brand-red border border-red-100">
                                Disqualified
                              </span>
                            ) : c.completedAt ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                In Progress
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-950 font-bold">
                            {c.terminated ? "N/A" : percentage !== null ? `${percentage}%` : "Evaluating"}
                          </td>
                          <td className="px-6 py-4 text-gray-500 font-bold">
                            {c.tabSwitches > 0 ? (
                              <span className={c.tabSwitches > 2 ? "text-brand-red" : "text-amber-600"}>
                                {c.tabSwitches} switches
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-bold">Excellent</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          <h3 className="text-base font-black text-gray-900">Recruitment Guidelines</h3>
          <div className="bg-white/80 border border-gray-200 rounded-none p-6 space-y-6 shadow-sm backdrop-blur-sm">
            <div className="flex gap-3">
              <GraduationCap className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div className="text-xs space-y-1">
                <p className="font-bold text-gray-900">Anti-Cheat Enforcement</p>
                <p className="text-gray-500 leading-relaxed">
                  We enforce tab switches and focus metrics. Candidates who leave fullscreen mode or change windows more than twice are instantly kicked out of their assessment.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <HelpCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div className="text-xs space-y-1">
                <p className="font-bold text-gray-900">How to invite applicants?</p>
                <p className="text-gray-500 leading-relaxed">
                  Generate an assessment, click "Host Live", and click on the "Send as Mail" button to trigger official invites directly to candidate emails.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
