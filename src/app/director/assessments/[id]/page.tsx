"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit, Save, X, Printer, BookOpen, Clock,
  Trash2, AlertCircle, Loader, CheckCircle, Plus,
  Play, ChevronDown, ChevronUp, Trophy, Users, Calendar, Award, GripVertical, School, Briefcase,
  Image as ImageIcon, UploadCloud, RefreshCw
} from "lucide-react";

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  imageUrl?: string;      // Cloudinary URL or base64 preview
  imagePending?: boolean; // true = base64 not yet uploaded
}

interface Assessment {
  id: string;
  title: string;
  duration: number;
  teaching: string;
  department: string;
  position: string;
  recruitmentFor: string;
  questions: any;
  createdById: string;
  generatedBy: string;
  createdAt: string;
}

export default function DirectorAssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [token, setToken] = useState<string | null>(null);
  const [directorId, setDirectorId] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    duration: number;
    teaching: string;
    department: string;
    position: string;
    recruitmentFor: string;
    questions: Question[];
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Add Question / Drag rearrangement States
  const [newQuestionForm, setNewQuestionForm] = useState<any | null>(null);
  const [newQuestionError, setNewQuestionError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Print modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printIncludeAnswers, setPrintIncludeAnswers] = useState(true);

  // Live Hosting States
  const [hosting, setHosting] = useState(false);
  const [conductedSessions, setConductedSessions] = useState<any[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("directorToken");
    const u = localStorage.getItem("directorUser");
    if (!t || !u) {
      router.push("/director/login");
      return;
    }
    setToken(t);
    setDirectorId(JSON.parse(u).id);
  }, [router]);

  useEffect(() => {
    if (!token || !id) return;
    fetchAssessmentData();
  }, [token, id]);

  const fetchAssessmentData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch assessment details
      const res = await fetch(`/api/director/assessment/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const a = data.assessment;
        const questions = Array.isArray(a.questions) ? a.questions : JSON.parse(a.questions || "[]");
        setAssessment({ ...a, questions });

        // Fetch conducted sessions
        const sessionRes = await fetch("/api/director/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sessionData = await sessionRes.json();
        if (sessionRes.ok && sessionData.sessions) {
          // Filter sessions for this assessment ID
          const filtered = sessionData.sessions.filter((s: any) => s.assessmentId === id);
          setConductedSessions(filtered);
        }
      } else {
        setError(data.message || "Assessment template not found.");
      }
    } catch (err) {
      console.error("Error loading assessment:", err);
      setError("Failed to load assessment template.");
    } finally {
      setLoading(false);
    }
  };

  const handleHostAssessment = async () => {
    if (!token || !id) return;
    setHosting(true);
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
        // Redirect to director active monitoring room
        router.push(`/live/director/${data.token}/host`);
      } else {
        alert(data.message || "Failed to create live evaluation room.");
      }
    } catch (err) {
      console.error("Error creating live session:", err);
      alert("Something went wrong. Please check your internet connection.");
    } finally {
      setHosting(false);
    }
  };

  const startEdit = () => {
    if (!assessment) return;
    setEditForm({
      title: assessment.title,
      duration: assessment.duration,
      teaching: assessment.teaching || "teaching",
      department: assessment.department || "",
      position: assessment.position || "",
      recruitmentFor: assessment.recruitmentFor || "",
      questions: JSON.parse(JSON.stringify(assessment.questions)),
    });
    setIsEditMode(true);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setEditForm(null);
    setSaveError(null);
    setNewQuestionForm(null);
    setNewQuestionError(null);
  };

  const isDiagramType = (type: string) =>
    type === "diagram_mcq" || type === "diagram_short_answer";

  const uploadPendingImages = async (questions: Question[]): Promise<Question[]> => {
    return Promise.all(
      questions.map(async (q) => {
        if (!q.imagePending || !q.imageUrl) return q;
        try {
          const res = await fetch("/api/director/upload-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ base64: q.imageUrl }),
          });
          const data = await res.json();
          if (data.success && data.url) {
            const { imagePending, ...rest } = q;
            return { ...rest, imageUrl: data.url };
          }
        } catch (err) {
          console.warn("[Upload pending image] failed:", err);
        }
        return q;
      })
    );
  };

  const handleReplaceImage = (idx: number, file: File) => {
    if (!editForm) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const qs = [...editForm.questions];
      qs[idx] = { ...qs[idx], imageUrl: base64, imagePending: true };
      setEditForm({ ...editForm, questions: qs });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!editForm) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Upload any pending (base64) images to Cloudinary first
      setUploadingImages(true);
      const finalQuestions = await uploadPendingImages(editForm.questions);
      setUploadingImages(false);

      // Strip runtime-only flags before sending
      const cleanQuestions = finalQuestions.map(({ imagePending, ...rest }: any) => rest);

      const res = await fetch(`/api/director/assessment/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...editForm, questions: cleanQuestions }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const a = data.assessment;
        const questions = Array.isArray(a.questions) ? a.questions : JSON.parse(a.questions || "[]");
        setAssessment({ ...a, questions });
        setIsEditMode(false);
        setEditForm(null);
      } else {
        setSaveError(data.message || "Failed to save changes.");
      }
    } catch (err: any) {
      setUploadingImages(false);
      setSaveError(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this assessment template? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/director/assessment/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.push("/director/assessments");
      } else {
        const d = await res.json();
        alert(d.message || "Failed to delete.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const updateEditQuestion = (idx: number, field: string, value: any) => {
    if (!editForm) return;
    const qs = [...editForm.questions];
    (qs[idx] as any)[field] = value;
    setEditForm({ ...editForm, questions: qs });
  };

  const updateEditOption = (qIdx: number, optIdx: number, val: string) => {
    if (!editForm) return;
    const qs = [...editForm.questions];
    qs[qIdx].options[optIdx] = val;
    setEditForm({ ...editForm, questions: qs });
  };

  const addEditQuestion = () => {
    if (!editForm) return;
    if (newQuestionForm) {
      setNewQuestionError("Please fill and save the current draft question first.");
      return;
    }
    setNewQuestionError(null);
    setNewQuestionForm({
      type: "multiple_choice",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      explanation: "",
      imageUrl: undefined,
      imagePending: false,
    });
  };

  const handleNewQuestionImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setNewQuestionForm((prev: any) => ({ ...prev, imageUrl: base64, imagePending: true }));
    };
    reader.readAsDataURL(file);
  };

  const saveNewQuestion = () => {
    if (!newQuestionForm || !editForm) return;
    if (!newQuestionForm.question.trim()) {
      setNewQuestionError("Please enter the question text.");
      return;
    }

    if (newQuestionForm.type === "multiple_choice") {
      if (newQuestionForm.options.some((opt: string) => !opt.trim())) {
        setNewQuestionError("Please fill out all option fields for multiple choice questions.");
        return;
      }
      if (!newQuestionForm.correctAnswer.trim()) {
        setNewQuestionError("Please select a correct answer.");
        return;
      }
    } else if (newQuestionForm.type === "true_false") {
      if (!newQuestionForm.correctAnswer.trim()) {
        setNewQuestionError("Please select the correct option (True or False).");
        return;
      }
    } else if (newQuestionForm.type === "short_answer" || newQuestionForm.type === "diagram_short_answer") {
      if (!newQuestionForm.correctAnswer.trim()) {
        setNewQuestionError("Please enter the correct answer.");
        return;
      }
    } else if (newQuestionForm.type === "diagram_mcq") {
      if (newQuestionForm.options.some((opt: string) => !opt.trim())) {
        setNewQuestionError("Please fill out all option fields.");
        return;
      }
      if (!newQuestionForm.correctAnswer.trim()) {
        setNewQuestionError("Please select a correct answer.");
        return;
      }
    }

    const isMCQ = newQuestionForm.type === "multiple_choice" || newQuestionForm.type === "diagram_mcq";
    const isTF = newQuestionForm.type === "true_false";

    const newQs = [...editForm.questions, {
      id: Date.now().toString(),
      type: newQuestionForm.type,
      question: newQuestionForm.question.trim(),
      options: isMCQ
        ? newQuestionForm.options.map((o: string) => o.trim())
        : isTF
          ? ["True", "False"]
          : [],
      correctAnswer: newQuestionForm.correctAnswer.trim(),
      explanation: (newQuestionForm.explanation || "").trim(),
      imageUrl: newQuestionForm.imageUrl,
      imagePending: newQuestionForm.imagePending,
    }];

    setEditForm({ ...editForm, questions: newQs });
    setNewQuestionForm(null);
    setNewQuestionError(null);
  };

  const removeEditQuestion = (idx: number) => {
    if (!editForm) return;
    setEditForm({ ...editForm, questions: editForm.questions.filter((_, i) => i !== idx) });
  };

  const handlePrint = () => {
    setShowPrintModal(false);
    setTimeout(() => window.print(), 300);
  };

  const questions = isEditMode ? (editForm?.questions || []) : (assessment?.questions || []);
  const isOwner = assessment && assessment.createdById === directorId;

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <Loader size={32} className="animate-spin text-blue-600" />
        <p className="text-sm">Loading template...</p>
      </div>
    </div>
  );

  if (error || !assessment) return (
    <div className="p-8 space-y-4">
      <Link href="/director/assessments" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft size={16} /> Back to Repository
      </Link>
      <div className="bg-red-50 border border-red-200 rounded-none p-6 text-red-600 flex items-center gap-3 shadow-sm">
        <AlertCircle size={20} />
        <p>{error || "Assessment template not found."}</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-page { padding: 20px; }
        }
      `}</style>

      <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom duration-300 print-page text-gray-900">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/director/assessments"
              className="p-2.5 bg-white border border-gray-300 rounded-none hover:bg-gray-50 text-gray-650 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-gray-900">{isEditMode ? editForm?.title : assessment.title}</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Generated by {assessment.generatedBy} · {new Date(assessment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isEditMode && (
              <>
                <button
                  onClick={handleHostAssessment}
                  disabled={hosting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-none bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white shadow-sm transition-all cursor-pointer border border-blue-600"
                >
                  {hosting ? <Loader size={13} className="animate-spin" /> : <Play size={13} />}
                  Host Live Room
                </button>
                {isOwner && (
                  <>
                    <button onClick={startEdit} className="flex items-center gap-1.5 px-4 py-2 rounded-none bg-white hover:bg-gray-50 border border-gray-300 text-xs font-bold text-gray-700 transition-all cursor-pointer">
                      <Edit size={13} /> Edit Template
                    </button>
                    <button onClick={handleDelete} className="flex items-center gap-1.5 px-4 py-2 rounded-none bg-white hover:bg-red-50 border border-gray-300 hover:border-red-300 text-xs font-bold text-red-650 transition-all cursor-pointer">
                      <Trash2 size={13} /> Delete
                    </button>
                  </>
                )}
              </>
            )}
            {isEditMode && (
              <>
                <button onClick={cancelEdit} className="flex items-center gap-1.5 px-4 py-2 rounded-none bg-white hover:bg-gray-50 border border-gray-300 text-xs font-bold text-gray-700 transition-all cursor-pointer">
                  <X size={13} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving || uploadingImages} className="flex items-center gap-1.5 px-4 py-2 rounded-none bg-[#C72323] hover:bg-[#b01e1e] disabled:opacity-50 text-xs font-bold text-white transition-all cursor-pointer shadow-sm border border-[#C72323]">
                  {(saving || uploadingImages) ? <Loader size={13} className="animate-spin" /> : <Save size={13} />}
                  {uploadingImages ? "Uploading Images..." : saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
            {!isEditMode && (
              <button onClick={() => setShowPrintModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-none bg-white hover:bg-gray-50 border border-gray-300 text-xs font-bold text-gray-750 transition-all cursor-pointer">
                <Printer size={13} /> Print Template
              </button>
            )}
          </div>
        </div>

        {saveError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-none text-xs text-red-600 no-print">
            <AlertCircle size={14} />{saveError}
          </div>
        )}

        {/* Metadata section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
          {isEditMode ? (
            <>
              <div className="bg-white/80 border border-gray-200 rounded-none p-4 col-span-2 space-y-1.5 shadow-sm backdrop-blur-sm">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Assessment Title</label>
                <input value={editForm?.title || ""} onChange={(e) => setEditForm({ ...editForm!, title: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-blue-600" />
              </div>
              <div className="bg-white/80 border border-gray-200 rounded-none p-4 space-y-1.5 shadow-sm backdrop-blur-sm">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Evaluation Focus</label>
                <input value={editForm?.position || ""} onChange={(e) => setEditForm({ ...editForm!, position: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 font-bold" />
              </div>
              <div className="bg-white/80 border border-gray-200 rounded-none p-4 space-y-1.5 shadow-sm backdrop-blur-sm">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Duration (mins)</label>
                <input type="number" value={editForm?.duration || 30} onChange={(e) => setEditForm({ ...editForm!, duration: parseInt(e.target.value) })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 font-bold" />
              </div>

              <div className="bg-white/80 border border-gray-200 rounded-none p-4 space-y-1.5 shadow-sm backdrop-blur-sm">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Target Institution / School</label>
                <input value={editForm?.recruitmentFor || ""} onChange={(e) => setEditForm({ ...editForm!, recruitmentFor: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600" />
              </div>
              <div className="bg-white/80 border border-gray-200 rounded-none p-4 space-y-1.5 shadow-sm backdrop-blur-sm">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Department</label>
                <input value={editForm?.department || ""} onChange={(e) => setEditForm({ ...editForm!, department: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600" />
              </div>
              <div className="bg-white/80 border border-gray-200 rounded-none p-4 space-y-1.5 shadow-sm backdrop-blur-sm col-span-2">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Teaching Mode</label>
                <select value={editForm?.teaching || "teaching"} onChange={(e) => setEditForm({ ...editForm!, teaching: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600">
                  <option value="teaching">Teaching Mode</option>
                  <option value="non_teaching">Non-Teaching Mode</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white/80 border border-gray-200 rounded-none p-4 flex items-center gap-3 shadow-sm backdrop-blur-sm">
                <Briefcase className="text-blue-600 shrink-0" size={20} />
                <div><label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Focus</label><p className="text-sm font-bold text-gray-900 mt-0.5">{assessment.position}</p></div>
              </div>
              <div className="bg-white/80 border border-gray-200 rounded-none p-4 flex items-center gap-3 shadow-sm backdrop-blur-sm">
                <Clock className="text-blue-600 shrink-0" size={20} />
                <div><label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Duration</label><p className="text-sm font-bold text-gray-900 mt-0.5">{assessment.duration} mins</p></div>
              </div>
              <div className="bg-white/80 border border-gray-200 rounded-none p-4 col-span-2 flex items-center gap-3 shadow-sm backdrop-blur-sm">
                <School className="text-blue-600 shrink-0" size={20} />
                <div><label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Target School & Dept</label><p className="text-sm font-bold text-gray-900 mt-0.5">{assessment.recruitmentFor} · {assessment.department}</p></div>
              </div>
            </>
          )}
        </div>

        {/* Print Header (visible on print only) */}
        <div className="hidden print:block mb-6 text-gray-900">
          <h1 className="text-2xl font-bold">{assessment.title}</h1>
          <p className="text-sm">Subject/Focus: {assessment.position} | School Target: {assessment.recruitmentFor} | Duration: {assessment.duration} mins</p>
          <hr className="mt-3" />
        </div>

        {/* Questions Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between no-print border-b border-gray-200 pb-3">
            <h3 className="text-base font-bold text-gray-900">{questions.length} Questions</h3>
            {isEditMode && (
              <button onClick={addEditQuestion} className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 border border-gray-300 transition-all cursor-pointer">
                <Plus size={12} /> Add Question
              </button>
            )}
          </div>

          {/* New Question Draft Form */}
          {isEditMode && newQuestionForm && (
            <div className="bg-white border border-blue-300 rounded-none p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-xs font-black uppercase tracking-widest text-blue-600">Draft New Question</span>
                <button onClick={() => { setNewQuestionForm(null); setNewQuestionError(null); }} className="p-1 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Question Type</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { val: "multiple_choice", label: "Multiple Choice" },
                    { val: "true_false", label: "True / False" },
                    { val: "short_answer", label: "Short Answer" },
                    { val: "diagram_mcq", label: "Diagram MCQ" },
                    { val: "diagram_short_answer", label: "Diagram Short Answer" },
                  ].map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => {
                        const isMCQLike = t.val === "multiple_choice" || t.val === "diagram_mcq";
                        const isTF = t.val === "true_false";
                        setNewQuestionForm({
                          ...newQuestionForm,
                          type: t.val,
                          options: isMCQLike ? ["", "", "", ""] : isTF ? ["True", "False"] : [],
                          correctAnswer: isTF ? "True" : "",
                          imageUrl: isDiagramType(t.val) ? newQuestionForm.imageUrl : undefined,
                          imagePending: isDiagramType(t.val) ? newQuestionForm.imagePending : false,
                        });
                        setNewQuestionError(null);
                      }}
                      className={`px-3 py-1.5 rounded-none text-xs font-bold border transition-all cursor-pointer ${
                        newQuestionForm.type === t.val
                          ? isDiagramType(t.val) ? "bg-violet-600 border-violet-600 text-white" : "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Question Text</label>
                <textarea
                  value={newQuestionForm.question}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, question: e.target.value })}
                  placeholder="Type the question..."
                  rows={2}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-blue-600 resize-none"
                />
              </div>

              {/* Diagram image upload for manual question */}
              {isDiagramType(newQuestionForm.type) && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <ImageIcon size={11} className="text-violet-600" /> Diagram Image
                    <span className="text-gray-400 normal-case font-normal">(optional)</span>
                  </label>

                  {newQuestionForm.type === "diagram_mcq" && (
                    <div className="space-y-1.5 border border-gray-150 p-3 bg-gray-50/50">
                      <label className="text-[9px] font-black uppercase tracking-wider text-gray-500 block">Backup image (optional)</label>
                      <input
                        type="text"
                        placeholder="Paste image link (starts with http/https)..."
                        value={newQuestionForm.imageUrl && !newQuestionForm.imageUrl.startsWith("data:") ? newQuestionForm.imageUrl : ""}
                        onChange={(e) => {
                          const url = e.target.value;
                          if (url.trim() === "") {
                            setNewQuestionForm({ ...newQuestionForm, imageUrl: undefined, imagePending: false });
                          } else if (url.startsWith("http://") || url.startsWith("https://")) {
                            setNewQuestionForm({ ...newQuestionForm, imageUrl: url.trim(), imagePending: false });
                          }
                        }}
                        className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-950 font-bold outline-none focus:border-blue-600"
                      />
                    </div>
                  )}

                  {newQuestionForm.imageUrl ? (
                    <div className="relative group">
                      <img
                        src={newQuestionForm.imageUrl}
                        alt="Diagram preview"
                        className="w-full max-h-40 object-contain border border-violet-200 rounded-none bg-violet-50/30"
                      />
                      <label className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white border border-gray-300 text-gray-600 hover:text-blue-600 p-1.5 rounded-none shadow-sm cursor-pointer transition-opacity">
                        <UploadCloud size={11} />
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleNewQuestionImageUpload(f);
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-violet-300 hover:border-violet-500 rounded-none p-5 flex flex-col items-center gap-2 bg-violet-50/30 cursor-pointer transition-colors">
                      <UploadCloud size={20} className="text-violet-400" />
                      <p className="text-xs text-violet-600 font-bold">Upload diagram image</p>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleNewQuestionImageUpload(f);
                        }}
                      />
                    </label>
                  )}
                </div>
              )}

              {(newQuestionForm.type === "multiple_choice" || newQuestionForm.type === "diagram_mcq") && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Options</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {newQuestionForm.options.map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600">{String.fromCharCode(65 + optIdx)}.</span>
                        <input
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...newQuestionForm.options];
                            newOpts[optIdx] = e.target.value;
                            setNewQuestionForm({ ...newQuestionForm, options: newOpts });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs text-gray-900 outline-none focus:border-blue-600"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 mt-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 font-bold">Correct Answer</label>
                    <select
                      value={newQuestionForm.correctAnswer}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, correctAnswer: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs text-gray-900 outline-none focus:border-blue-600"
                    >
                      <option value="">Select Correct Option</option>
                      {newQuestionForm.options.map((opt: string, optIdx: number) => {
                        const label = opt.trim() || `Option ${String.fromCharCode(65 + optIdx)}`;
                        return (
                          <option key={optIdx} value={opt}>
                            {String.fromCharCode(65 + optIdx)}. {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}

              {newQuestionForm.type === "true_false" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Correct Answer</label>
                  <div className="flex gap-4">
                    {["True", "False"].map((val) => (
                      <label key={val} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                        <input
                          type="radio"
                          name="tf_answer"
                          value={val}
                          checked={newQuestionForm.correctAnswer === val}
                          onChange={() => setNewQuestionForm({ ...newQuestionForm, correctAnswer: val })}
                          className="accent-blue-600"
                        />
                        {val}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {(newQuestionForm.type === "short_answer" || newQuestionForm.type === "diagram_short_answer") && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Correct Answer Solution</label>
                  <input
                    value={newQuestionForm.correctAnswer}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, correctAnswer: e.target.value })}
                    placeholder="Enter the expected correct answer..."
                    className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs text-gray-900 outline-none focus:border-blue-600"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Explanation / Reasoning (Optional)</label>
                <textarea
                  value={newQuestionForm.explanation || ""}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, explanation: e.target.value })}
                  placeholder="Explain why this answer is correct..."
                  rows={2}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs text-gray-800 outline-none resize-none italic focus:border-blue-600"
                />
              </div>

              {newQuestionError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-none text-xs">
                  {newQuestionError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-250">
                <button
                  type="button"
                  onClick={() => { setNewQuestionForm(null); setNewQuestionError(null); }}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 rounded-none text-xs font-bold text-gray-700 border border-gray-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveNewQuestion}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-none text-xs font-bold text-white shadow-sm border border-red-650 cursor-pointer"
                >
                  Save Question
                </button>
              </div>
            </div>
          )}

          {/* Question List */}
          <div className="grid gris-cols-1 md:grid-cols-2 gap-6">
            {questions.map((q: Question, idx: number) => (
            <div
              key={q.id || idx}
              draggable={isEditMode}
              onDragStart={(e) => {
                if (!isEditMode) return;
                setDraggedIndex(idx);
              }}
              onDragOver={(e) => {
                if (!isEditMode) return;
                e.preventDefault();
              }}
              onDrop={(e) => {
                if (!isEditMode || draggedIndex === null) return;
                const updated = [...editForm!.questions];
                const draggedItem = updated[draggedIndex];
                updated.splice(draggedIndex, 1);
                updated.splice(idx, 0, draggedItem);
                setEditForm({ ...editForm!, questions: updated });
                setDraggedIndex(null);
              }}
              className={`bg-white/80 border border-gray-200 rounded-none p-6 print:bg-white print:border-gray-200 print:border print:mb-4 print:rounded-none transition-all ${
                isEditMode ? "hover:border-blue-550/30 active:opacity-50 shadow-sm" : "shadow-sm backdrop-blur-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-3 no-print">
                {isEditMode && (
                  <div className="cursor-move p-1 text-gray-400 hover:text-gray-900" title="Drag to reorder">
                    <GripVertical size={14} />
                  </div>
                )}
                <span className="h-6 w-6 rounded-none bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0">{idx + 1}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{q.type.replace(/_/g, " ")}</span>
                {isDiagramType(q.type) && (
                  <span className="ml-auto text-[9px] font-black uppercase bg-violet-100 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded-none">Diagram</span>
                )}
                {isEditMode && (
                  <button onClick={() => removeEditQuestion(idx)} className="ml-auto p-1 text-gray-400 hover:text-red-650 transition-colors cursor-pointer"><Trash2 size={12} /></button>
                )}
              </div>
              <p className="text-sm font-bold mb-1 print:hidden text-gray-900">{idx + 1}.</p>

              {/* Diagram image — view mode */}
              {!isEditMode && isDiagramType(q.type) && q.imageUrl && (
                <div className="mb-3">
                  <img
                    src={q.imageUrl}
                    alt={`Diagram for Q${idx + 1}`}
                    className="w-full max-h-56 object-contain border border-violet-100 rounded-none bg-violet-50/20"
                  />
                </div>
              )}

              {/* Diagram image — edit mode */}
              {isEditMode && isDiagramType(q.type) && (
                <div className="mb-3 space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-wider text-violet-600 flex items-center gap-1">
                    <ImageIcon size={10} /> Diagram Image
                  </label>
                  {q.imageUrl ? (
                    <div className="relative group">
                      <img
                        src={q.imageUrl}
                        alt={`Diagram Q${idx + 1}`}
                        className="w-full max-h-44 object-contain border border-violet-200 rounded-none bg-violet-50/20"
                      />
                      <label className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white border border-gray-300 text-gray-600 hover:text-blue-600 p-1.5 rounded-none shadow-sm cursor-pointer transition-opacity" title="Replace image">
                        <UploadCloud size={11} />
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReplaceImage(idx, f); }}
                        />
                      </label>
                      {q.imagePending && (
                        <div className="absolute bottom-2 left-2 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-black px-2 py-1 rounded-none uppercase tracking-wider">
                          Pending upload
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-violet-300 hover:border-violet-500 rounded-none p-4 flex flex-col items-center gap-2 bg-violet-50/20 cursor-pointer">
                      <UploadCloud size={18} className="text-violet-400" />
                      <p className="text-xs text-violet-600 font-bold">Upload diagram image</p>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReplaceImage(idx, f); }}
                      />
                    </label>
                  )}
                </div>
              )}

              {isEditMode && q.type === "diagram_mcq" && (
                <div className="mb-3 space-y-1.5 border border-gray-150 p-3 bg-gray-50/50">
                  <label className="text-[9px] font-black uppercase tracking-wider text-gray-500 block">Backup image (optional)</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Paste image link (starts with http/https)..."
                      value={q.imageUrl && !q.imageUrl.startsWith("data:") ? q.imageUrl : ""}
                      onChange={(e) => {
                        const url = e.target.value;
                        const qs = [...editForm!.questions];
                        if (url.trim() === "") {
                          qs[idx].imageUrl = undefined;
                          qs[idx].imagePending = false;
                        } else if (url.startsWith("http://") || url.startsWith("https://")) {
                          qs[idx].imageUrl = url.trim();
                          qs[idx].imagePending = false;
                        }
                        setEditForm({ ...editForm!, questions: qs });
                      }}
                      className="flex-1 bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-955 font-bold outline-none focus:border-blue-600"
                    />
                    <label className="bg-white border border-gray-300 text-gray-750 hover:text-blue-600 px-3 py-1.5 rounded-none shadow-sm cursor-pointer text-xs font-bold text-center flex items-center justify-center gap-1">
                      <UploadCloud size={13} />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleReplaceImage(idx, file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {isEditMode ? (
                <textarea value={q.question} onChange={(e) => updateEditQuestion(idx, "question", e.target.value)} rows={2}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-blue-600 resize-none mb-3" />
              ) : (
                <p className="text-sm font-bold text-gray-900 mb-4">{q.question}</p>
              )}

              {(q.type === "multiple_choice" || q.type === "diagram_mcq") && q.options?.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {q.options.map((opt: string, optIdx: number) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-blue-600 shrink-0">{String.fromCharCode(65 + optIdx)}.</span>
                      {isEditMode ? (
                        <input value={opt} onChange={(e) => updateEditOption(idx, optIdx, e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-none px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-600" />
                      ) : (
                        <span className="w-full bg-gray-50 border border-gray-200 rounded-none px-3 py-2 text-xs text-gray-700 print:border-gray-200">{opt}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className={`mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-none ${!printIncludeAnswers ? "print:hidden" : ""}`}>
                {isEditMode && editForm ? (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-emerald-800">Correct Answer</label>
                    <input value={q.correctAnswer} onChange={(e) => updateEditQuestion(idx, "correctAnswer", e.target.value)}
                      className="w-full bg-white border border-emerald-250 rounded-none px-3 py-1.5 text-xs text-emerald-850 outline-none" />
                  </div>
                ) : (
                  <p className="text-[11px] font-bold text-emerald-700">
                    ✔ Answer: <span className="text-emerald-950 font-black">{q.correctAnswer}</span>
                  </p>
                )}
                {q.explanation && !isEditMode && (
                  <p className="text-[10px] text-gray-500 italic mt-1 leading-relaxed">{q.explanation}</p>
                )}
                {isEditMode && (
                  <div className="space-y-1 mt-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Explanation</label>
                    <textarea value={q.explanation || ""} onChange={(e) => updateEditQuestion(idx, "explanation", e.target.value)} rows={2}
                      className="w-full bg-white border border-gray-300 rounded-none px-2 py-1.5 text-xs text-gray-700 outline-none resize-none italic focus:border-blue-600" />
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Conducted Sessions Accordion */}
        <div className="mt-12 space-y-6 no-print">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
            <div className="h-10 w-10 bg-blue-50 border border-blue-100 text-blue-600 rounded-none flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Conducted Evaluation Rooms</h3>
              <p className="text-xs text-gray-500 mt-0.5">List of live evaluation rooms launched for this template</p>
            </div>
          </div>

          {conductedSessions.length === 0 ? (
            <div className="bg-white/80 border border-gray-200 rounded-none p-8 text-center text-gray-500 text-xs shadow-sm backdrop-blur-sm">
              <p className="font-bold text-gray-900">No Conducted Rooms Yet</p>
              <p className="text-gray-550 mt-1 max-w-sm mx-auto leading-relaxed">
                Click on <span className="text-blue-600 font-bold">"Host Live Room"</span> in the header to launch a live room and invite teachers in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {conductedSessions.map((session) => {
                const isExpanded = expandedSessionId === session.id;
                const formattedTime = new Date(session.createdAt).toLocaleString();
                const totalQ = Array.isArray(assessment?.questions) ? assessment?.questions.length : 0;

                return (
                  <div key={session.id} className="bg-white/80 border border-gray-200 rounded-none overflow-hidden transition-all shadow-sm backdrop-blur-sm">
                    {/* Header */}
                    <button
                      onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                      className="w-full text-left p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-all cursor-pointer animate-in fade-in"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-8 w-8 rounded-none flex items-center justify-center text-xs font-bold shrink-0 ${
                          session.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          session.status === "ACTIVE" ? "bg-blue-50 text-blue-600 border border-blue-100 animate-pulse" :
                          "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                          {session.status === "COMPLETED" ? "✔" : "●"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Live Room ID: {session.id.slice(0, 8)}...</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Created at {formattedTime}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-xs font-bold">
                        <div className="text-right">
                          <p className="text-gray-900">{session.stats?.participantCount || 0} participants</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Avg Score: {session.stats?.avgScore || 0}/{totalQ}</p>
                        </div>
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </button>

                    {/* Accordion Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-150 p-6 bg-gray-50/50 space-y-4">
                        <div className="flex flex-wrap gap-4 text-xs font-bold">
                          <div className="bg-white border border-gray-200 px-4 py-3 rounded-none">
                            <span className="text-[10px] text-gray-400 block uppercase">Average Score</span>
                            <span className="text-base text-gray-900">{session.stats?.avgScore || 0} / {totalQ}</span>
                          </div>
                          <div className="bg-white border border-gray-200 px-4 py-3 rounded-none">
                            <span className="text-[10px] text-gray-400 block uppercase">Highest Score</span>
                            <span className="text-base text-emerald-600">{session.stats?.highScore || 0} / {totalQ}</span>
                          </div>
                          <div className="bg-white border border-gray-200 px-4 py-3 rounded-none">
                            <span className="text-[10px] text-gray-400 block uppercase">Lowest Score</span>
                            <span className="text-base text-gray-900">{session.stats?.lowScore || 0} / {totalQ}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <Link
                            href={`/director/sessions/${session.id}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-none cursor-pointer"
                          >
                            Open Detailed Roster Report →
                          </Link>
                          
                          {session.status !== "COMPLETED" && (
                            <Link
                              href={`/live/director/${session.token}/host`}
                              className="text-xs font-bold text-blue-600 hover:underline"
                            >
                              Enter Live Control Room →
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Print settings modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 max-w-sm w-full border border-gray-300 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-gray-900">Print Template Settings</h3>
            
            <label className="flex items-center gap-3 cursor-pointer group mt-2 pt-1">
              <div
                onClick={() => setPrintIncludeAnswers(!printIncludeAnswers)}
                className={`h-5 w-5 rounded-none border-2 flex items-center justify-center transition-all cursor-pointer ${
                  printIncludeAnswers ? "bg-emerald-600 border-emerald-600" : "border-gray-300 bg-white"
                }`}
              >
                {printIncludeAnswers && <CheckCircle size={12} className="text-white" />}
              </div>
              <span className="text-xs text-gray-700 font-bold group-hover:text-gray-950">Append AI Correct Answer Sheets</span>
            </label>

            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
              <button
                type="button" onClick={() => setShowPrintModal(false)}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 text-xs cursor-pointer"
              >
                Trigger Print
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
