"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud, FileText, Sliders, Zap, Loader, Plus, Trash2,
  CheckCircle, AlertCircle, Save, X, GripVertical, Printer, FileDown
} from "lucide-react";
import dynamic from "next/dynamic";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => ({ default: m.PDFDownloadLink })),
  { ssr: false }
);

import QuestionBankPDFDocument from "@/components/teacher/QuestionBankPDFDocument";

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export const allschoolsdata = [
  {
    id: 1,
    name: "ACHARIYA ARTS AND SCIENCE COLLEGE (AASC) - VILLIANUR, PUDUCHERRY",
  },
  { id: 2, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) ADYAR - ADYAR, CHENNAI" },
  {
    id: 3,
    name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) ALPKM - ALAPAKKAM, CHENNAI",
  },
  { id: 4, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) KKN - KK NAGAR, CHENNAI" },
  {
    id: 5,
    name: "ACHARIYA BALA SIKSHA MANDIR (ABSM)-TT PP - THENGATHITTU, PUDUCHERRY",
  },
  {
    id: 6,
    name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) KP - KALAPET, PUDUCHERRY",
  },
  {
    id: 7,
    name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) MVL CHENNAI - MADURAVOYAL, CHENNAI",
  },
  { id: 8, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) - NOLAMBUR" },
  { id: 9, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) PBN - PADMANAB NAGAR" },
  { id: 10, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) RKN - RK NAGAR" },
  {
    id: 11,
    name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) SGM - SALIGRAMAM, CHENNAI",
  },
  {
    id: 12,
    name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) THIRU NAGAR - THIRUNAGAR",
  },
  { id: 13, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) TRICHY - TRICHY" },
  {
    id: 14,
    name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) VGM - VIRUGAMBAKKAM, CHENNAI",
  },
  { id: 15, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) VN - VENKATA NAGAR" },
  {
    id: 16,
    name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) VVK - VALASARAVAKKAM, CHENNAI",
  },
  { id: 17, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM)-GM - GORIMEDU" },
  {
    id: 18,
    name: "ACHARIYA BALA SIKSHA MANDIR (ABSM)-LP - LAWSPET, PUDUCHERRY",
  },
  {
    id: 19,
    name: "ACHARIYA BALA SIKSHA MANDIR (ABSM)-MLP - MUTHIALPET, PUDUCHERRY",
  },
  {
    id: 20,
    name: "ACHARIYA BALA SIKSHA MANDIR (ABSM)-TT - THENGATHITTU, PUDUCHERRY",
  },
  {
    id: 21,
    name: "ACHARIYA CENTRE FOR EXCELLENCE IN TEACHING (ACET) - VILLIANUR, PUDUCHERRY",
  },
  { id: 22, name: "AKLAVYA INTERNATIONAL SCHOOL - THENGAITITTU, PUDUCHERRY" },
  {
    id: 23,
    name: "ANUGRAHA TOWNSHIP MANDIR (TKM) - THAVALAKUPPAM, PUDUCHERRY",
  },
  { id: 24, name: "ACHARIYA SIKSHA MANDIR (ASM) - ALAPAKKAM, CHENNAI" },
  { id: 25, name: "ACHARIYA SIKSHA MANDIR (ASM) - KKL - KARAIKAL" },
  { id: 26, name: "ACHARIYA SIKSHA MANDIR (ASM) - TRICHY - TRICHY" },
  {
    id: 27,
    name: "ACHARIYA SIKSHA MANDIR (ASM) - WESTERN GHATS INTERNATIONAL - ETTIMADAI, COIMBATORE",
  },
  { id: 28, name: "ACHARIYA SIKSHA MANDIR (ASM) ERODE - ERODE" },
  {
    id: 29,
    name: "ACHARIYA SIKSHA MANDIR (ASM) ERODE - FEEDER CENTER - ERODE",
  },
  {
    id: 30,
    name: "ACHARIYA SIKSHA MANDIR (ASM) ERODE - PERUNDURAI CENTER - ERODE",
  },
  { id: 31, name: "ACHARIYA SIKSHA MANDIR (ASM)-HSC" },
  { id: 32, name: "ACHARIYA SIKSHA MANDIR (ASM)-MKM - MOOLAKULAM, PUDUCHERRY" },
  {
    id: 33,
    name: "ACHARIYA SIKSHA MANDIR (ASM)-MP - MUTHIRAYARPALAYAM, PUDUCHERRY",
  },
  { id: 34, name: "AKLAVYA RP - REDDIARPALAYAM, PUDUCHERRY" },
  {
    id: 35,
    name: "ACHARIYA SIKSHA MANDIR (ASM)-TKM - THAVALAKUPPAM, PUDUCHERRY",
  },
  {
    id: 36,
    name: "ACHARIYA SIKSHA MANDIR (ASM)-VL (9 to 12) - VILLIANUR, PUDUCHERRY",
  },
  {
    id: 37,
    name: "ACHARIYA SIKSHA MANDIR (ASM)-VL (1 to 8) - VILLIANUR, PUDUCHERRY",
  },
  { id: 38, name: "ACHARIYA SIKHA THIRUMANDIRAM (ASTHM) - PATHUKANNU" },
  { id: 39, name: "SRI SAMPOORNA VIDYALAYAM (SSV)-VL - VILLIANUR, PUDUCHERRY" },
  { id: 40, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) - TINDIVANAM" },
  { id: 41, name: "ACHARIYA SIKSHA MANDIR (ASM) - VILLUPURAM" },
];

