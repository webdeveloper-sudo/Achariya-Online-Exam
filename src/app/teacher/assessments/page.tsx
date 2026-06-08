"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe, Lock, FolderOpen, Search, RefreshCw, Plus, Trash2, Clock, BookOpen, Play
} from "lucide-react";
import Loader from "@/components/Loader";

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
          <h2 className="text-3xl font-black text-gray-900">Assessments Repository</h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse your saved question banks or discover public assessments from the school network.
          </p>
        </div>
        <Link
          href="/teacher/generate"
          className="bg-brand-red hover:bg-brand-red/90 px-5 py-3 rounded-none font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-red-600/10 shrink-0 text-white cursor-pointer"
        >
          <Plus size={14} /> New Assessment
        </Link>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex bg-gray-100 border border-gray-200 rounded-none p-1 gap-1">
          <button
            onClick={() => setActiveTab("mine")}
            className={`px-5 py-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
              activeTab === "mine" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Assessments ({myAssessments.length})
          </button>
          <button
            onClick={() => setActiveTab("public")}
            className={`px-5 py-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
              activeTab === "public" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Public Pool ({publicAssessments.length})
          </button>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or subject..."
              className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-4 py-2.5 text-xs text-gray-900 focus:border-blue-600 outline-none"
            />
          </div>
          <button onClick={fetchAssessments} className="p-2.5 bg-white border border-gray-300 rounded-none text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <Loader variant="card" message="Loading assessments..." className="min-h-[250px]" />
      ) : displayList.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-305 rounded-none h-64 flex flex-col items-center justify-center gap-3 text-gray-500 shadow-sm">
          <FolderOpen size={40} className="text-gray-450" />
          <p className="font-bold">
            {searchQuery ? "No results match your search" : activeTab === "mine" ? "No assessments created yet" : "No public assessments available"}
          </p>
          {activeTab === "mine" && !searchQuery && (
            <Link href="/teacher/generate" className="text-xs font-bold text-blue-600 hover:underline">
              Generate your first assessment →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayList.map((a) => {
            const qs = Array.isArray(a.questions) ? a.questions : JSON.parse(a.questions || "[]");
            return (
              <div key={a.id} className="bg-white/80 border border-gray-200 rounded-none p-6 relative overflow-hidden hover:border-blue-500/40 transition-all shadow-sm backdrop-blur-sm group flex flex-col">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/2 blur-2xl animate-pulse" />

                {/* Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[10px] font-bold ${
                    a.isPublic ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}>
                    {a.isPublic ? <Globe size={9} /> : <Lock size={9} />}
                    {a.isPublic ? "Public" : "Private"}
                  </span>
                  <span className="text-[10px] text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Title */}
                <h4 className="font-black text-base text-gray-900 leading-tight mb-1 line-clamp-2">{a.title}</h4>
                <p className="text-xs text-gray-500 mb-4">{a.subject} · {a.lesson}</p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-[10px] text-gray-500 mt-auto mb-5">
                  <span className="flex items-center gap-1"><BookOpen size={10} />{qs.length} Questions</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{a.duration} mins</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/teacher/assessments/${a.id}`}
                    className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-2 rounded-none text-[11px] font-bold text-center transition-all flex items-center justify-center cursor-pointer"
                  >
                    {activeTab === "mine" ? "View & Edit" : "View Questions"}
                  </Link>

                  <button
                    onClick={() => handleHostAssessment(a.id)}
                    disabled={hosting !== null}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white px-3 py-2 rounded-none text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
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
                      className="p-2 bg-white hover:bg-red-50 border border-gray-300 hover:border-red-250 text-red-600 rounded-none transition-all disabled:opacity-50 cursor-pointer"
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
