"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud, FileText, Sliders, Zap, Loader, Plus, Trash2,
  CheckCircle, AlertCircle, Save, X, Eye, FileDown, Printer, Award
} from "lucide-react";
import dynamic from "next/dynamic";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => ({ default: m.PDFDownloadLink })),
  { ssr: false }
);

import QuestionBankPDFDocument from "@/components/recruitment/QuestionBankPDFDocument";
import { allschoolsdata } from "@/app/recruitment/generate/page"; // Import the shared school dataset

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export default function DirectorGeneratePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [director, setDirector] = useState<any>(null);

  // Print / Export Popups and layouts states
  const [activePrintMode, setActivePrintMode] = useState<"print" | "pdf">("print");
  const [showPrintConfigModal, setShowPrintConfigModal] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    assessmentName: "",
    schoolName: "",
    position: "",
    department: "",
    classification: "",
    date: "",
    day: "",
    duration: "30 Minutes",
    generatedBy: "",
    includeAnswers: true,
  });

  // Form inputs
  const [files, setFiles] = useState<File[]>([]);
  const [generationMode, setGenerationMode] = useState<"pdf_only" | "pdf_context" | "text_only">("text_only");
  const [contextText, setContextText] = useState("");

  // Metadata / Custom Director inputs
  const [position, setPosition] = useState(""); // Evaluation Focus (e.g., "PGT Physics Teacher" or "Primary School Teacher")
  const [department, setDepartment] = useState("");
  const [teachingType, setTeachingType] = useState("teaching"); // teaching or non teaching
  const [recruitmentFor, setRecruitmentFor] = useState(allschoolsdata[0].name);
  const [difficulty, setDifficulty] = useState("mixed");
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionTypes, setQuestionTypes] = useState({
    multiple_choice: true,
    true_false: true,
    short_answer: false,
  });

  const [generatorLoading, setGeneratorLoading] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  // Modals and manual editing
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [duration, setDuration] = useState(30);

  const [newQuestionForm, setNewQuestionForm] = useState<any | null>(null);
  const [newQuestionError, setNewQuestionError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const t = localStorage.getItem("directorToken");
    const u = localStorage.getItem("directorUser");
    if (!t || !u) {
      router.push("/director/login");
      return;
    }
    setToken(t);
    setDirector(JSON.parse(u));
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      const valid: File[] = [];
      let err: string | null = null;
      for (const f of selected) {
        const ext = f.name.split(".").pop()?.toLowerCase();
        if (ext !== "pdf" && ext !== "docx" && ext !== "txt") {
          err = "Unsupported format. Upload PDF, DOCX or TXT.";
        } else {
          valid.push(f);
        }
      }
      if (err) {
        setGeneratorError(err);
      } else {
        setFiles(prev => [...prev, ...valid]);
        setGeneratorError(null);
      }
    }
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position.trim()) {
      setGeneratorError("Please specify the target evaluation subject or teacher role.");
      return;
    }
    if (generationMode !== "text_only" && files.length === 0) {
      setGeneratorError("Please upload at least one source document.");
      return;
    }
    if (generationMode !== "pdf_only" && !contextText.trim()) {
      setGeneratorError("Please enter context instructions or custom prompts.");
      return;
    }

    const types = Object.entries(questionTypes)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(",");
    if (!types) {
      setGeneratorError("Select at least one question type.");
      return;
    }

    setGeneratorLoading(true);
    setGeneratorError(null);
    setGeneratedQuestions([]);

    const formData = new FormData();
    files.forEach(f => {
      formData.append("file", f);
    });
    formData.append("numQuestions", numQuestions.toString());
    formData.append("questionTypes", types);
    formData.append("generationMode", generationMode);
    formData.append("contextText", contextText);
    formData.append("difficulty", difficulty);
    formData.append("position", position);
    formData.append("department", department || "General");
    formData.append("teachingType", teachingType);

    try {
      const res = await fetch("/api/director/assessment/generate", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedQuestions(data.questions);
        setAssessmentTitle(`${position} Assessment - ${new Date().toLocaleDateString("en-IN")}`);
      } else {
        setGeneratorError(data.message || "Failed to generate assessment.");
      }
    } catch (err: any) {
      setGeneratorError("Network error: " + err.message);
    } finally {
      setGeneratorLoading(false);
    }
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentTitle.trim()) {
      setSaveError("Assessment Title is required.");
      return;
    }
    setSaveLoading(true);
    setSaveError(null);

    const payload = {
      title: assessmentTitle.trim(),
      duration,
      teaching: teachingType === "teaching" ? "Teaching" : "Non-Teaching",
      department: department || "General",
      date: new Date().toISOString().split("T")[0],
      day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
      generatedBy: director?.name || "Director",
      position: position.trim(),
      recruitmentFor: recruitmentFor,
      questions: generatedQuestions,
    };

    try {
      const res = await fetch("/api/director/assessment/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/director/assessments");
      } else {
        setSaveError(data.message || "Failed to save assessment template.");
      }
    } catch (err: any) {
      setSaveError("Network error: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const addQuestion = () => {
    if (newQuestionForm) {
      setNewQuestionError("Please save the current new question draft first.");
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
    if (!newQuestionForm) return;
    if (!newQuestionForm.question.trim()) {
      setNewQuestionError("Please enter the question text.");
      return;
    }
    if (newQuestionForm.type === "multiple_choice") {
      if (newQuestionForm.options.some((opt: string) => !opt.trim())) {
        setNewQuestionError("All 4 options must be completed.");
        return;
      }
      if (!newQuestionForm.correctAnswer.trim()) {
        setNewQuestionError("Please specify the correct option value.");
        return;
      }
    } else if (newQuestionForm.type === "true_false") {
      if (!newQuestionForm.correctAnswer.trim()) {
        setNewQuestionError("Select True or False.");
        return;
      }
    } else if (!newQuestionForm.correctAnswer.trim()) {
      setNewQuestionError("Provide a baseline correct answer description.");
      return;
    }

    const newQ: Question = {
      id: Date.now().toString(),
      type: newQuestionForm.type,
      question: newQuestionForm.question.trim(),
      options: newQuestionForm.type === "multiple_choice"
        ? newQuestionForm.options.map((o: string) => o.trim())
        : newQuestionForm.type === "true_false"
          ? ["True", "False"]
          : [],
      correctAnswer: newQuestionForm.correctAnswer.trim(),
      explanation: newQuestionForm.explanation.trim()
    };

    setGeneratedQuestions(prev => [...prev, newQ]);
    setNewQuestionForm(null);
    setNewQuestionError(null);
  };

  const removeQuestion = (idx: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const openPrintModal = (mode: "print" | "pdf") => {
    setActivePrintMode(mode);
    setPrintConfig({
      assessmentName: printConfig.assessmentName || assessmentTitle || `${position || "Teacher"} Evaluation`,
      schoolName: recruitmentFor || allschoolsdata[0].name,
      position: position || "Teacher Profile",
      department: department || "Academics",
      classification: teachingType === "teaching" ? "Teaching Profile" : "Non-Teaching Profile",
      date: printConfig.date || new Date().toLocaleDateString("en-IN"),
      day: printConfig.day || new Date().toLocaleDateString("en-IN", { weekday: 'long' }),
      duration: printConfig.duration || `${duration || 30} Minutes`,
      generatedBy: printConfig.generatedBy || director?.name || "Director",
      includeAnswers: printConfig.includeAnswers !== undefined ? printConfig.includeAnswers : true,
    });
    setShowPrintConfigModal(true);
  };

  const handlePrint = () => {
    setShowPrintConfigModal(false);
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-300">
      <div className="no-print">
        <h2 className="text-3xl font-black text-gray-900">AI Academic Evaluation Generator</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tailor teacher examinations by specifying the subject, school, and department. Feed pedagogical materials or reference textbooks to Gemini AI to generate custom questions.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* LEFT: Config Panel */}
        <div className="lg:col-span-2 space-y-6 no-print">
          <form onSubmit={handleGenerate} className="space-y-6">
            
            {/* Subject/Target role metadata */}
            <div className="bg-white/80 border border-gray-200 rounded-none p-6 space-y-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Award size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Teacher Evaluation Targeting</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Evaluation Focus / Role</label>
                <input
                  type="text" required value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. PGT Physics Educator"
                  className="w-full bg-white border border-gray-300 rounded-none px-4 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Target Institution / School</label>
                <select
                  value={recruitmentFor}
                  onChange={(e) => setRecruitmentFor(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-none px-4 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                >
                  {allschoolsdata.map((school) => (
                    <option key={school.id} value={school.name}>{school.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Classification</label>
                  <select
                    value={teachingType}
                    onChange={(e) => setTeachingType(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-none px-4 py-2 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                  >
                    <option value="teaching">Teaching</option>
                    <option value="non-teaching">Non-Teaching</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Department</label>
                  <input
                    type="text" value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Science, Mathematics"
                    className="w-full bg-white border border-gray-300 rounded-none px-4 py-2 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Generation Mode */}
            <div className="bg-white/80 border border-gray-200 rounded-none p-5 space-y-3 shadow-sm backdrop-blur-sm">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Generation Mode</label>
              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1 rounded-none border border-gray-200">
                {[
                  { id: "pdf_only", label: "PDF Only", icon: FileText },
                  { id: "pdf_context", label: "PDF + Context", icon: Zap },
                  { id: "text_only", label: "Text Prompt", icon: Sliders }
                ].map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id} type="button"
                      onClick={() => {
                        setGenerationMode(mode.id as any);
                        setGeneratorError(null);
                      }}
                      className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-none text-[10px] font-extrabold transition-all cursor-pointer ${
                        generationMode === mode.id
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-950 hover:bg-gray-200/50"
                      }`}
                    >
                      <Icon size={14} />
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* File upload */}
            {generationMode !== "text_only" && (
              <div className="bg-white/80 border border-gray-200 rounded-none p-6 space-y-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Reference Materials</h3>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">{files.length} files</span>
                </div>
                
                <label className="border-2 border-dashed border-gray-300 hover:border-blue-500/40 rounded-none p-6 flex flex-col items-center gap-3 bg-gray-50/50 transition-colors cursor-pointer group relative">
                  <input
                    type="file" multiple accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="h-12 w-12 rounded-none bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                    <UploadCloud size={24} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-700 text-sm">Upload Reference Docs</p>
                    <p className="text-[10px] text-gray-400 mt-1">PDF, DOCX, or TXT formats</p>
                  </div>
                </label>

                {files.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {files.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-none px-3 py-2 text-xs">
                        <span className="font-bold text-blue-600 truncate max-w-[180px]">{f.name}</span>
                        <button type="button" onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Custom prompts */}
            {generationMode !== "pdf_only" && (
              <div className="bg-white/80 border border-gray-200 rounded-none p-6 space-y-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-gray-900">Contextual Prompt Guidelines</h3>
                </div>
                <textarea
                  required value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder={
                    generationMode === "pdf_context"
                      ? "e.g., Focus specifically on pedagogical methods and active learning guidelines inside the textbook."
                      : "e.g., Generate a teacher validation paper testing classroom management, creative lecturing, and educational ethics."
                  }
                  rows={4}
                  className="w-full bg-white border border-gray-300 rounded-none px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-600 transition-all resize-none font-medium"
                />
              </div>
            )}

            {/* Generator config */}
            <div className="bg-white/80 border border-gray-200 rounded-none p-6 space-y-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Sliders size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Exam Parameters</h3>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                  Questions Pool Size: <span className="text-gray-900">{numQuestions}</span>
                </label>
                <input
                  type="range" min={5} max={25} value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Question Formats</label>
                {[
                  { key: "multiple_choice", label: "Multiple Choice Questions (MCQ)" },
                  { key: "true_false", label: "True / False Questions" },
                  { key: "short_answer", label: "Subjective Short Answers" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => setQuestionTypes({ ...questionTypes, [key]: !(questionTypes as any)[key] })}
                      className={`h-5 w-5 rounded-none border-2 flex items-center justify-center transition-all cursor-pointer ${
                        (questionTypes as any)[key] ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                      }`}
                    >
                      {(questionTypes as any)[key] && <CheckCircle size={12} className="text-white" />}
                    </div>
                    <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {generatorError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-none text-xs text-red-600">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{generatorError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={generatorLoading || !position.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-none font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm text-white cursor-pointer"
            >
              {generatorLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Compiling Evaluation Assessment...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Execute Gemini Assessment Engine
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT: Generated Questions Preview */}
        <div className="lg:col-span-3 space-y-6 relative">
          
          <div className="flex items-center justify-between no-print border-b border-gray-200 pb-4">
            <h3 className="text-lg font-extrabold flex items-center gap-2">
              <Eye size={18} className="text-blue-600" />
              <span className="text-gray-900 font-extrabold">Assessment Question Board ({generatedQuestions.length} Questions)</span>
            </h3>

            {generatedQuestions.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => openPrintModal("print")}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-none text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Print Template</span>
                </button>
                <button
                  onClick={() => openPrintModal("pdf")}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-emerald-600 px-4 py-2 rounded-none text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileDown size={13} />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-none text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save size={13} />
                  <span>Save Assessment</span>
                </button>
              </div>
            )}
          </div>

          {generatedQuestions.length === 0 ? (
            <div className="bg-white/40 border border-dashed border-gray-300 rounded-none p-16 text-center text-gray-500 space-y-2 no-print">
              <FileText size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-700">Ready to build your assessment?</p>
              <p className="text-xs max-w-sm mx-auto text-gray-500">Fill in evaluation parameters, specify the target role/subject, choose a generation mode, and execute the generator.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Manual Question Editing */}
              <div className="space-y-4 no-print">
                {generatedQuestions.map((q, idx) => (
                  <div key={q.id} className="bg-white/80 border border-gray-200 rounded-none p-5 space-y-4 relative shadow-sm backdrop-blur-sm">
                    <button
                      onClick={() => removeQuestion(idx)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                      <span>Question #{idx + 1}</span>
                      <span className="text-gray-300">•</span>
                      <span>{q.type.replace("_", " ")}</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-gray-400">Question Text</label>
                      <input
                        type="text" value={q.question}
                        onChange={(e) => {
                          const updated = [...generatedQuestions];
                          updated[idx].question = e.target.value;
                          setGeneratedQuestions(updated);
                        }}
                        className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs text-gray-900 focus:border-blue-600 outline-none"
                      />
                    </div>

                    {q.type === "multiple_choice" && (
                      <div className="grid grid-cols-2 gap-3 pl-4">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-gray-400">Option {String.fromCharCode(65 + oIdx)}</label>
                            <input
                              type="text" value={opt}
                              onChange={(e) => {
                                const updated = [...generatedQuestions];
                                updated[idx].options[oIdx] = e.target.value;
                                setGeneratedQuestions(updated);
                              }}
                              className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-800 focus:border-blue-600 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Correct Answer</label>
                        {q.type === "true_false" ? (
                          <select
                            value={q.correctAnswer}
                            onChange={(e) => {
                              const updated = [...generatedQuestions];
                              updated[idx].correctAnswer = e.target.value;
                              setGeneratedQuestions(updated);
                            }}
                            className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-900 focus:border-blue-600 outline-none font-bold"
                          >
                            <option value="True">True</option>
                            <option value="False">False</option>
                          </select>
                        ) : (
                          <input
                            type="text" value={q.correctAnswer}
                            onChange={(e) => {
                              const updated = [...generatedQuestions];
                              updated[idx].correctAnswer = e.target.value;
                              setGeneratedQuestions(updated);
                            }}
                            className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-emerald-600 focus:border-blue-600 outline-none font-bold"
                          />
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">AI Grading Explanation</label>
                        <input
                           type="text" value={q.explanation || ""}
                          onChange={(e) => {
                            const updated = [...generatedQuestions];
                            updated[idx].explanation = e.target.value;
                            setGeneratedQuestions(updated);
                          }}
                          className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-600 focus:border-blue-600 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Question Form */}
              <div className="no-print border-t border-gray-200 pt-4">
                {newQuestionForm ? (
                  <div className="bg-white/80 border border-gray-300 rounded-none p-5 space-y-4 shadow-sm backdrop-blur-sm">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">New Assessment Question Draft</h4>
                      <button onClick={() => setNewQuestionForm(null)} className="text-gray-400 hover:text-red-600 cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Question Type</label>
                        <select
                          value={newQuestionForm.type}
                          onChange={(e) => {
                            setNewQuestionForm({
                              ...newQuestionForm,
                              type: e.target.value,
                              correctAnswer: e.target.value === "true_false" ? "True" : ""
                            });
                          }}
                          className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs text-gray-900 focus:border-blue-600 outline-none"
                        >
                          <option value="multiple_choice">Multiple Choice (MCQ)</option>
                          <option value="true_false">True / False</option>
                          <option value="short_answer">Short Answer</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Question Text</label>
                        <input
                          type="text" value={newQuestionForm.question}
                          onChange={(e) => setNewQuestionForm({ ...newQuestionForm, question: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs text-gray-900 focus:border-blue-600 outline-none"
                        />
                      </div>
                    </div>

                    {newQuestionForm.type === "multiple_choice" && (
                      <div className="grid grid-cols-2 gap-3 pl-4">
                        {newQuestionForm.options.map((opt: string, oIdx: number) => (
                          <div key={oIdx} className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 uppercase">Option {String.fromCharCode(65 + oIdx)}</label>
                            <input
                              type="text" value={opt}
                              onChange={(e) => {
                                const newOpts = [...newQuestionForm.options];
                                newOpts[oIdx] = e.target.value;
                                setNewQuestionForm({ ...newQuestionForm, options: newOpts });
                              }}
                              className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-800 focus:border-blue-600 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Correct Answer Value</label>
                        {newQuestionForm.type === "true_false" ? (
                          <select
                            value={newQuestionForm.correctAnswer}
                            onChange={(e) => setNewQuestionForm({ ...newQuestionForm, correctAnswer: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs text-gray-900 focus:border-blue-600 outline-none font-bold"
                          >
                            <option value="True">True</option>
                            <option value="False">False</option>
                          </select>
                        ) : (
                          <input
                            type="text" value={newQuestionForm.correctAnswer}
                            onChange={(e) => setNewQuestionForm({ ...newQuestionForm, correctAnswer: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs text-emerald-600 focus:border-blue-600 outline-none font-bold"
                            placeholder={newQuestionForm.type === "multiple_choice" ? "Exact option text" : "Target baseline keyword"}
                          />
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">AI Grading Explanation</label>
                        <input
                          type="text" value={newQuestionForm.explanation}
                          onChange={(e) => setNewQuestionForm({ ...newQuestionForm, explanation: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs text-gray-600 focus:border-blue-600 outline-none"
                        />
                      </div>
                    </div>

                    {newQuestionError && (
                      <p className="text-xs text-red-600 font-bold">{newQuestionError}</p>
                    )}

                    <button
                      type="button"
                      onClick={saveNewQuestion}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 text-xs cursor-pointer"
                    >
                      Save Draft Question
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 py-3.5 text-xs text-gray-600 hover:text-blue-600 transition-colors font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} /> Add Custom Question Template
                  </button>
                )}
              </div>

              {/* Printable assessment view (ONLY active during window.print()) */}
              <div className="print-only hidden pt-8 space-y-6 text-gray-900 bg-white">
                <div className="text-center space-y-2 pb-6 border-b-2 border-gray-800">
                  <h1 className="text-2xl font-black uppercase tracking-wider">{printConfig.schoolName}</h1>
                  <h2 className="text-xl font-bold uppercase tracking-wider">{printConfig.assessmentName}</h2>
                  <p className="text-sm font-semibold text-gray-700">
                    Subject/Focus: {printConfig.position} &nbsp;&bull;&nbsp; Dept: {printConfig.department}
                  </p>
                  <p className="text-xs font-bold text-gray-500">
                    Date: {printConfig.date} ({printConfig.day}) &nbsp;&bull;&nbsp; Duration: {printConfig.duration}
                  </p>
                </div>

                <div className="space-y-6 pt-4">
                  {generatedQuestions.map((q, idx) => (
                    <div key={q.id} className="space-y-3 avoid-break">
                      <p className="font-bold text-sm">
                        Q{idx + 1}. {q.question}
                      </p>
                      
                      {q.type === "multiple_choice" && (
                        <div className="grid grid-cols-2 gap-2 pl-4 text-xs font-semibold">
                          {q.options.map((opt, oIdx) => (
                            <p key={oIdx}>
                              {String.fromCharCode(65 + oIdx)}) {opt}
                            </p>
                          ))}
                        </div>
                      )}

                      {q.type === "true_false" && (
                        <div className="flex gap-4 pl-4 text-xs font-semibold">
                          <p>A) True</p>
                          <p>B) False</p>
                        </div>
                      )}

                      {printConfig.includeAnswers && (
                        <div className="bg-gray-50 p-3 border-l-4 border-emerald-600 text-xs mt-2">
                          <p className="font-bold text-emerald-700">Correct Answer: {q.correctAnswer}</p>
                          {q.explanation && (
                            <p className="text-gray-650 mt-1 italic">Explanation: {q.explanation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 max-w-md w-full border border-gray-300 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-gray-900">Save Evaluation Template</h3>
            <form onSubmit={handleSaveAssessment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-500 block">Assessment Title</label>
                <input
                  type="text" required value={assessmentTitle}
                  onChange={(e) => setAssessmentTitle(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs font-bold text-gray-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-500 block">Duration (Minutes)</label>
                <input
                  type="number" required min={5} max={300} value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs font-bold text-gray-900 focus:border-blue-600 outline-none"
                />
              </div>

              {saveError && (
                <p className="text-xs text-red-600 font-bold">{saveError}</p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button" onClick={() => setShowSaveModal(false)}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saveLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 text-xs cursor-pointer disabled:opacity-50"
                >
                  {saveLoading ? "Saving..." : "Save Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print / Export Config Modal */}
      {showPrintConfigModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 max-w-md w-full border border-gray-300 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-gray-900">
              {activePrintMode === "print" ? "Print Exam configuration" : "Export PDF Configuration"}
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">School Name / Logo Header</label>
                <input
                  type="text" value={printConfig.schoolName}
                  onChange={(e) => setPrintConfig({ ...printConfig, schoolName: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Assessment Title</label>
                <input
                  type="text" value={printConfig.assessmentName}
                  onChange={(e) => setPrintConfig({ ...printConfig, assessmentName: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block">Subject/Focus</label>
                  <input
                    type="text" value={printConfig.position}
                    onChange={(e) => setPrintConfig({ ...printConfig, position: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block">Department</label>
                  <input
                    type="text" value={printConfig.department}
                    onChange={(e) => setPrintConfig({ ...printConfig, department: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block">Date</label>
                  <input
                    type="text" value={printConfig.date}
                    onChange={(e) => setPrintConfig({ ...printConfig, date: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block">Duration</label>
                  <input
                    type="text" value={printConfig.duration}
                    onChange={(e) => setPrintConfig({ ...printConfig, duration: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-900"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group mt-2 pt-1">
                <div
                  onClick={() => setPrintConfig({ ...printConfig, includeAnswers: !printConfig.includeAnswers })}
                  className={`h-5 w-5 rounded-none border-2 flex items-center justify-center transition-all cursor-pointer ${
                    printConfig.includeAnswers ? "bg-emerald-600 border-emerald-600" : "border-gray-300 bg-white"
                  }`}
                >
                  {printConfig.includeAnswers && <CheckCircle size={12} className="text-white" />}
                </div>
                <span className="text-xs text-gray-700 font-bold group-hover:text-gray-950">Append AI Correct Answer Sheets</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button" onClick={() => setShowPrintConfigModal(false)}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 text-xs cursor-pointer"
              >
                Close Settings
              </button>
              
              {activePrintMode === "print" ? (
                <button
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 text-xs cursor-pointer"
                >
                  Trigger Browser Print
                </button>
              ) : isMounted ? (
                <PDFDownloadLink
                  document={
                    <QuestionBankPDFDocument
                      questions={generatedQuestions}
                      config={printConfig}
                    />
                  }
                  fileName={`${printConfig.assessmentName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_paper.pdf`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 text-xs cursor-pointer text-center inline-block"
                >
                  {({ loading: pdfLoading }) => (pdfLoading ? "Compiling Document..." : "Download PDF Document")}
                </PDFDownloadLink>
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