export default function GeneratePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<any>(null);

  // Generator form
  const [files, setFiles] = useState<File[]>([]);
  const [generationMode, setGenerationMode] = useState<"pdf_only" | "pdf_context" | "text_only">("pdf_only");
  const [contextText, setContextText] = useState("");
  
  // Advanced configuration
  const [difficulty, setDifficulty] = useState("mixed");
  const [topic, setTopic] = useState("");
  const [syllabus, setSyllabus] = useState("CBSE");
  const [grade, setGrade] = useState("5th Grade");
  const [assessmentStyle, setAssessmentStyle] = useState("standard");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [numQuestions, setNumQuestions] = useState(10);
  const [questionTypes, setQuestionTypes] = useState({
    multiple_choice: true,
    true_false: true,
    short_answer: false,
  });
  const [generatorLoading, setGeneratorLoading] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  // Add Question / Drag rearrangement States
  const [newQuestionForm, setNewQuestionForm] = useState<any | null>(null);
  const [newQuestionError, setNewQuestionError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveForm, setSaveForm] = useState({
    title: "",
    duration: 30,
    subject: "",
    lesson: "",
    isPublic: false,
  });

  // Print / Export Popups and layouts states
  const [activePrintMode, setActivePrintMode] = useState<"print" | "pdf">("print");
  const [showPrintConfigModal, setShowPrintConfigModal] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    assessmentName: "",
    schoolName: "ACHARIYA WORLD CLASS EDUCATION",
    subject: "",
    lesson: "",
    grade: "5th Grade",
    date: "",
    day: "",
    duration: "30 Minutes",
    generatedBy: "",
    includeAnswers: true,
  });

  const openPrintModal = (mode: "print" | "pdf") => {
    setActivePrintMode(mode);
    setPrintConfig({
      assessmentName: printConfig.assessmentName || saveForm.title || (topic || "AI Generated") + " Assessment",
      schoolName: printConfig.schoolName && printConfig.schoolName !== "Achariya Higher Secondary School" ? printConfig.schoolName : "ACHARIYA WORLD CLASS EDUCATION",
      subject: printConfig.subject || saveForm.subject || subjectFromSelection(),
      lesson: printConfig.lesson || saveForm.lesson || "Chapter 1",
      grade: printConfig.grade || grade || "5th Grade",
      date: printConfig.date || new Date().toLocaleDateString("en-IN"),
      day: printConfig.day || new Date().toLocaleDateString("en-IN", { weekday: 'long' }),
      duration: printConfig.duration || `${saveForm.duration || 30} Minutes`,
      generatedBy: printConfig.generatedBy || teacher?.userName || teacher?.email?.split("@")[0] || "",
      includeAnswers: printConfig.includeAnswers !== undefined ? printConfig.includeAnswers : true,
    });
    setShowPrintConfigModal(true);
  };

  const openSaveModal = () => {
    setPrintConfig({
      assessmentName: printConfig.assessmentName || saveForm.title || (topic || "AI Generated") + " Assessment",
      schoolName: printConfig.schoolName && printConfig.schoolName !== "Achariya Higher Secondary School" ? printConfig.schoolName : "ACHARIYA WORLD CLASS EDUCATION",
      subject: printConfig.subject || saveForm.subject || subjectFromSelection(),
      lesson: printConfig.lesson || saveForm.lesson || "Chapter 1",
      grade: printConfig.grade || grade || "5th Grade",
      date: printConfig.date || new Date().toLocaleDateString("en-IN"),
      day: printConfig.day || new Date().toLocaleDateString("en-IN", { weekday: 'long' }),
      duration: printConfig.duration || `${saveForm.duration || 30} Minutes`,
      generatedBy: printConfig.generatedBy || teacher?.userName || teacher?.email?.split("@")[0] || "",
      includeAnswers: printConfig.includeAnswers !== undefined ? printConfig.includeAnswers : true,
    });
    setShowSaveModal(true);
  };

  useEffect(() => {
    setIsMounted(true);
    const t = localStorage.getItem("teacherToken");
    const u = localStorage.getItem("teacherUser");
    if (!t || !u) { router.push("/teacher/login"); return; }
    setToken(t);
    setTeacher(JSON.parse(u));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFilesList: File[] = [];
      let err: string | null = null;
      
      for (const f of selectedFiles) {
        const ext = f.name.split(".").pop()?.toLowerCase();
        if (ext !== "pdf" && ext !== "docx" && ext !== "txt") {
          err = "Unsupported format. Upload PDF, DOCX or TXT.";
        } else {
          validFilesList.push(f);
        }
      }
      
      if (err) {
        setGeneratorError(err);
      } else {
        setFiles(prev => [...prev, ...validFilesList]);
        setGeneratorError(null);
      }
    }
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const subjectFromSelection = () => {
    if (topic) return topic;
    if (teacher?.subjects?.[0]) return teacher.subjects[0];
    return "General";
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (generationMode !== "text_only" && files.length === 0) {
      setGeneratorError("Please upload at least one source document.");
      return;
    }
    if (generationMode !== "pdf_only" && !contextText.trim()) {
      setGeneratorError("Please enter custom contextual instructions.");
      return;
    }

    const types = Object.entries(questionTypes).filter(([, v]) => v).map(([k]) => k).join(",");
    if (!types) { setGeneratorError("Select at least one question type."); return; }

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
    formData.append("topic", topic);
    formData.append("syllabus", syllabus);
    formData.append("grade", grade);
    formData.append("assessmentStyle", assessmentStyle);

    try {
      const res = await fetch("/api/teacher/assessment/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedQuestions(data.questions);
        
        let autoTitle = "";
        if (generationMode !== "text_only" && files.length > 0) {
          const firstFile = files[0];
          const baseName = firstFile.name.substring(0, firstFile.name.lastIndexOf(".")) || firstFile.name;
          autoTitle = baseName + " Assessment";
        } else {
          autoTitle = (topic || "AI Generated") + " Assessment";
        }
        
        setSaveForm({
          title: autoTitle,
          duration: 30,
          subject: subjectFromSelection(),
          lesson: "Chapter 1",
          isPublic: false
        });

        setPrintConfig({
          assessmentName: autoTitle,
          schoolName: "ACHARIYA WORLD CLASS EDUCATION",
          subject: subjectFromSelection(),
          lesson: "Chapter 1",
          grade: grade || "5th Grade",
          date: new Date().toLocaleDateString("en-IN"),
          day: new Date().toLocaleDateString("en-IN", { weekday: 'long' }),
          duration: "30 Minutes",
          generatedBy: teacher?.userName || teacher?.email?.split("@")[0] || "",
          includeAnswers: true,
        });
      } else {
        setGeneratorError(data.message || "Failed to generate questions.");
      }
    } catch (err: any) {
      setGeneratorError("Network error: " + err.message);
    } finally {
      setGeneratorLoading(false);
    }
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = printConfig.assessmentName.trim();
    const subject = printConfig.subject.trim();
    const lesson = printConfig.lesson ? printConfig.lesson.trim() : "General";
    const durationNum = parseInt(printConfig.duration.replace(/\D/g, ""), 10) || 30;

    if (!title || !subject) {
      setSaveError("Assessment Name and Subject are required.");
      return;
    }

    setSaveLoading(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/teacher/assessment/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          duration: durationNum,
          subject,
          lesson,
          isPublic: saveForm.isPublic,
          questions: generatedQuestions
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/teacher/assessments");
      } else {
        setSaveError(data.message || "Failed to save assessment.");
      }
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePrint = () => {
    setShowPrintConfigModal(false);
    setTimeout(() => window.print(), 300);
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    const updated = [...generatedQuestions];
    (updated[idx] as any)[field] = value;
    setGeneratedQuestions(updated);
  };
  const updateOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...generatedQuestions];
    updated[qIdx].options[optIdx] = val;
    setGeneratedQuestions(updated);
  };
  const removeQuestion = (idx: number) => setGeneratedQuestions(generatedQuestions.filter((_, i) => i !== idx));
  
  const addQuestion = () => {
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
    if (!newQuestionForm) return;
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

    const newQs = [...generatedQuestions, {
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

    setGeneratedQuestions(newQs);
    setNewQuestionForm(null);
    setNewQuestionError(null);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      <div className="no-print">
        <h2 className="text-3xl font-black text-gray-900">AI Question Bank Generator</h2>
        <p className="text-sm text-gray-600 mt-1">
          Upload course syllabi, textbooks, or notes. Gemini AI parses the document and builds a custom exam.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* LEFT: Config Panel */}
        <div className="lg:col-span-2 space-y-6 no-print">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Generation Mode Selector */}
            <div className="bg-white/80 border border-gray-200 shadow-sm backdrop-blur-sm p-5 space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                Generation Mode
              </label>
              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1 border border-gray-200">
                {[
                  { id: "pdf_only", label: "PDF Only", icon: FileText },
                  { id: "pdf_context", label: "PDF + Context", icon: Zap },
                  { id: "text_only", label: "Text Only", icon: Sliders }
                ].map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setGenerationMode(mode.id as any);
                        setGeneratorError(null);
                      }}
                      className={`flex flex-col items-center gap-1.5 py-2.5 px-1 text-[10px] font-extrabold transition-all ${
                        generationMode === mode.id
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                      }`}
                    >
                      <Icon size={14} />
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* File Upload - shown for Document-based modes */}
            {generationMode !== "text_only" && (
              <div className="bg-white/80 border border-gray-200 shadow-sm backdrop-blur-sm p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Source Documents</h3>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold">{files.length} uploaded</span>
                </div>
                
                <label className="border-2 border-dashed border-gray-300 hover:border-blue-500 p-6 flex flex-col items-center gap-3 bg-gray-50/50 transition-colors cursor-pointer group relative">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="h-12 w-12 bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <UploadCloud size={24} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-700 text-sm">Click or drag files here</p>
                    <p className="text-[10px] text-gray-500 mt-1">PDF, DOCX, or TXT (Supports multiple)</p>
                  </div>
                </label>

                {files.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {files.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate max-w-[200px]">
                          <FileText size={13} className="text-blue-600 shrink-0" />
                          <span className="font-bold text-blue-600 truncate">{f.name}</span>
                          <span className="text-[9px] text-gray-400 shrink-0">({(f.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Custom Context / Text Instructions */}
            {generationMode !== "pdf_only" && (
              <div className="bg-white/80 border border-gray-200 shadow-sm backdrop-blur-sm p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-gray-900">Contextual Instructions</h3>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    What should the AI focus on?
                  </label>
                  <textarea
                    required
                    value={contextText}
                    onChange={(e) => setContextText(e.target.value)}
                    placeholder={
                      generationMode === "pdf_context"
                        ? "e.g., 'Generate questions only from pages 5 to 10.' or 'Focus only on the grammar section.'"
                        : "e.g., 'Generate 50 assessment questions under the topic of vocabulary for 5th grade students aligned with the Puducherry CBSE syllabus.'"
                    }
                    rows={4}
                    className="w-full bg-white border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-600 transition-all placeholder:text-gray-400 resize-none font-bold"
                  />
                  <p className="text-[9px] text-gray-500 italic">
                    {generationMode === "pdf_context"
                      ? "💡 Tip: You can reference specific pages (e.g. 'pages 2-4') or key subtopics within the uploaded document."
                      : "💡 Tip: Mention specific syllabus, level, and concepts to achieve accurate, high-quality standalone questions."}
                  </p>
                </div>
              </div>
            )}

            {/* Target Alignment Options Accordion */}
            {generationMode !== "pdf_only" && (
              <div className="bg-white/80 border border-gray-200 shadow-sm backdrop-blur-sm p-6 space-y-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-left outline-none"
                >
                  <div className="flex items-center gap-2">
                    <Sliders size={16} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Target Alignment Options</h3>
                  </div>
                  <span className="text-[10px] text-blue-600 font-bold hover:underline">
                    {showAdvanced ? "Hide Options" : "Show Options"}
                  </span>
                </button>

                {showAdvanced && (
                  <div className="space-y-4 pt-2 border-t border-gray-200 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Difficulty */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Difficulty</label>
                        <select
                           value={difficulty}
                           onChange={(e) => setDifficulty(e.target.value)}
                           className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-600 font-bold"
                        >
                          <option value="mixed">Mixed Difficulty</option>
                          <option value="easy">Easy / Recall</option>
                          <option value="medium">Medium / Conceptual</option>
                          <option value="hard">Hard / Critical Thinking</option>
                        </select>
                      </div>

                      {/* Grade */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Grade Level</label>
                        <select
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-600 font-bold"
                        >
                          {["1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade"].map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Syllabus */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Syllabus / Board</label>
                        <input
                          type="text"
                          value={syllabus}
                          onChange={(e) => setSyllabus(e.target.value)}
                          placeholder="e.g. CBSE / State Board"
                          className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-600 font-bold"
                        />
                      </div>

                      {/* Assessment Style */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Style</label>
                        <select
                          value={assessmentStyle}
                          onChange={(e) => setAssessmentStyle(e.target.value)}
                          className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-600 font-bold"
                        >
                          <option value="standard">Standard Exam</option>
                          <option value="concept_focused">Concept Focused</option>
                          <option value="application_based">Application Based</option>
                          <option value="hots">HOTS (Higher-Order Thinking)</option>
                        </select>
                      </div>
                    </div>

                    {/* Topic */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">Topic / Subject Category</label>
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Biology - Photosynthesis"
                        className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-600 font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Config */}
            <div className="bg-white/80 border border-gray-200 shadow-sm backdrop-blur-sm p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Sliders size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Generator Configuration</h3>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Number of Questions: <span className="text-gray-900 font-extrabold">{numQuestions}</span>
                </label>
                <input
                  type="range" min={5} max={30} value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400"><span>5</span><span>30</span></div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Question Types</label>
                {[
                  { key: "multiple_choice", label: "Multiple Choice (MCQ)" },
                  { key: "true_false", label: "True / False" },
                  { key: "short_answer", label: "Short Answer Prompts" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => setQuestionTypes({ ...questionTypes, [key]: !(questionTypes as any)[key] })}
                      className={`h-5 w-5 border-2 flex items-center justify-center transition-all cursor-pointer ${
                        (questionTypes as any)[key] ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 bg-transparent"
                      }`}
                    >
                      {(questionTypes as any)[key] && <CheckCircle size={12} className="text-white" />}
                    </div>
                    <span className="text-xs text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {generatorError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-xs text-red-600">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{generatorError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={
                generatorLoading ||
                (generationMode === "pdf_only" && files.length === 0) ||
                (generationMode === "pdf_context" && (files.length === 0 || !contextText.trim())) ||
                (generationMode === "text_only" && !contextText.trim())
              }
              className="w-full bg-brand-red hover:bg-[#b01f1f] disabled:opacity-50 disabled:cursor-not-allowed py-4 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm text-white animate-in"
            >
              {generatorLoading ? (
                <>
                  <Loader size={16} className="animate-spin text-white" /> 
                  {generationMode === "text_only" ? "Generating Questions..." : "Processing Documents..."}
                </>
              ) : (
                <>
                  <Zap size={16} /> 
                  Execute Gemini Generator
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT: Generated Questions Preview */}
        <div className="lg:col-span-3 space-y-6 print-page relative">
          {/* Print Watermark */}
          <div className="print-watermark-container">
            <img src="/images/ACHARIYA-lOGO-OUTLINE-01.png" className="print-watermark-image" alt="Watermark" />
          </div>

          {/* Print Styles */}
          <style>{`
            .print-watermark-container {
              display: none;
            }
            @media print {
              html, body {
                background: white !important;
                color: black !important;
                height: auto !important;
                overflow: visible !important;
              }
              aside, .no-print, button, .screen-only-absolute, .screen-only-fixed {
                display: none !important;
              }
              .flex-1, .min-h-screen, .h-screen, .overflow-y-auto {
                height: auto !important;
                overflow: visible !important;
                position: relative !important;
                background: transparent !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .print-page {
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                background: transparent !important;
                color: black !important;
                position: relative !important;
              }
              .print-watermark-container {
                display: flex !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                justify-content: center !important;
                align-items: center !important;
                z-index: -10 !important;
                pointer-events: none !important;
                opacity: 0.08 !important;
              }
              .print-watermark-image {
                width: 320px !important;
                height: 320px !important;
                object-fit: contain !important;
              }
            }
          `}</style>

          {/* Print-Only Headers */}
          {activePrintMode === "pdf" && (
            <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4 text-black font-sans">
              {/* School Name at the very top, centered */}
              {printConfig.schoolName && (
                <div className="text-center font-black uppercase text-lg tracking-wider mb-4 border-b border-slate-200 pb-2">
                  {printConfig.schoolName}
                </div>
              )}
              
              {/* Three Column Top Row */}
              <div className="grid grid-cols-3 items-center gap-4 text-xs font-semibold">
                {/* Left Column: Date */}
                <div className="text-left text-slate-700">
                  <span className="block font-bold text-slate-500 uppercase tracking-wider text-[9px]">Date</span>
                  <span className="text-slate-900 font-extrabold text-[11px] mt-0.5 block">{printConfig.date}</span>
                </div>
                
                {/* Center Column: Title, and Subject & Lesson below */}
                <div className="text-center space-y-1">
                  <h1 className="text-xl font-black tracking-tight uppercase text-black leading-tight">
                    {printConfig.assessmentName}
                  </h1>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wide">
                    {printConfig.subject}{printConfig.lesson ? ` · ${printConfig.lesson}` : ""}
                  </p>
                </div>
                
                {/* Right Column: Duration */}
                <div className="text-right text-slate-700">
                  <span className="block font-bold text-slate-500 uppercase tracking-wider text-[9px]">Duration</span>
                  <span className="text-slate-900 font-extrabold text-[11px] mt-0.5 block">{printConfig.duration}</span>
                </div>
              </div>

              <div className="mt-6 text-[10px] text-slate-500 italic leading-relaxed border-l-2 border-slate-300 pl-3">
                Instructions: Read all questions carefully. Select the most appropriate option or provide a clear and concise response in the designated spaces.
              </div>
            </div>
          )}

          {activePrintMode === "print" && (
            <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4 text-black font-sans">
              {/* School Name */}
              {printConfig.schoolName && (
                <div className="text-center font-black uppercase text-xl tracking-wider mb-2">
                  {printConfig.schoolName}
                </div>
              )}
              
              <div className="flex justify-between items-start border-t border-slate-200 pt-3 mt-2">
                <div>
                  <h1 className="text-2xl font-black tracking-tight uppercase text-black leading-tight">
                    {printConfig.assessmentName}
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 font-semibold uppercase">
                    {printConfig.subject}{printConfig.lesson ? ` · ${printConfig.lesson}` : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-bold text-black uppercase tracking-wider">Achariya Educator Platform</p>
                  <p className="mt-0.5">{printConfig.date}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-black">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Subject Category</span>
                  <span className="text-slate-800 font-extrabold text-[11px] mt-0.5 block">{printConfig.subject || "General"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Duration Allowance</span>
                  <span className="text-slate-800 font-extrabold text-[11px] mt-0.5 block">{printConfig.duration}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Difficulty Level</span>
                  <span className="text-slate-800 font-extrabold text-[11px] mt-0.5 block uppercase">{difficulty}</span>
                </div>
              </div>

              <div className="mt-6 text-[10px] text-slate-500 italic leading-relaxed border-l-2 border-slate-300 pl-3">
                Instructions: Read all questions carefully. Select the most appropriate option or provide a clear and concise response in the designated spaces.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between no-print border-b border-gray-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Generated Questions Preview</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {generatedQuestions.length > 0 ? `${generatedQuestions.length} questions ready — edit inline before saving` : "Ready for Intelligent Processing"}
              </p>
            </div>
            {generatedQuestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 border border-gray-300 transition-all"
                >
                  <Plus size={12} /> Add Question
                </button>
                
                <button
                  type="button"
                  onClick={() => openPrintModal("print")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold text-blue-600 transition-all"
                >
                  <Printer size={12} /> Print Exam
                </button>

                <button
                  type="button"
                  onClick={() => openPrintModal("pdf")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-bold text-purple-600 transition-all"
                >
                  <FileDown size={12} /> Export PDF
                </button>

                <button
                  type="button"
                  onClick={() => openSaveModal()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-red hover:bg-[#b01f1f] text-xs font-bold transition-all shadow-sm text-white"
                >
                  <Save size={12} /> Save Assessment
                </button>
              </div>
            )}
          </div>

          {generatedQuestions.length === 0 ? (
            <div className="bg-white/65 border border-dashed border-gray-300 h-[600px] flex flex-col items-center justify-center p-8 text-center gap-4 text-gray-400 backdrop-blur-sm shadow-sm">
              <div className="h-16 w-16 bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                <Zap size={32} className="text-gray-400 animate-pulse" />
              </div>
              <div>
                <p className="font-black text-gray-700 text-base">
                  {generationMode === "pdf_only" && "Upload documents to begin"}
                  {generationMode === "pdf_context" && "Upload documents & add instructions"}
                  {generationMode === "text_only" && "Provide text instructions to generate"}
                </p>
                <p className="text-xs text-gray-500 max-w-[280px] mx-auto mt-2">
                  {generationMode === "pdf_only" && "Gemini AI will extract key syllabus facts and build your comprehensive exam bank."}
                  {generationMode === "pdf_context" && "Combine reference literature with your specific focal points and page ranges."}
                  {generationMode === "text_only" && "Standalone AI generation tailored by syllabus, difficulty, grade, and topic."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* New Question Draft Form at the top */}
              {newQuestionForm && (
                <div className="bg-white border border-blue-200 p-5 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-600">Draft New Question</span>
                    <button onClick={() => { setNewQuestionForm(null); setNewQuestionError(null); }} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
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
                          className={`px-3 py-1.5 text-xs font-bold border transition-all ${
                            newQuestionForm.type === t.val
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900"
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
                      className="w-full bg-white border border-gray-300 px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-blue-600 resize-none"
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
                              className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-600"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1.5 mt-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 font-bold">Correct Answer</label>
                        <select
                          value={newQuestionForm.correctAnswer}
                          onChange={(e) => setNewQuestionForm({ ...newQuestionForm, correctAnswer: e.target.value })}
                          className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-600"
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
                              name="gen_tf_answer"
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
                        className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-600"
                      />
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Explanation / Reasoning (Optional)</label>
                    <textarea
                      value={newQuestionForm.explanation || ""}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, explanation: e.target.value })}
                      placeholder="Explain why this answer is correct..."
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600 outline-none resize-none italic focus:border-blue-600"
                    />
                  </div>

                  {newQuestionError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs">
                      {newQuestionError}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => { setNewQuestionForm(null); setNewQuestionError(null); }}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveNewQuestion}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm"
                    >
                      Save Question
                    </button>
                  </div>
                </div>
              )}

              {generatedQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  draggable={true}
                  onDragStart={(e) => {
                    setDraggedIndex(idx);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    if (draggedIndex === null) return;
                    const updated = [...generatedQuestions];
                    const draggedItem = updated[draggedIndex];
                    updated.splice(draggedIndex, 1);
                    updated.splice(idx, 0, draggedItem);
                    setGeneratedQuestions(updated);
                    setDraggedIndex(null);
                  }}
                  className="bg-white/80 border border-gray-200 p-5 space-y-3 relative transition-all hover:border-blue-500/40 shadow-sm print:bg-white print:border-gray-300 print:text-black print:shadow-none print:p-4 print:mb-4 print:page-break-inside-avoid"
                >
                  <div className="flex items-center justify-between gap-2 no-print">
                    <div className="flex items-center gap-2">
                      <div className="cursor-move p-1 text-gray-400 hover:text-gray-700" title="Drag to reorder">
                        <GripVertical size={14} />
                      </div>
                      <span className="h-6 w-6 bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex-1">{q.type.replace("_", " ")}</span>
                    <button onClick={() => removeQuestion(idx)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Print-only Question Number and Type */}
                  <div className="hidden print:flex items-center gap-2 mb-2 text-black">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Question {idx + 1} · {q.type.replace("_", " ")}
                    </span>
                  </div>

                  <textarea
                    value={q.question}
                    onChange={(e) => updateQuestion(idx, "question", e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-blue-600 resize-none print:hidden"
                  />
                  <p className="hidden print:block text-sm font-bold text-slate-900 leading-relaxed">
                    {q.question}
                  </p>

                  {q.type === "multiple_choice" && q.options?.length > 0 && (
                    <>
                      <div className="grid grid-cols-2 gap-2 print:hidden">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-blue-600 shrink-0">{String.fromCharCode(65 + optIdx)}.</span>
                            <input
                              value={opt}
                              onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                              className="w-full bg-white border border-gray-200 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-blue-600"
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="hidden print:grid grid-cols-2 gap-4 mt-2 text-black">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-start gap-2 text-xs">
                            <span className="font-extrabold text-slate-700">{String.fromCharCode(65 + optIdx)}.</span>
                            <span className="text-slate-800">{opt}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Correct Answer and Explanation print wrapper */}
                  <div className={`space-y-2 mt-3 ${!printConfig.includeAnswers ? "print:hidden" : ""}`}>
                    {/* Screen edit controls (hidden on print) */}
                    <div className="space-y-1.5 print:hidden">
                      <label className="text-[9px] font-black uppercase tracking-wider text-blue-600">Correct Answer</label>
                      <input
                        value={q.correctAnswer}
                        onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                        className="w-full bg-blue-50/50 border border-blue-200 px-3 py-1.5 text-xs text-blue-800 outline-none focus:border-blue-600"
                      />
                    </div>

                    {q.explanation !== undefined && (
                      <div className="space-y-1.5 print:hidden">
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">Explanation</label>
                        <textarea
                          value={q.explanation}
                          onChange={(e) => updateQuestion(idx, "explanation", e.target.value)}
                          rows={2}
                          className="w-full bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs text-gray-600 outline-none focus:border-blue-600 resize-none italic"
                        />
                      </div>
                    )}

                    {/* Print-only Answers & Explanations */}
                    <div className="hidden print:block p-3 bg-slate-50 border border-slate-200 rounded-none space-y-1.5 text-xs text-black">
                      <p className="font-extrabold text-emerald-700">
                        ✔ Correct Answer: <span className="text-slate-950 font-black">{q.correctAnswer}</span>
                      </p>
                      {q.explanation && (
                        <p className="text-[11px] text-slate-600 italic leading-relaxed">
                          <span className="font-bold uppercase text-[9px] tracking-wider not-italic text-slate-500 block mb-0.5">Explanation / Reasoning</span>
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Last Page PDF Footer / Generated By Sign */}
              {activePrintMode === "pdf" && printConfig.generatedBy && printConfig.generatedBy.trim() !== "" && (
                <div className="hidden print:block mt-16 pt-4 border-t border-slate-200/60 text-right opacity-45 text-[10px] font-black uppercase tracking-widest text-slate-900">
                  Generated by: {printConfig.generatedBy.trim()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 w-full max-w-lg rounded-none p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Save Assessment</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Commit assessment details to database</p>
              </div>
              <button onClick={() => setShowSaveModal(false)} className="p-2 hover:bg-gray-100 rounded-none text-gray-500 cursor-pointer"><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-4">
              {/* Assessment Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">Assessment Name</label>
                <input
                  type="text"
                  required
                  value={printConfig.assessmentName}
                  onChange={(e) => setPrintConfig({ ...printConfig, assessmentName: e.target.value })}
                  placeholder="e.g. Chapter 3 Biology Quiz"
                  className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                />
              </div>

              {/* School Name select dropdown */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">School Name</label>
                <select
                  value={printConfig.schoolName}
                  onChange={(e) => setPrintConfig({ ...printConfig, schoolName: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                >
                  <option value="ACHARIYA WORLD CLASS EDUCATION">ACHARIYA WORLD CLASS EDUCATION</option>
                  {allschoolsdata.map((school) => (
                    <option key={school.id} value={school.name}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject & Lesson */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">Subject</label>
                  <input
                    type="text"
                    required
                    value={printConfig.subject}
                    onChange={(e) => setPrintConfig({ ...printConfig, subject: e.target.value })}
                    placeholder="e.g. Biology"
                    className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block flex justify-between">
                    <span>Lesson</span>
                    <span className="text-[8px] text-gray-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={printConfig.lesson}
                    onChange={(e) => setPrintConfig({ ...printConfig, lesson: e.target.value })}
                    placeholder="e.g. Cell Division"
                    className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                  />
                </div>
              </div>

              {/* Date & Day and Grade & Duration Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column: Date & Day Stack */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">Date</label>
                    <input
                      type="text"
                      required
                      value={printConfig.date}
                      onChange={(e) => setPrintConfig({ ...printConfig, date: e.target.value })}
                      placeholder="e.g. 21/05/2026"
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">Day</label>
                    <input
                      type="text"
                      required
                      value={printConfig.day}
                      onChange={(e) => setPrintConfig({ ...printConfig, day: e.target.value })}
                      placeholder="e.g. Thursday"
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                </div>

                {/* Right Column: Grade & Duration Stack */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">Grade</label>
                    <input
                      type="text"
                      required
                      value={printConfig.grade}
                      onChange={(e) => setPrintConfig({ ...printConfig, grade: e.target.value })}
                      placeholder="e.g. 5th Grade"
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">Duration</label>
                    <input
                      type="text"
                      required
                      value={printConfig.duration}
                      onChange={(e) => setPrintConfig({ ...printConfig, duration: e.target.value })}
                      placeholder="e.g. 30 Minutes"
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Generated By */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block flex justify-between">
                  <span>Generated By</span>
                  <span className="text-[8px] text-gray-400 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={printConfig.generatedBy}
                  onChange={(e) => setPrintConfig({ ...printConfig, generatedBy: e.target.value })}
                  placeholder="e.g. Mr. Rajesh Kumar"
                  className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                />
              </div>

              {/* Visibility Scope */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-none">
                <div>
                  <p className="text-xs font-bold text-gray-800">Visibility Scope</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Public = visible to all activated teachers</p>
                </div>
                <div className="flex gap-3">
                  {[{ val: false, label: "Private" }, { val: true, label: "Public" }].map(({ val, label }) => (
                    <button key={label} type="button" onClick={() => setSaveForm({ ...saveForm, isPublic: val })}
                      className={`px-3 py-1.5 rounded-none text-[11px] font-bold border transition-all ${
                        saveForm.isPublic === val ? "bg-blue-600 border-blue-600 text-white cursor-pointer" : "bg-white border-gray-300 text-gray-700 cursor-pointer"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {saveError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{saveError}</p>}

              <button type="submit" disabled={saveLoading}
                className="w-full bg-brand-red hover:bg-brand-red/90 disabled:opacity-50 py-3.5 rounded-none font-bold text-sm flex items-center justify-center gap-2 transition-all text-white cursor-pointer"
              >
                {saveLoading ? <><Loader size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save to Database</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Print / Export Config Modal */}
      {showPrintConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 w-full max-w-lg rounded-none p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {activePrintMode === "pdf" ? "Export Assessment as PDF" : "Print Assessment Exam"}
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Configure exam print layout fields</p>
              </div>
              <button
                onClick={() => setShowPrintConfigModal(false)}
                type="button"
                className="p-2 hover:bg-gray-100 rounded-none text-gray-500 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Format Choice: Questions Only vs With Answer Key */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">
                Answer Key Option
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Questions Only", value: false },
                  { label: "With Answer Key", value: true }
                ].map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => setPrintConfig({ ...printConfig, includeAnswers: value })}
                    type="button"
                    className={`py-2.5 px-4 rounded-none border text-center font-bold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      printConfig.includeAnswers === value
                        ? "bg-blue-50 border-blue-600 text-blue-600 shadow-sm"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <CheckCircle size={12} className={printConfig.includeAnswers === value ? "opacity-100" : "opacity-0"} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Fields Grid */}
            <div className="space-y-4">
              {/* Assessment Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">Assessment Name</label>
                <input
                  type="text"
                  value={printConfig.assessmentName}
                  onChange={(e) => setPrintConfig({ ...printConfig, assessmentName: e.target.value })}
                  placeholder="e.g. Chapter 3 Biology Quiz"
                  className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                />
              </div>

              {/* School Name select dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">School Name</label>
                <select
                  value={printConfig.schoolName}
                  onChange={(e) => setPrintConfig({ ...printConfig, schoolName: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                >
                  <option value="ACHARIYA WORLD CLASS EDUCATION">ACHARIYA WORLD CLASS EDUCATION</option>
                  {allschoolsdata.map((school) => (
                    <option key={school.id} value={school.name}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject & Lesson */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">Subject</label>
                  <input
                    type="text"
                    value={printConfig.subject}
                    onChange={(e) => setPrintConfig({ ...printConfig, subject: e.target.value })}
                    placeholder="e.g. Biology"
                    className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block flex justify-between">
                    <span>Lesson</span>
                    <span className="text-[8px] text-gray-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={printConfig.lesson}
                    onChange={(e) => setPrintConfig({ ...printConfig, lesson: e.target.value })}
                    placeholder="e.g. Cell Division"
                    className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                  />
                </div>
              </div>

              {/* Date & Day and Grade & Duration Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column: Date & Day Stack */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">Date</label>
                    <input
                      type="text"
                      value={printConfig.date}
                      onChange={(e) => setPrintConfig({ ...printConfig, date: e.target.value })}
                      placeholder="e.g. 21/05/2026"
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">Day</label>
                    <input
                      type="text"
                      value={printConfig.day}
                      onChange={(e) => setPrintConfig({ ...printConfig, day: e.target.value })}
                      placeholder="e.g. Thursday"
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                </div>

                {/* Right Column: Grade & Duration Stack */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">Grade</label>
                    <input
                      type="text"
                      value={printConfig.grade}
                      onChange={(e) => setPrintConfig({ ...printConfig, grade: e.target.value })}
                      placeholder="e.g. 5th Grade"
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">Duration</label>
                    <input
                      type="text"
                      value={printConfig.duration}
                      onChange={(e) => setPrintConfig({ ...printConfig, duration: e.target.value })}
                      placeholder="e.g. 30 Minutes"
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Generated By (Optional) */}
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block flex justify-between">
                  <span>Generated By</span>
                  <span className="text-[8px] text-gray-400 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={printConfig.generatedBy}
                  onChange={(e) => setPrintConfig({ ...printConfig, generatedBy: e.target.value })}
                  placeholder="e.g. Mr. Rajesh Kumar"
                  className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowPrintConfigModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-none font-bold text-xs text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              {activePrintMode === "pdf" && isMounted ? (
                <PDFDownloadLink
                  key={`${printConfig.assessmentName}-${printConfig.schoolName}-${printConfig.subject}-${printConfig.lesson}-${printConfig.date}-${printConfig.day}-${printConfig.grade}-${printConfig.duration}-${printConfig.generatedBy}-${printConfig.includeAnswers}-${generatedQuestions.length}`}
                  document={<QuestionBankPDFDocument questions={generatedQuestions} config={printConfig} />}
                  fileName={`${printConfig.assessmentName.replace(/\s+/g, "_") || "Assessment"}_${printConfig.includeAnswers ? "Solutions" : "Questions"}.pdf`}
                  onClick={() => {
                    setTimeout(() => setShowPrintConfigModal(false), 500);
                  }}
                  className="flex-1 bg-brand-red hover:bg-brand-red/90 py-3 rounded-none font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white no-underline text-center cursor-pointer shadow-md shadow-red-600/10"
                >
                  {({ loading, error }) => (
                    loading ? (
                      <>
                        <Loader size={13} className="animate-spin" />
                        Generating...
                      </>
                    ) : error ? (
                      "Error creating PDF"
                    ) : (
                      <>
                        <FileDown size={13} />
                        Download PDF
                      </>
                    )
                  )}
                </PDFDownloadLink>
              ) : (
                <button
                  onClick={handlePrint}
                  type="button"
                  className="flex-1 py-3 rounded-none font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  <Printer size={13} />
                  Print Exam
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
