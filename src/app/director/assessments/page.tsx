"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderOpen, Search, RefreshCw, Plus, Trash2, Clock, BookOpen, Play, Award, School,
  Edit
} from "lucide-react";
import Loader from "@/components/Loader";
import { useToast } from "@/components/Toast";

export default function DirectorAssessmentsPage() {
  const router = useRouter();
  const toast = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [myAssessments, setMyAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [hosting, setHosting] = useState<string | null>(null);

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
    fetchAssessments();
  }, [token]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/director/assessment", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMyAssessments(data.myAssessments || []);
      }
    } catch (err) {
      console.error("Error fetching director assessments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this assessment template?")) return;
    setDeleting(id);
    const toastId = toast.loading("Deleting assessment template...");
    try {
      const res = await fetch(`/api/director/assessment/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.update(toastId, {
          type: "success",
          message: "Assessment template deleted successfully.",
        });
        fetchAssessments();
      } else {
        const d = await res.json();
        toast.update(toastId, {
          type: "error",
          message: d.message || "Failed to delete assessment.",
        });
      }
    } catch (err: any) {
      toast.update(toastId, {
        type: "error",
        message: "Network error: " + err.message,
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleHostAssessment = async (id: string) => {
    if (!token || !id) return;
    setHosting(id);
    const toastId = toast.loading("Creating live evaluation session...");
    try {
      const res = await fetch("/api/director/live/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assessmentId: id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.update(toastId, {
          type: "success",
          message: "Live evaluation room generated!",
        });
        // Redirect to director active monitoring room
        router.push(`/live/director/${data.token}/host`);
      } else {
        toast.update(toastId, {
          type: "error",
          message: data.message || "Failed to launch live evaluation session.",
        });
      }
    } catch (err) {
      console.error("Error creating live session", err);
      toast.update(toastId, {
        type: "error",
        message: "Something went wrong. Please check your internet connection.",
      });
    } finally {
      setHosting(null);
    }
  };

  const displayList = myAssessments.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.recruitmentFor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 mx-auto container space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Academic Templates Repository</h2>
          <p className="text-sm text-gray-500 mt-1">
            Access, inspect, or initiate live evaluations using your saved director assessments.
          </p>
        </div>
        <Link
          href="/director/generate"
          className="bg-blue-600 hover:bg-blue-700 border border-blue-600 hover:border-blue-700 text-white px-5 py-3 rounded-none font-bold text-xs flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Plus size={14} /> New Assessment
        </Link>
      </div>

      {/* Controls */}
      <div className="flex flex-col w-full sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by title, focus, or branch..."
              className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-4 py-2.5 text-xs focus:border-blue-600 outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
          <button onClick={fetchAssessments} className="p-2.5 bg-white border border-gray-300 rounded-none text-gray-400 hover:text-gray-950 transition-colors cursor-pointer">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <Loader variant="card" message="Loading academic templates..." className="min-h-[208px]" />
      ) : displayList.length === 0 ? (
        <div className="bg-white/40 border border-dashed border-gray-300 rounded-none h-64 flex flex-col items-center justify-center gap-3 text-gray-400 shadow-sm backdrop-blur-sm">
          <FolderOpen size={40} className="text-gray-300" />
          <p className="font-bold text-gray-600">
            {searchQuery ? "No results match your search" : "No assessments saved yet"}
          </p>
          {!searchQuery && (
            <Link href="/director/generate" className="text-xs font-bold text-blue-600 hover:underline">
              Generate your first evaluation template →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayList.map((a) => {
            const qs = Array.isArray(a.questions) ? a.questions : JSON.parse(a.questions || "[]");
            return (
              <div key={a.id} className="bg-white/80 border border-gray-200 rounded-none p-6 relative overflow-hidden hover:border-gray-300 transition-all shadow-sm group flex flex-col justify-between backdrop-blur-sm">
                
                <div>
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 border border-blue-100">
                      Private Template
                    </span>
                    <span className="text-[10px] text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Title */}
                  <h4 className="font-black text-base text-gray-900 leading-tight mb-2 line-clamp-2">{a.title}</h4>
                  
                  {/* Targeted role & school metadata */}
                  <div className="space-y-1.5 mb-4">
                    <p className="text-xs text-blue-600 font-bold flex items-center gap-1.5">
                      <Award size={13} className="shrink-0" />
                      <span>Focus: {a.position}</span>
                    </p>
                    <p className="text-xs text-gray-500 flex items-start gap-1.5">
                      <School size={13} className="shrink-0 mt-0.5" />
                      <span className="line-clamp-2">Target School: {a.recruitmentFor}</span>
                    </p>
                  </div>
                </div>

                <div>
                  {/* Meta details */}
                  <div className="flex items-center gap-4 text-[10px] text-gray-400 mb-5 border-t border-gray-200 pt-3">
                    <span className="flex items-center gap-1"><BookOpen size={10} />{qs.length} Questions</span>
                    <span className="flex items-center gap-1"><Clock size={10} />{a.duration} mins</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-none bg-gray-100 text-gray-500">{a.teaching}</span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <button
                      onClick={() => handleHostAssessment(a.id)}
                      disabled={hosting !== null}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 border border-blue-600 hover:border-blue-700 text-white px-3 py-2 rounded-none text-[11px] font-black text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {hosting === a.id ? (
                        <RefreshCw size={11} className="animate-spin" />
                      ) : (
                        <Play size={11} />
                      )}
                      {hosting === a.id ? "Launching..." : "Host Live Room"}
                    </button>

                    <Link
                      href={`/director/assessments/${a.id}`}
                      className="p-2.5 bg-white flex items-center gap-2 hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-none transition-all flex items-center justify-center cursor-pointer shadow-sm"
                      title="View & Edit Details"
                    >
                      <span className="text-[12px]">View or Edit</span>
                      <Edit size={13} />
                    </Link>

                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deleting === a.id}
                      className="p-2 bg-red-50 flex items-center gap-2 justify-center hover:bg-red-100 border border-red-200 text-red-600 rounded-none transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      <span className="text-[12px]">Delete</span>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
