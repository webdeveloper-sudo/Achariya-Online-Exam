"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe, Lock, FolderOpen, Search, RefreshCw, Plus, Trash2, Clock, BookOpen, Play
} from "lucide-react";

export default function AssessmentsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [myAssessments, setMyAssessments] = useState<any[]>([]);
  const [publicAssessments, setPublicAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mine" | "public">("mine");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [hosting, setHosting] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("teacherToken");
    const u = localStorage.getItem("teacherUser");
    if (!t || !u) { router.push("/teacher/login"); return; }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchAssessments();
  }, [token]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/assessment", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMyAssessments(data.myAssessments || []);
        setPublicAssessments(data.publicAssessments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this assessment?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/teacher/assessment/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAssessments();
      else { const d = await res.json(); alert(d.message || "Failed to delete."); }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleHostAssessment = async (id: string) => {
    if (!token || !id) return;
    setHosting(id);
    try {
      const res = await fetch("/api/live/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assessmentId: id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Redirect to teacher control room
        router.push(`/live/${data.token}/host`);
      } else {
        alert(data.message || "Failed to create live session.");
      }
    } catch (err) {
      console.error("Error creating live session", err);
      alert("Something went wrong. Please check connection and try again.");
    } finally {
      setHosting(null);
    }
  };

  const displayList = (activeTab === "mine" ? myAssessments : publicAssessments).filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">Assessments Repository</h2>
          <p className="text-sm text-slate-400 mt-1">
            Browse your saved question banks or discover public assessments from the school network.
          </p>
        </div>
        <Link
          href="/teacher/generate"
          className="bg-emerald-600 hover:bg-emerald-500 px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 shrink-0"
        >
          <Plus size={14} /> New Assessment
        </Link>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex bg-slate-900/60 border border-white/5 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setActiveTab("mine")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "mine" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            My Assessments ({myAssessments.length})
          </button>
          <button
            onClick={() => setActiveTab("public")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "public" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Public Pool ({publicAssessments.length})
          </button>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or subject..."
              className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:border-emerald-500 outline-none"
            />
          </div>
          <button onClick={fetchAssessments} className="p-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Assessment Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-900/30 border border-white/5 rounded-3xl h-52 animate-pulse" />
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="bg-slate-900/20 border border-dashed border-white/5 rounded-3xl h-64 flex flex-col items-center justify-center gap-3 text-slate-600">
          <FolderOpen size={40} className="text-slate-700" />
          <p className="font-bold">
            {searchQuery ? "No results match your search" : activeTab === "mine" ? "No assessments created yet" : "No public assessments available"}
          </p>
          {activeTab === "mine" && !searchQuery && (
            <Link href="/teacher/generate" className="text-xs font-bold text-emerald-400 hover:underline">
              Generate your first assessment →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayList.map((a) => {
            const qs = Array.isArray(a.questions) ? a.questions : JSON.parse(a.questions || "[]");
            return (
              <div key={a.id} className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden hover:border-white/10 transition-all shadow-xl group flex flex-col">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/3 rounded-full blur-2xl" />

                {/* Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    a.isPublic ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-800 text-slate-400 border border-white/5"
                  }`}>
                    {a.isPublic ? <Globe size={9} /> : <Lock size={9} />}
                    {a.isPublic ? "Public" : "Private"}
                  </span>
                  <span className="text-[10px] text-slate-600">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Title */}
                <h4 className="font-black text-base text-white leading-tight mb-1 line-clamp-2">{a.title}</h4>
                <p className="text-xs text-slate-400 mb-4">{a.subject} · {a.lesson}</p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-auto mb-5">
                  <span className="flex items-center gap-1"><BookOpen size={10} />{qs.length} Questions</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{a.duration} mins</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/teacher/assessments/${a.id}`}
                    className="flex-1 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-600/20 hover:border-emerald-600 text-emerald-400 hover:text-white px-3 py-2 rounded-xl text-[11px] font-bold text-center transition-all flex items-center justify-center"
                  >
                    {activeTab === "mine" ? "View & Edit" : "View Questions"}
                  </Link>

                  <button
                    onClick={() => handleHostAssessment(a.id)}
                    disabled={hosting !== null}
                    className="flex-1 bg-indigo-650/10 hover:bg-indigo-600 border border-indigo-550/20 hover:border-indigo-600 text-indigo-400 hover:text-white px-3 py-2 rounded-xl text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {hosting === a.id ? (
                      <RefreshCw size={11} className="animate-spin" />
                    ) : (
                      <Play size={11} />
                    )}
                    {hosting === a.id ? "Hosting..." : "Host Live"}
                  </button>

                  {activeTab === "mine" && (
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deleting === a.id}
                      className="p-2 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 hover:border-rose-500/30 text-rose-500 rounded-xl transition-all disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
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
