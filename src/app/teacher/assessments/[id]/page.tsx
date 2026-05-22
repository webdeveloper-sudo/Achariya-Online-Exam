"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit, Save, X, Printer, Globe, Lock, BookOpen, Clock,
  Trash2, AlertCircle, Loader, CheckCircle, FileDown, Plus,
  Play, ChevronDown, ChevronUp, Trophy, Users, Calendar, Award, GripVertical
} from "lucide-react";

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface Assessment {
  id: string;
  title: string;
  duration: number;
  subject: string;
  lesson: string;
  isPublic: boolean;
  questions: any;
  createdById: string;
  createdByEmail: string;
  createdByTeacherName: string;
  createdAt: string;
}

export default function AssessmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [token, setToken] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string; duration: number; subject: string; lesson: string; isPublic: boolean; questions: Question[];
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Add Question / Drag rearrangement States
  const [newQuestionForm, setNewQuestionForm] = useState<any | null>(null);
  const [newQuestionError, setNewQuestionError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Print modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printIncludeAnswers, setPrintIncludeAnswers] = useState(true);

  // Live Hosting States
  const [hosting, setHosting] = useState(false);
  const [conductedSessions, setConductedSessions] = useState<any[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("teacherToken");
    const u = localStorage.getItem("teacherUser");
    if (!t || !u) { router.push("/teacher/login"); return; }
    setToken(t);
    setTeacherId(JSON.parse(u).id);
  }, []);

  useEffect(() => {
    if (!token || !id) return;
    fetch(`/api/teacher/assessment/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.assessment) {
          const a = data.assessment;
          const questions = Array.isArray(a.questions) ? a.questions : JSON.parse(a.questions || "[]");
          setAssessment({ ...a, questions });
          // Fetch conducted sessions
          fetchConductedSessions(token);
        } else {
          setError(data.message || "Assessment not found.");
        }
      })
      .catch(() => setError("Failed to load assessment."))
      .finally(() => setLoading(false));
  }, [token, id]);

  const fetchConductedSessions = async (authToken: string) => {
    try {
      const res = await fetch(`/api/live/sessions/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConductedSessions(data.sessions || []);
      }
    } catch (e) {
      console.error("Failed to load conducted sessions", e);
    }
  };

  const handleHostAssessment = async () => {
    if (!token || !id) return;
    setHosting(true);
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
      setHosting(false);
    }
  };

  const startEdit = () => {
    if (!assessment) return;
    setEditForm({
      title: assessment.title,
      duration: assessment.duration,
      subject: assessment.subject,
      lesson: assessment.lesson,
      isPublic: assessment.isPublic,
      questions: JSON.parse(JSON.stringify(assessment.questions)),
    });
    setIsEditMode(true);
  };

  const cancelEdit = () => { setIsEditMode(false); setEditForm(null); setSaveError(null); };

  const handleSave = async () => {
    if (!editForm) return;
    setSaving(true); setSaveError(null);
    try {
      const res = await fetch(`/api/teacher/assessment/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
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
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this assessment? This cannot be undone.")) return;
    const res = await fetch(`/api/teacher/assessment/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) router.push("/teacher/assessments");
    else { const d = await res.json(); alert(d.message || "Failed to delete."); }
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
      setNewQuestionError("Please fill and save the current draft form first.");
      return;
    }
    setNewQuestionError(null);
    setNewQuestionForm({
      type: "multiple_choice",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      explanation: ""
    });
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
    } else if (newQuestionForm.type === "short_answer") {
      if (!newQuestionForm.correctAnswer.trim()) {
        setNewQuestionError("Please enter the correct answer.");
        return;
      }
    }

    const newQs = [...editForm.questions, {
      id: Date.now().toString(),
      type: newQuestionForm.type,
      question: newQuestionForm.question.trim(),
      options: newQuestionForm.type === "multiple_choice" 
        ? newQuestionForm.options.map((o: string) => o.trim()) 
        : newQuestionForm.type === "true_false" 
          ? ["True", "False"] 
          : [],
      correctAnswer: newQuestionForm.correctAnswer.trim(),
      explanation: (newQuestionForm.explanation || "").trim()
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
  const isOwner = assessment && assessment.createdById === teacherId;

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <Loader size={32} className="animate-spin text-blue-600" />
        <p className="text-sm">Loading assessment...</p>
      </div>
    </div>
  );

  if (error || !assessment) return (
    <div className="p-8 space-y-4">
      <Link href="/teacher/assessments" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft size={16} /> Back to Repository
      </Link>
      <div className="bg-red-50 border border-red-200 rounded-none p-6 text-red-600 flex items-center gap-3 shadow-sm">
        <AlertCircle size={20} />
        <p>{error || "Assessment not found."}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-page { padding: 20px; }
        }
      `}</style>

      <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom duration-300 print-page">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/teacher/assessments"
              className="p-2.5 bg-white border border-gray-300 rounded-none hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-gray-900">{isEditMode ? editForm?.title : assessment.title}</h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[10px] font-bold ${
                  assessment.isPublic ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}>
                  {assessment.isPublic ? <Globe size={9} /> : <Lock size={9} />}
                  {assessment.isPublic ? "Public" : "Private"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                By {assessment.createdByTeacherName} · {new Date(assessment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isEditMode && (
              <>
                {(isOwner || assessment.isPublic) && (
                  <button
                    onClick={handleHostAssessment}
                    disabled={hosting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-none bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white shadow-sm transition-all cursor-pointer border border-blue-600"
                  >
                    {hosting ? <Loader size={13} className="animate-spin" /> : <Play size={13} />}
                    Host Live Exam
                  </button>
                )}
                {isOwner && (
                  <>
                    <button onClick={startEdit} className="flex items-center gap-1.5 px-4 py-2 rounded-none bg-white hover:bg-gray-50 border border-gray-300 text-xs font-bold text-gray-700 transition-all cursor-pointer">
                      <Edit size={13} /> Edit
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
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-none bg-brand-red hover:bg-brand-red/90 disabled:opacity-50 text-xs font-bold text-white transition-all cursor-pointer shadow-sm border border-brand-red">
                  {saving ? <Loader size={13} className="animate-spin" /> : <Save size={13} />} {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
            {!isEditMode && (
              <button onClick={() => setShowPrintModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-none bg-white hover:bg-gray-50 border border-gray-300 text-xs font-bold text-gray-750 transition-all cursor-pointer">
                <Printer size={13} /> Print / Export
              </button>
            )}
          </div>
        </div>

        {saveError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-none text-xs text-red-600 no-print">
            <AlertCircle size={14} />{saveError}
          </div>
        )}

        {/* Meta cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
          {isEditMode ? (
            <>
              <div className="bg-white/80 border border-gray-200 rounded-none p-4 col-span-2 space-y-1.5 shadow-sm backdrop-blur-sm">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Assessment Title</label>
                <input value={editForm?.title || ""} onChange={(e) => setEditForm({ ...editForm!, title: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-blue-600" />
              </div>
              <div className="bg-white/80 border border-gray-200 rounded-none p-4 space-y-1.5 shadow-sm backdrop-blur-sm">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Subject</label>
                <input value={editForm?.subject || ""} onChange={(e) => setEditForm({ ...editForm!, subject: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600" />
              </div>
              <div className="bg-white/80 border border-gray-200 rounded-none p-4 space-y-1.5 shadow-sm backdrop-blur-sm">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Duration (mins)</label>
                <input type="number" value={editForm?.duration || 30} onChange={(e) => setEditForm({ ...editForm!, duration: parseInt(e.target.value) })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600" />
              </div>
            </>
          ) : (
            <>
              <div className="bg-white/80 border border-gray-200 rounded-none p-4 flex items-center gap-3 shadow-sm backdrop-blur-sm">
                <BookOpen className="text-blue-600 shrink-0" size={20} />
                <div><label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Subject</label><p className="text-sm font-bold text-gray-900 mt-0.5">{assessment.subject}</p></div>
              </div>
              <div className="bg-white/80 border border-gray-200 rounded-none p-4 flex items-center gap-3 shadow-sm backdrop-blur-sm">
                <Clock className="text-blue-600 shrink-0" size={20} />
                <div><label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Duration</label><p className="text-sm font-bold text-gray-900 mt-0.5">{assessment.duration} mins</p></div>
              </div>
              <div className="bg-white/80 border border-gray-200 rounded-none p-4 col-span-2 flex items-center gap-3 shadow-sm backdrop-blur-sm">
                <div><label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Chapter / Lesson</label><p className="text-sm font-bold text-gray-900 mt-0.5">{assessment.lesson}</p></div>
              </div>
            </>
          )}
        </div>

        {/* Print Header (visible on print only) */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">{assessment.title}</h1>
          <p className="text-sm">Subject: {assessment.subject} | Lesson: {assessment.lesson} | Duration: {assessment.duration} mins</p>
          <hr className="mt-3" />
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between no-print border-b border-gray-200 pb-3">
            <h3 className="text-base font-bold text-gray-900">{questions.length} Questions</h3>
            {isEditMode && (
              <button onClick={addEditQuestion} className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 border border-gray-300 transition-all cursor-pointer">
                <Plus size={12} /> Add Question
              </button>
            )}
          </div>

          {/* New Question Draft Form at the top */}
          {isEditMode && newQuestionForm && (
            <div className="bg-white border border-blue-300 rounded-none p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-xs font-black uppercase tracking-widest text-blue-600">Draft New Question</span>
                <button onClick={() => { setNewQuestionForm(null); setNewQuestionError(null); }} className="p-1 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
                  <X size={14} />
                </button>
              </div>

              {/* Question Type Options */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Question Type</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { val: "multiple_choice", label: "Multiple Choice" },
                    { val: "true_false", label: "True / False" },
                    { val: "short_answer", label: "Short Answer" }
                  ].map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => {
                        setNewQuestionForm({
                          ...newQuestionForm,
                          type: t.val,
                          options: t.val === "multiple_choice" ? ["", "", "", ""] : t.val === "true_false" ? ["True", "False"] : [],
                          correctAnswer: t.val === "true_false" ? "True" : ""
                        });
                        setNewQuestionError(null);
                      }}
                      className={`px-3 py-1.5 rounded-none text-xs font-bold border transition-all cursor-pointer ${
                        newQuestionForm.type === t.val
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Text */}
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

              {/* Options & Correct Answer fields based on type */}
              {newQuestionForm.type === "multiple_choice" && (
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
                          name="new_tf_answer"
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

              {newQuestionForm.type === "short_answer" && (
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

              {/* Explanation */}
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
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-none text-xs font-bold text-white shadow-sm border border-blue-600 cursor-pointer"
                >
                  Save Question
                </button>
              </div>
            </div>
          )}

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
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{q.type.replace("_", " ")}</span>
                {isEditMode && (
                  <button onClick={() => removeEditQuestion(idx)} className="ml-auto p-1 text-gray-400 hover:text-red-650 transition-colors cursor-pointer"><Trash2 size={12} /></button>
                )}
              </div>
              <p className="text-sm font-bold mb-1 print:hidden text-gray-900">{idx + 1}.</p>

              {isEditMode ? (
                <textarea value={q.question} onChange={(e) => updateEditQuestion(idx, "question", e.target.value)} rows={2}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-blue-600 resize-none mb-3" />
              ) : (
                <p className="text-sm font-bold text-gray-900 mb-4">{q.question}</p>
              )}

              {q.type === "multiple_choice" && q.options?.length > 0 && (
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

              {/* Answer — hidden on print if !printIncludeAnswers */}
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

              </div>

        )}
        {/* Conducted Sessions Section */}
        <div className="mt-12 space-y-6 no-print">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
            <div className="h-10 w-10 bg-blue-50 border border-blue-100 text-blue-600 rounded-none flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Conducted Live Sessions</h3>
              <p className="text-xs text-gray-500 mt-0.5">Historical list of live assessment rooms conducted for this exam</p>
            </div>
          </div>

          {conductedSessions.length === 0 ? (
            <div className="bg-white/80 border border-gray-200 rounded-none p-8 text-center text-gray-500 text-xs shadow-sm backdrop-blur-sm">
              <p className="font-bold text-gray-900">No Conducted Sessions Yet</p>
              <p className="text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Click on <span className="text-blue-600 font-bold">"Host Live Exam"</span> in the header to start a live session and invite students in real-time.
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
                    {/* Accordion Header */}
                    <button
                      onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                      className="w-full text-left p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-8 w-8 rounded-none flex items-center justify-center text-xs font-bold shrink-0 ${
                          session.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          session.status === "ACTIVE" ? "bg-blue-50 text-blue-600 border border-blue-100 animate-pulse" :
                          "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                          {session.status === "COMPLETED" ? "C" : session.status === "ACTIVE" ? "A" : "W"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{formattedTime}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Token ID: {session.token}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-xs shrink-0">
                        <div className="text-right">
                          <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Students</p>
                          <p className="font-bold text-gray-800 mt-0.5">{session.participantCount} Joined</p>
                        </div>

                        {session.status === "COMPLETED" && (
                          <>
                            <div className="text-right">
                              <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Top Score</p>
                              <p className="font-bold text-blue-600 mt-0.5">{session.topScore ?? "-"} / {totalQ}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Average</p>
                              <p className="font-bold text-emerald-600 mt-0.5">{session.avgScore ?? "-"} / {totalQ}</p>
                            </div>
                          </>
                        )}

                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-none ${
                          session.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          session.status === "ACTIVE" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                          "bg-gray-100 text-gray-655 border border-gray-200"
                        }`}>
                          {session.status}
                        </span>

                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </button>

                    {/* Accordion Body */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50/50 p-6 space-y-6">
                        {/* Session details status CTA */}
                        {(session.status === "WAITING" || session.status === "ACTIVE") && (
                          <div className="bg-white border border-blue-200 rounded-none p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
                            <div>
                              <p className="text-xs font-bold text-blue-600">Live Control Room Active</p>
                              <p className="text-[11px] text-gray-650 mt-0.5">
                                This live classroom room is currently {session.status.toLowerCase()}. You can connect and manage the room as the educator.
                              </p>
                            </div>
                            <Link
                              href={`/live/${session.token}/host`}
                              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-none text-xs font-bold text-white text-center transition-all shrink-0 cursor-pointer shadow-sm border border-blue-600"
                            >
                              Open Educator Dashboard
                            </Link>
                          </div>
                        )}

                        {/* Leaderboard */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <Trophy size={14} className="text-blue-600" />
                            Final Leaderboard & Roster Results
                          </h4>

                          <div className="overflow-x-auto border border-gray-200 rounded-none bg-white">
                            <table className="w-full border-collapse text-left text-[11px] text-gray-700">
                              <thead>
                                <tr className="border-b border-gray-200 text-[9px] font-black uppercase text-gray-500 bg-gray-50">
                                  <th className="py-2.5 px-3">Rank</th>
                                  <th className="py-2.5 px-4">Student</th>
                                  <th className="py-2.5 px-4">Score</th>
                                  <th className="py-2.5 px-4">Time Taken</th>
                                  <th className="py-2.5 px-4">Tab Switches</th>
                                  <th className="py-2.5 px-4">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-150">
                                {session.participants.map((participant: any, rankIdx: number) => {
                                  const formattedTime = participant.timeTakenSeconds !== null
                                    ? `${Math.floor(participant.timeTakenSeconds / 60)}:${(participant.timeTakenSeconds % 60).toString().padStart(2, "0")}`
                                    : "-";

                                  return (
                                    <tr key={participant.id} className="hover:bg-gray-50/50">
                                      <td className="py-3 px-3">
                                        <span className={`h-5 w-5 rounded-none flex items-center justify-center text-[10px] font-black ${
                                          rankIdx === 0 ? "bg-amber-100 text-amber-800 border border-amber-250" :
                                          rankIdx === 1 ? "bg-gray-100 text-gray-700 border border-gray-200" :
                                          rankIdx === 2 ? "bg-orange-100 text-orange-850 border border-orange-200" :
                                          "bg-gray-50 text-gray-500 border border-gray-200"
                                        }`}>
                                          {rankIdx + 1}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4">
                                        <p className="font-bold text-gray-900">{participant.name}</p>
                                        <p className="text-[9px] text-gray-500 mt-0.5">ID: {participant.studentId} · Grade {participant.grade}-{participant.section}</p>
                                      </td>
                                      <td className="py-3 px-4 font-black text-emerald-600">
                                        {participant.score !== null ? `${participant.score} / ${totalQ}` : "-"}
                                      </td>
                                      <td className="py-3 px-4 font-mono text-gray-650">
                                        {formattedTime}
                                      </td>
                                      <td className="py-3 px-4">
                                        {participant.tabSwitches > 0 ? (
                                          <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-none">
                                            {participant.tabSwitches} Switch{participant.tabSwitches > 1 ? "es" : ""}
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-black uppercase text-gray-400">
                                            0
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3 px-4">
                                        <span className={`text-[9px] font-black uppercase ${
                                          participant.completedAt ? "text-emerald-600" : "text-gray-400"
                                        }`}>
                                          {participant.completedAt ? "Finished" : "No Submission"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            {session.participants.length === 0 && (
                              <div className="text-center py-6 text-gray-400">
                                No participants joined this session.
                              </div>
                            )}
                          </div>
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

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-gray-250 w-full max-w-md rounded-none p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Print / Export</h3>
              <button onClick={() => setShowPrintModal(false)} className="p-2 hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded-none text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Choose the print format:</p>
              {[
                { value: true, label: "📋 Educator Answer Key", desc: "Includes all answers and explanations" },
                { value: false, label: "📄 Student Exam Paper", desc: "Questions only — no answers shown" },
              ].map(({ value, label, desc }) => (
                <button key={label} onClick={() => setPrintIncludeAnswers(value)}
                  className={`w-full text-left p-4 rounded-none border transition-all cursor-pointer ${
                    printIncludeAnswers === value ? "bg-blue-50 border-blue-500/30 text-blue-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-350 hover:bg-gray-50"
                  }`}
                >
                  <p className="font-bold text-sm text-gray-850">{label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{desc}</p>
                </button>
              ))}
            </div>
            <button onClick={handlePrint} className="w-full bg-brand-red hover:bg-brand-red/90 border border-brand-red py-3.5 rounded-none font-bold text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm">
              <FileDown size={14} /> Print Now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
