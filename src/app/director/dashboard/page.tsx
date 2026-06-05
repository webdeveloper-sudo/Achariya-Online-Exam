"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity, Users, CheckCircle, ShieldAlert, FolderOpen,
  PlusCircle, ArrowRight, HelpCircle, GraduationCap
} from "lucide-react";

export default function DirectorDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [director, setDirector] = useState<any>(null);
  const [myAssessments, setMyAssessments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("directorToken");
    const savedUser = localStorage.getItem("directorUser");
    if (!savedToken || !savedUser) {
      router.push("/director/login");
      return;
    }
    setToken(savedToken);
    setDirector(JSON.parse(savedUser));
  }, [router]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        // Fetch assessments
        const assessmentRes = await fetch("/api/director/assessment", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const assessmentData = await assessmentRes.json();
        setMyAssessments(assessmentData.myAssessments || []);

        // Fetch teachers
        const teachersRes = await fetch("/api/director/teachers", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const teachersData = await teachersRes.json();
        setTeachers(teachersData.teachers || []);
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
  const totalTeachers = teachers.length;
  
  // Calculate average score across all attempts
  let totalScore = 0;
  let totalQs = 0;
  let disqualifiedCount = 0;

  teachers.forEach(t => {
    t.attempts.forEach((att: any) => {
      if (att.score !== null) {
        totalScore += att.score;
        totalQs += att.totalQuestions || 1;
      }
      if (att.terminated) {
        disqualifiedCount++;
      }
    });
  });

  const averageScore = totalQs > 0 ? Math.round((totalScore / totalQs) * 100) : 0;
  const integrityRate = totalTeachers > 0
    ? Math.round(((totalTeachers - disqualifiedCount) / totalTeachers) * 100)
    : 100;

  // Flatten attempts to get recent activities
  const allAttempts: any[] = [];
  teachers.forEach(t => {
    t.attempts.forEach((att: any) => {
      allAttempts.push({
        ...att,
        teacherName: t.name,
        email: t.email,
        branch: t.branch,
        designation: t.designation
      });
    });
  });

  // Sort attempts by joinedAt descending
  allAttempts.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/80 border border-gray-200 rounded-none p-8 relative overflow-hidden shadow-sm backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/2 blur-2xl" />
        <div>
          <h2 className="text-3xl font-black text-gray-900">Academic Assessment Hub</h2>
          <p className="text-sm text-gray-500 mt-1.5">
            Welcome back, <span className="text-blue-600 font-bold">{director?.name || "Director"}</span>. Generate and host evaluations for teachers with real-time proctored metrics.
          </p>
        </div>
        <Link
          href="/director/generate"
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
          <p className="text-[10px] text-gray-400 mt-1">Evaluation templates saved</p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Teachers Evaluated</span>
            <Users size={18} className="text-blue-600" />
          </div>
          <p className="text-4xl font-black text-gray-900">{loading ? "—" : totalTeachers}</p>
          <p className="text-[10px] text-gray-400 mt-1">Unique teachers registered</p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Average Performance</span>
            <CheckCircle size={18} className="text-emerald-600" />
          </div>
          <p className="text-4xl font-black text-emerald-600">{loading ? "—" : `${averageScore}%`}</p>
          <p className="text-[10px] text-gray-400 mt-1">Evaluation grading accuracy</p>
        </div>

        <div className="bg-white/80 border border-gray-200 rounded-none p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Integrity Compliance</span>
            <ShieldAlert size={18} className="text-brand-red" />
          </div>
          <p className="text-4xl font-black text-brand-red">{loading ? "—" : `${integrityRate}%`}</p>
          <p className="text-[10px] text-gray-400 mt-1">
            {disqualifiedCount > 0 ? `${disqualifiedCount} disqualified` : "Zero safety alerts"}
          </p>
        </div>
      </div>

      {/* Split dashboard sections */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900">Recent Teacher Activities</h3>
            <Link href="/director/teachers" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              View All Activities <ArrowRight size={12} />
            </Link>
          </div>

          <div className="bg-white/80 border border-gray-200 rounded-none overflow-hidden shadow-sm backdrop-blur-sm">
            {loading ? (
              <div className="p-12 text-center text-gray-500 text-sm">Loading data streams...</div>
            ) : allAttempts.length === 0 ? (
              <div className="p-12 text-center text-gray-500 space-y-2">
                <FolderOpen size={36} className="mx-auto text-gray-450" />
                <p className="text-sm">No teacher attempts found yet.</p>
                <Link href="/director/assessments" className="inline-block mt-2 text-xs font-bold text-blue-600 hover:underline">
                  Launch a Host Live session to start →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px] py-4">
                      <th className="px-6 py-4">Teacher Name</th>
                      <th className="px-6 py-4">Evaluation Details</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Accuracy</th>
                      <th className="px-6 py-4">Focus Quality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {allAttempts.slice(0, 5).map((a, index) => {
                      const percentage = a.score !== null && a.totalQuestions ? Math.round((a.score / a.totalQuestions) * 100) : null;
                      return (
                        <tr key={index} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900 max-w-[150px] truncate">{a.teacherName}</td>
                          <td className="px-6 py-4 text-gray-650">
                            {a.assessmentTitle || "Teacher Assessment"} • {a.recruitmentFor || "Achariya"}
                          </td>
                          <td className="px-6 py-4">
                            {a.terminated ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold bg-red-50 text-brand-red border border-red-100">
                                Disqualified
                              </span>
                            ) : a.completedAt ? (
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
                            {a.terminated ? "N/A" : percentage !== null ? `${percentage}%` : "Evaluating"}
                          </td>
                          <td className="px-6 py-4 text-gray-500 font-bold">
                            {a.tabSwitches > 0 ? (
                              <span className={a.tabSwitches > 2 ? "text-brand-red" : "text-amber-600"}>
                                {a.tabSwitches} switches
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
          <h3 className="text-base font-black text-gray-900">Academic Guidelines</h3>
          <div className="bg-white/80 border border-gray-200 rounded-none p-6 space-y-6 shadow-sm backdrop-blur-sm">
            <div className="flex gap-3">
              <GraduationCap className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div className="text-xs space-y-1">
                <p className="font-bold text-gray-900">Anti-Cheat Enforcement</p>
                <p className="text-gray-500 leading-relaxed">
                  We enforce tab switches and focus metrics. Teachers who leave fullscreen mode or change windows more than twice are instantly kicked out of their assessment.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <HelpCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div className="text-xs space-y-1">
                <p className="font-bold text-gray-900">How to invite Teachers?</p>
                <p className="text-gray-500 leading-relaxed">
                  Generate an assessment, click "Host Live", and click on the "Send as Mail" button to trigger official invites directly to teacher email addresses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
