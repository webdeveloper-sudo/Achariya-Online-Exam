"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud, FileText, Sliders, Zap, Loader, Plus, Trash2,
  CheckCircle, AlertCircle, Save, X, Eye, FileDown, Printer, Award,
  Image as ImageIcon, RefreshCw, Edit2, ArrowLeft, Lightbulb, TimerIcon
} from "lucide-react";
import dynamic from "next/dynamic";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => ({ default: m.PDFDownloadLink })),
  { ssr: false }
);

import QuestionBankPDFDocument from "@/components/recruitment/QuestionBankPDFDocument";

export const allschoolsdata = [
  { id: 1, name: "ACHARIYA ARTS AND SCIENCE COLLEGE (AASC) - VILLIANUR, PUDUCHERRY" },
  { id: 2, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) ADYAR - ADYAR, CHENNAI" },
  { id: 3, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) ALPKM - ALAPAKKAM, CHENNAI" },
  { id: 4, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) KKN - KK NAGAR, CHENNAI" },
  { id: 5, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM)-TT PP - THENGATHITTU, PUDUCHERRY" },
  { id: 6, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) KP - KALAPET, PUDUCHERRY" },
  { id: 7, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) MVL CHENNAI - MADURAVOYAL, CHENNAI" },
  { id: 8, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) - NOLAMBUR" },
  { id: 9, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) PBN - PADMANAB NAGAR" },
  { id: 10, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) RKN - RK NAGAR" },
  { id: 11, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) SGM - SALIGRAMAM, CHENNAI" },
  { id: 12, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) THIRU NAGAR - THIRUNAGAR" },
  { id: 13, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) TRICHY - TRICHY" },
  { id: 14, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) VGM - VIRUGAMBAKKAM, CHENNAI" },
  { id: 15, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) VN - VENKATA NAGAR" },
  { id: 16, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM) VVK - VALASARAVAKKAM, CHENNAI" },
  { id: 17, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM)-GM - GORIMEDU" },
  { id: 18, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM)-LP - LAWSPET, PUDUCHERRY" },
  { id: 19, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM)-MLP - MUTHIALPET, PUDUCHERRY" },
  { id: 20, name: "ACHARIYA BALA SIKSHA MANDIR (ABSM)-TT - THENGATHITTU, PUDUCHERRY" },
  { id: 21, name: "ACHARIYA CENTRE FOR EXCELLENCE IN TEACHING (ACET) - VILLIANUR, PUDUCHERRY" },
  { id: 22, name: "AKLAVYA INTERNATIONAL SCHOOL - THENGAITITTU, PUDUCHERRY" },
  { id: 23, name: "ANUGRAHA TOWNSHIP MANDIR (TKM) - THAVALAKUPPAM, PUDUCHERRY" },
  { id: 24, name: "ACHARIYA SIKSHA MANDIR (ASM) - ALAPAKKAM, CHENNAI" },
  { id: 25, name: "ACHARIYA SIKSHA MANDIR (ASM) - KKL - KARAIKAL" },
  { id: 26, name: "ACHARIYA SIKSHA MANDIR (ASM) - TRICHY - TRICHY" },
  { id: 27, name: "ACHARIYA SIKSHA MANDIR (ASM) - WESTERN GHATS INTERNATIONAL - ETTIMADAI, COIMBATORE" },
  { id: 28, name: "ACHARIYA SIKSHA MANDIR (ASM) ERODE - ERODE" },
  { id: 32, name: "ACHARIYA SIKSHA MANDIR (ASM)-MKM - MOOLAKULAM, PUDUCHERRY" },
  { id: 33, name: "ACHARIYA SIKSHA MANDIR (ASM)-MP - MUTHIRAYARPALAYAM, PUDUCHERRY" },
  { id: 35, name: "ACHARIYA SIKSHA MANDIR (ASM)-TKM - THAVALAKUPPAM, PUDUCHERRY" },
  { id: 36, name: "ACHARIYA SIKSHA MANDIR (ASM)-VL (9 to 12) - VILLIANUR, PUDUCHERRY" },
  { id: 37, name: "ACHARIYA SIKSHA MANDIR (ASM)-VL (1 to 8) - VILLIANUR, PUDUCHERRY" },
];

interface Question {
  id: string;
  type: string; // "multiple_choice" | "true_false" | "short_answer" | "diagram_mcq" | "diagram_short_answer"
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  imageUrl?: string; // Cloudinary URL (after save) or base64 (pending upload)
  imagePending?: boolean; // true = base64, not yet uploaded to Cloudinary
  imageGenerating?: boolean; // true = AI is currently generating image
}

export default function RecruiterGeneratePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [recruiter, setRecruiter] = useState<any>(null);

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

  // Metadata / Custom Recruitment inputs
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [teachingType, setTeachingType] = useState("teaching"); // teaching or non teaching
  const [recruitmentFor, setRecruitmentFor] = useState<string | undefined>(allschoolsdata[0].name);
  const [difficulty, setDifficulty] = useState("mixed");
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionTypes, setQuestionTypes] = useState({
    multiple_choice: true,
    true_false: true,
    short_answer: false,
    diagram_mcq: false,
    diagram_short_answer: false,
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
  const [isPublic, setIsPublic] = useState(false);

  const [newQuestionForm, setNewQuestionForm] = useState<any | null>(null);
  const [newQuestionError, setNewQuestionError] = useState<string | null>(null);
  const newImageInputRef = useRef<HTMLInputElement>(null);

  const [editingImageIdx, setEditingImageIdx] = useState<Record<number, boolean>>({});
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [formHeight, setFormHeight] = useState<number | null>(null);

  // Resize observer for form height
  useEffect(() => {
    if (!formRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setFormHeight(entry.target.clientHeight);
      }
    });
    resizeObserver.observe(formRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const facts = [
    "The word 'school' comes from the ancient Greek word 'schole', which originally meant 'free time' or 'leisure'.",
    "AI can process millions of tokens of context, enabling it to read entire textbooks in seconds.",
    "The oldest continuously operating university in the world is the University of Al-Qarawiyyin, founded in 859 AD in Fez, Morocco.",
    "Adaptive learning systems use AI to adjust the difficulty of questions based on a student's performance in real time.",
    "The concept of multiple-choice questions was first introduced in the early 20th century to grade military recruits quickly.",
    "Studies show that taking practice tests can improve long-term retention of information by up to 50% compared to just studying.",
  ];

  const [currentFact, setCurrentFact] = useState(facts[0]);

  useEffect(() => {
    if (!generatorLoading) return;
    const interval = setInterval(() => {
      setCurrentFact(facts[Math.floor(Math.random() * facts.length)]);
    }, 4000);
    return () => clearInterval(interval);
  }, [generatorLoading]);

  useEffect(() => {
    setIsMounted(true);
    const t = localStorage.getItem("recruiterToken");
    const u = localStorage.getItem("recruiterUser");
    if (!t || !u) {
      router.push("/recruitment/login");
      return;
    }
    setToken(t);
    setRecruiter(JSON.parse(u));

    // Load saved generator state from localStorage
    try {
      const savedGenQuestions = localStorage.getItem("rec_generatedQuestions");
      if (savedGenQuestions) {
        setGeneratedQuestions(JSON.parse(savedGenQuestions));
      }

      const savedGenMode = localStorage.getItem("rec_generationMode");
      if (savedGenMode) setGenerationMode(savedGenMode as any);

      const savedContextText = localStorage.getItem("rec_contextText");
      if (savedContextText) setContextText(savedContextText);

      const savedPosition = localStorage.getItem("rec_position");
      if (savedPosition) setPosition(savedPosition);

      const savedDept = localStorage.getItem("rec_department");
      if (savedDept) setDepartment(savedDept);

      const savedTeachingType = localStorage.getItem("rec_teachingType");
      if (savedTeachingType) setTeachingType(savedTeachingType);

      const savedRecruitmentFor = localStorage.getItem("rec_recruitmentFor");
      if (savedRecruitmentFor) setRecruitmentFor(savedRecruitmentFor);

      const savedDiff = localStorage.getItem("rec_difficulty");
      if (savedDiff) setDifficulty(savedDiff);

      const savedNumQuestions = localStorage.getItem("rec_numQuestions");
      if (savedNumQuestions) setNumQuestions(Number(savedNumQuestions));

      const savedQuestionTypes = localStorage.getItem("rec_questionTypes");
      if (savedQuestionTypes) {
        setQuestionTypes(JSON.parse(savedQuestionTypes));
      }
    } catch (err) {
      console.warn("Failed to load saved assessment generator state from localStorage:", err);
    }
    setIsStateLoaded(true);
  }, [router]);

  // Auto-save generator state to localStorage
  useEffect(() => {
    if (!isStateLoaded) return;
    try {
      localStorage.setItem("rec_generatedQuestions", JSON.stringify(generatedQuestions));
      localStorage.setItem("rec_generationMode", generationMode);
      localStorage.setItem("rec_contextText", contextText);
      localStorage.setItem("rec_position", position);
      localStorage.setItem("rec_department", department);
      localStorage.setItem("rec_teachingType", teachingType);
      if (recruitmentFor) {
        localStorage.setItem("rec_recruitmentFor", recruitmentFor);
      } else {
        localStorage.removeItem("rec_recruitmentFor");
      }
      localStorage.setItem("rec_difficulty", difficulty);
      localStorage.setItem("rec_numQuestions", String(numQuestions));
      localStorage.setItem("rec_questionTypes", JSON.stringify(questionTypes));
    } catch (err) {
      console.warn("Failed to save assessment generator state to localStorage:", err);
    }
  }, [
    isStateLoaded,
    generatedQuestions,
    generationMode,
    contextText,
    position,
    department,
    teachingType,
    recruitmentFor,
    difficulty,
    numQuestions,
    questionTypes
  ]);

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
      setGeneratorError("Please specify the target Applied Position.");
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
      const res = await fetch("/api/recruitment/assessment/generate", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const questions: Question[] = data.questions;
        setAssessmentTitle(`${position} Assessment - ${new Date().toLocaleDateString("en-IN")}`);

        // Mark diagram questions as generating
        const markedQuestions = questions.map((q) =>
          isDiagramType(q.type) ? { ...q, imageGenerating: true } : q,
        );
        setGeneratedQuestions(markedQuestions);

        // Generate images for diagram questions in parallel
        const imagePromises = markedQuestions.map(async (q, idx) => {
          if (!isDiagramType(q.type)) return;
          try {
            const imgRes = await fetch("/api/recruitment/generate-diagram-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                questionText: q.question,
                context: contextText,
              }),
            });
            const imgData = await imgRes.json();
            setGeneratedQuestions((prev) => {
              const updated = [...prev];
              updated[idx] = {
                ...updated[idx],
                imageGenerating: false,
                imageUrl: imgData.success ? imgData.base64 : undefined,
                imagePending: imgData.success ? true : false,
              };
              return updated;
            });
          } catch {
            setGeneratedQuestions((prev) => {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], imageGenerating: false };
              return updated;
            });
          }
        });
        await Promise.allSettled(imagePromises);
      } else {
        setGeneratorError(data.message || "Failed to generate recruitment assessment.");
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

    try {
      // 1. Upload any pending (base64) images to Cloudinary
      const finalQuestions = await uploadPendingImages(
        generatedQuestions,
        token!,
      );

      // 2. Clean imageGenerating / imagePending flags before saving
      const cleanQuestions = finalQuestions.map(
        ({ imageGenerating, imagePending, ...rest }: any) => rest,
      );

      const payload = {
        title: assessmentTitle.trim(),
        duration,
        teaching: teachingType === "teaching" ? "Teaching" : "Non-Teaching",
        department: department || "General",
        date: new Date().toISOString().split("T")[0],
        day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
        generatedBy: recruiter?.name || "HR Manager",
        position: position.trim(),
        recruitmentFor: recruitmentFor,
        isPublic,
        questions: cleanQuestions,
      };

      const res = await fetch("/api/recruitment/assessment/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.removeItem("rec_generatedQuestions");
        localStorage.removeItem("rec_generationMode");
        localStorage.removeItem("rec_contextText");
        localStorage.removeItem("rec_position");
        localStorage.removeItem("rec_department");
        localStorage.removeItem("rec_teachingType");
        localStorage.removeItem("rec_recruitmentFor");
        localStorage.removeItem("rec_difficulty");
        localStorage.removeItem("rec_numQuestions");
        localStorage.removeItem("rec_questionTypes");

        router.push("/recruitment/assessments");
      } else {
        setSaveError(data.message || "Failed to save assessment template.");
      }
    } catch (err: any) {
      setSaveError("Network error: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDiscardAssessment = () => {
    if (
      window.confirm(
        "Are you sure you want to discard this generated assessment? This will clear the current question board and reset your inputs.",
      )
    ) {
      localStorage.removeItem("rec_generatedQuestions");
      localStorage.removeItem("rec_generationMode");
      localStorage.removeItem("rec_contextText");
      localStorage.removeItem("rec_position");
      localStorage.removeItem("rec_department");
      localStorage.removeItem("rec_teachingType");
      localStorage.removeItem("rec_recruitmentFor");
      localStorage.removeItem("rec_difficulty");
      localStorage.removeItem("rec_numQuestions");
      localStorage.removeItem("rec_questionTypes");

      setGeneratedQuestions([]);
      setGenerationMode("text_only");
      setContextText("");
      setPosition("");
      setDepartment("");
      setTeachingType("teaching");
      setRecruitmentFor(allschoolsdata[0].name);
      setDifficulty("mixed");
      setNumQuestions(10);
      setQuestionTypes({
        multiple_choice: true,
        true_false: true,
        short_answer: false,
        diagram_mcq: false,
        diagram_short_answer: false,
      } as any);
      setFiles([]);
    }
  };

  const uploadPendingImages = async (
    questions: Question[],
    authToken: string,
  ): Promise<Question[]> => {
    return Promise.all(
      questions.map(async (q) => {
        if (!q.imagePending || !q.imageUrl) return q;
        try {
          const res = await fetch("/api/recruitment/upload-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ base64: q.imageUrl }),
          });
          const data = await res.json();
          if (data.success && data.url) {
            return { ...q, imageUrl: data.url, imagePending: false };
          }
        } catch (err) {
          console.warn(
            "[Upload pending image] failed for question:",
            q.id,
            err,
          );
        }
        return q;
      }),
    );
  };

  const handleReplaceImage = (idx: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setGeneratedQuestions((prev) => {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          imageUrl: base64,
          imagePending: true,
          imageGenerating: false,
        };
        return updated;
      });
      setEditingImageIdx((prev) => ({ ...prev, [idx]: false }));
    };
    reader.readAsDataURL(file);
  };

  const handleRegenerateImage = async (idx: number) => {
    const q = generatedQuestions[idx];
    setGeneratedQuestions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], imageGenerating: true };
      return updated;
    });
    try {
      const imgRes = await fetch("/api/recruitment/generate-diagram-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: q.question,
          context: contextText,
          recruitmentFor: recruitmentFor
        }),
      });
      const imgData = await imgRes.json();
      setGeneratedQuestions((prev) => {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          imageGenerating: false,
          imageUrl: imgData.success ? imgData.base64 : updated[idx].imageUrl,
          imagePending: imgData.success ? true : updated[idx].imagePending,
        };
        return updated;
      });
    } catch {
      setGeneratedQuestions((prev) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], imageGenerating: false };
        return updated;
      });
    }
  };

  const isDiagramType = (type: string) =>
    type === "diagram_mcq" || type === "diagram_short_answer";

  const handleNewQuestionImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setNewQuestionForm((prev: any) => ({
        ...prev,
        imageUrl: base64,
        imagePending: true,
      }));
    };
    reader.readAsDataURL(file);
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
      explanation: "",
      imageUrl: undefined,
      imagePending: false,
    });
  };

  const saveNewQuestion = () => {
    if (!newQuestionForm) return;
    if (!newQuestionForm.question.trim()) {
      setNewQuestionError("Please enter the question text.");
      return;
    }
    if (newQuestionForm.type === "multiple_choice" || newQuestionForm.type === "diagram_mcq") {
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
    } else if (newQuestionForm.type === "short_answer" || newQuestionForm.type === "diagram_short_answer") {
      if (!newQuestionForm.correctAnswer.trim()) {
        setNewQuestionError("Provide a baseline correct answer description.");
        return;
      }
    }

    const newQ: Question = {
      id: Date.now().toString(),
      type: newQuestionForm.type,
      question: newQuestionForm.question.trim(),
      options: (newQuestionForm.type === "multiple_choice" || newQuestionForm.type === "diagram_mcq")
        ? newQuestionForm.options.map((o: string) => o.trim())
        : newQuestionForm.type === "true_false"
          ? ["True", "False"]
          : [],
      correctAnswer: newQuestionForm.correctAnswer.trim(),
      explanation: newQuestionForm.explanation?.trim() || "",
      imageUrl: newQuestionForm.imageUrl,
      imagePending: newQuestionForm.imagePending,
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
      assessmentName: printConfig.assessmentName || assessmentTitle || `${position || "Candidate"} Assessment`,
      schoolName: recruitmentFor || allschoolsdata[0].name,
      position: position || "Candidate Profile",
      department: department || "General",
      classification: teachingType === "teaching" ? "Teaching Profile" : "Non-Teaching Profile",
      date: printConfig.date || new Date().toLocaleDateString("en-IN"),
      day: printConfig.day || new Date().toLocaleDateString("en-IN", { weekday: 'long' }),
      duration: printConfig.duration || `${duration || 30} Minutes`,
      generatedBy: printConfig.generatedBy || recruiter?.name || "HR Officer",
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
        <h2 className="text-3xl font-black text-gray-900">AI Recruitment Generator</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tailor recruitment exams by specifying the role, school, and department. Feed standard reference docs to Gemini AI to compile exact questions.
        </p>
      </div>

      <div
        className="grid lg:grid-cols-5 gap-8 items-start"
        style={formHeight ? { height: `${formHeight}px` } : undefined}
      >
        {/* LEFT: Config Panel */}
        <div className="lg:col-span-2 space-y-6 no-print">
          <form ref={formRef} onSubmit={handleGenerate} className="space-y-6">
            
            {/* Position, school metadata */}
            <div className="bg-white/80 border border-gray-200 rounded-none p-6 space-y-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Award size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Candidate Targeting</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Position Applied For</label>
                <input
                  type="text" required value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. English Pedagogy Lecturer"
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
                    <option value="teaching">Teaching Profile</option>
                    <option value="non-teaching">Non-Teaching</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Department</label>
                  <input
                    type="text" value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Science, HR, Admin"
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
                    <h3 className="text-sm font-bold text-gray-900">Source Materials</h3>
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
                      ? "e.g., Focus specifically on teaching aptitude and structural lesson planning metrics in the textbook."
                      : "e.g., Generate a rigorous aptitude assessment measuring general logic, communication accuracy, and role accountability."
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
                  {
                    key: "diagram_mcq",
                    label: "Diagram-Based MCQ (AI Image Generated)",
                    badge: "NEW",
                    badgeColor:
                      "bg-violet-100 text-violet-700 border-violet-200",
                  },
                  {
                    key: "diagram_short_answer",
                    label: "Diagram-Based Short Answer (AI Image Generated)",
                    badge: "NEW",
                    badgeColor:
                      "bg-violet-100 text-violet-700 border-violet-200",
                  },
                ].map(({ key, label, badge, badgeColor }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => setQuestionTypes({ ...questionTypes, [key]: !(questionTypes as any)[key] })}
                      className={`h-5 w-5 rounded-none border-2 flex items-center justify-center transition-all cursor-pointer ${
                        (questionTypes as any)[key] ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                      }`}
                    >
                      {(questionTypes as any)[key] && <CheckCircle size={12} className="text-white" />}
                    </div>
                    <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors flex-1">{label}</span>
                    {badge && (
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border rounded-none ${badgeColor}`}
                      >
                        {badge}
                      </span>
                    )}
                  </label>
                ))}

                {(questionTypes.diagram_mcq ||
                  questionTypes.diagram_short_answer) && (
                  <div className="mt-2 p-3 bg-violet-50 border border-violet-200 rounded-none flex items-start gap-2">
                    <ImageIcon
                      size={13}
                      className="text-violet-600 shrink-0 mt-0.5"
                    />
                    <p className="text-[10px] text-violet-700 font-medium leading-relaxed">
                      Diagram questions will automatically generate a relevant
                      educational illustration using AI. Images are saved to
                      Cloudinary when you save the assessment.
                    </p>
                  </div>
                )}
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
                  Compiling Candidate Assessment...
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
        <div className="lg:col-span-3 space-y-6 relative h-full overflow-y-auto custom-scrollbar bg-white/20 border border-gray-200 rounded-none px-6 pb-6 space-y-4 shadow-sm backdrop-blur-sm">
          
          <div className="flex items-center justify-end no-print border-b absolute border-gray-200 py-4 sticky bg-white z-10">
            {generatedQuestions.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-xs font-bold text-gray-705 border border-gray-300 transition-all cursor-pointer"
                >
                  <Plus size={12} /> Add Question
                </button>
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
                  type="button"
                  onClick={handleDiscardAssessment}
                  className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-650 px-4 py-2 rounded-none text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Trash2 size={13} /> Discard
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
          <h3 className="text-lg font-extrabold flex items-center gap-2">
            <Eye size={18} className="text-blue-600" />
            <span className="text-gray-900 font-extrabold">Assessment Question Board ({generatedQuestions.length} Questions)</span>
          </h3>

          {generatorLoading ? (
            <div className="bg-white border border-gray-200 rounded-none p-16 text-center text-gray-500 h-1/2 flex flex-col items-center justify-start space-y-6 no-print shadow-sm min-h-[350px]">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <TimerIcon/>
                <span className="text-gray-900 font-extrabold">
                  Please Wait, It May Take Few Minutes...
                </span>
              </h3>
              <div className="h-32 w-32 flex items-center justify-center text-blue-600 rounded-none animate-spin">
                <RefreshCw size={64} />
              </div>
              <div className="space-y-2 max-w-md">
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 animate-pulse flex items-end mx-auto justify-center gap-1">
                 <Lightbulb size={18}/> Did you know?
                </p>
                <p className="text-xs text-gray-700 leading-relaxed font-bold italic text-center">
                  "{currentFact}"
                </p>
              </div>
            </div>
          ) : generatedQuestions.length === 0 ? (
            <div className="bg-white/40 border border-dashed border-gray-300 rounded-none p-16 text-center text-gray-500 space-y-2 no-print">
              <FileText size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-700">Ready to build your assessment?</p>
              <p className="text-xs max-w-sm mx-auto text-gray-500">Fill in the candidate targeting parameters, specify the hiring position, select a generation mode, and execute the generator.</p>
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
                      <span>{q.type.replace(/_/g, " ")}</span>
                      {isDiagramType(q.type) && (
                        <span className="text-[9px] font-black uppercase bg-violet-100 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded-none ml-2">
                          Diagram
                        </span>
                      )}
                    </div>

                    {/* Diagram image section */}
                    {isDiagramType(q.type) && (
                      <div className="space-y-2 print:hidden">
                        {q.imageGenerating ? (
                          <div className="h-48 bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 border border-violet-200 rounded-none flex flex-col items-center justify-center gap-3 animate-pulse">
                            <ImageIcon size={28} className="text-violet-400" />
                            <p className="text-xs text-violet-600 font-bold">
                              Generating diagram with AI...
                            </p>
                          </div>
                        ) : q.imageUrl && !editingImageIdx[idx] ? (
                          <div className="relative group">
                            <img
                              src={q.imageUrl}
                              alt={`Diagram for question ${idx + 1}`}
                              className="w-full max-h-56 object-contain border border-gray-200 rounded-none bg-gray-50"
                            />
                            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleRegenerateImage(idx)}
                                className="bg-white border border-gray-300 text-gray-650 hover:text-violet-600 p-1.5 rounded-none shadow-sm cursor-pointer"
                                title="Re-generate with AI"
                              >
                                <RefreshCw size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingImageIdx((prev) => ({
                                    ...prev,
                                    [idx]: true,
                                  }))
                                }
                                className="bg-white border border-gray-300 text-gray-650 hover:text-blue-600 p-1.5 rounded-none shadow-sm cursor-pointer"
                                title="Edit Image URL or File"
                              >
                                <Edit2 size={11} />
                              </button>
                            </div>
                            {q.imagePending && (
                              <div className="absolute bottom-2 left-2 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-black px-2 py-1 rounded-none uppercase tracking-wider font-bold">
                                Will upload to Cloudinary on Save
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="border border-dashed border-violet-300 p-6 flex flex-col gap-3 bg-violet-50/10">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <ImageIcon
                                  size={22}
                                  className="text-violet-400"
                                />
                                <p className="text-xs text-violet-600 font-bold">
                                  {q.imageUrl
                                    ? "Modify Diagram Image"
                                    : "No image generated"}
                                </p>
                              </div>
                              {q.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingImageIdx((prev) => ({
                                      ...prev,
                                      [idx]: false,
                                    }))
                                  }
                                  className="text-[10px] uppercase font-black tracking-wider text-red-650 hover:text-red-800 transition-colors cursor-pointer font-bold"
                                >
                                  Cancel Edit
                                </button>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block font-bold">
                                Backup image / Custom image
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Paste image link (starts with http/https)..."
                                  value={
                                    q.imageUrl &&
                                    !q.imageUrl.startsWith("data:")
                                      ? q.imageUrl
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const url = e.target.value;
                                    const updated = [...generatedQuestions];
                                    if (url.trim() === "") {
                                      updated[idx].imageUrl = undefined;
                                      updated[idx].imagePending = false;
                                    } else if (
                                      url.startsWith("http://") ||
                                      url.startsWith("https://")
                                    ) {
                                      updated[idx].imageUrl = url.trim();
                                      updated[idx].imagePending = false;
                                      setEditingImageIdx((prev) => ({
                                        ...prev,
                                        [idx]: false,
                                      }));
                                    }
                                    setGeneratedQuestions(updated);
                                  }}
                                  className="flex-1 bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-955 font-bold outline-none focus:border-blue-600"
                                />
                                <label
                                  className="bg-white border border-gray-300 text-gray-650 hover:text-blue-600 px-3 py-1.5 rounded-none shadow-sm cursor-pointer flex items-center gap-1 text-xs font-bold animate-in duration-200"
                                  title="Upload custom image"
                                >
                                  <UploadCloud size={14} />
                                  <span>Upload</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleReplaceImage(idx, f);
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

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

                    {(q.type === "multiple_choice" || q.type === "diagram_mcq") && (
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
                            const newType = e.target.value;
                            setNewQuestionForm({
                              ...newQuestionForm,
                              type: newType,
                              options:
                                newType === "multiple_choice" ||
                                newType === "diagram_mcq"
                                  ? ["", "", "", ""]
                                  : newType === "true_false"
                                    ? ["True", "False"]
                                    : [],
                              correctAnswer:
                                newType === "true_false" ? "True" : "",
                              imageUrl: isDiagramType(newType)
                                ? newQuestionForm.imageUrl
                                : undefined,
                              imagePending: isDiagramType(newType)
                                ? newQuestionForm.imagePending
                                : false,
                            });
                          }}
                          className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs text-gray-900 focus:border-blue-600 outline-none"
                        >
                          <option value="multiple_choice">Multiple Choice (MCQ)</option>
                          <option value="true_false">True / False</option>
                          <option value="short_answer">Short Answer</option>
                          <option value="diagram_mcq">Diagram MCQ</option>
                          <option value="diagram_short_answer">Diagram Short Answer</option>
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

                    {/* Diagram image upload for manual question */}
                    {isDiagramType(newQuestionForm.type) && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                          <ImageIcon size={11} className="text-violet-600" />{" "}
                          Diagram Image
                          <span className="text-gray-400 normal-case font-normal">
                            (upload or generate)
                          </span>
                        </label>

                        {newQuestionForm.type === "diagram_mcq" && (
                          <div className="space-y-1.5 border border-gray-150 p-3 bg-gray-50/50">
                            <label className="text-[9px] font-black uppercase tracking-wider text-gray-500 block">
                              Backup image (optional)
                            </label>
                            <input
                              type="text"
                              placeholder="Paste image link (starts with http/https)..."
                              value={
                                newQuestionForm.imageUrl &&
                                !newQuestionForm.imageUrl.startsWith("data:")
                                  ? newQuestionForm.imageUrl
                                  : ""
                              }
                              onChange={(e) => {
                                const url = e.target.value;
                                if (url.trim() === "") {
                                  setNewQuestionForm({
                                    ...newQuestionForm,
                                    imageUrl: undefined,
                                    imagePending: false,
                                  });
                                } else if (
                                  url.startsWith("http://") ||
                                  url.startsWith("https://")
                                ) {
                                  setNewQuestionForm({
                                    ...newQuestionForm,
                                    imageUrl: url.trim(),
                                    imagePending: false,
                                  });
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
                            <label className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white border border-gray-300 text-gray-650 hover:text-blue-600 p-1.5 rounded-none shadow-sm cursor-pointer transition-opacity">
                              <UploadCloud size={11} />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleNewQuestionImageUpload(f);
                                }}
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-violet-300 hover:border-violet-500 rounded-none p-5 flex flex-col items-center gap-2 bg-violet-50/30 cursor-pointer transition-colors">
                            <UploadCloud
                              size={20}
                              className="text-violet-400"
                            />
                            <p className="text-xs text-violet-600 font-bold">
                              Upload diagram image
                            </p>
                            <p className="text-[10px] text-gray-400">
                              PNG, JPG, GIF, WebP
                            </p>
                            <input
                              ref={newImageInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
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
                      onClick={saveNewQuestion}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-none text-xs transition-all shadow-sm cursor-pointer"
                    >
                      Insert Question
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={addQuestion}
                    className="w-full bg-white hover:bg-gray-50 text-blue-600 border border-gray-300 py-3 rounded-none font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus size={14} /> Add Custom Question
                  </button>
                )}
              </div>

              {/* Print-Only Pure Layout */}
              <div className="print-only-layout hidden print:block bg-white text-black p-8 font-sans space-y-6">
                <div className="border-b-2 border-black pb-4 text-center">
                  <h1 className="text-2xl font-black">{printConfig.schoolName}</h1>
                  <h2 className="text-lg font-bold mt-1">{printConfig.assessmentName}</h2>
                  <div className="grid grid-cols-2 text-left text-xs gap-x-8 gap-y-1 max-w-xl mx-auto mt-4">
                    <p><strong>Position:</strong> {printConfig.position}</p>
                    <p><strong>Department:</strong> {printConfig.department || "General"}</p>
                    <p><strong>Classification:</strong> {printConfig.classification}</p>
                    <p><strong>Supervised By:</strong> {printConfig.generatedBy}</p>
                    <p><strong>Duration:</strong> {printConfig.duration}</p>
                    <p><strong>Print Date:</strong> {printConfig.date} ({printConfig.day})</p>
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  {generatedQuestions.map((q, idx) => (
                    <div key={q.id} className="space-y-2">
                      <p className="font-bold text-sm">{idx + 1}. {q.question}</p>
                      
                      {q.imageUrl &&
                        !q.imageGenerating &&
                        isDiagramType(q.type) && (
                          <img
                            src={q.imageUrl}
                            alt={`Diagram ${idx + 1}`}
                            className="max-h-48 object-contain border border-gray-200 my-2"
                          />
                        )}

                      {(q.type === "multiple_choice" || q.type === "diagram_mcq") && (
                        <div className="grid grid-cols-2 gap-2 pl-4 text-xs">
                          {q.options.map((opt, oIdx) => (
                            <p key={oIdx}>({String.fromCharCode(97 + oIdx)}) {opt}</p>
                          ))}
                        </div>
                      )}

                      {q.type === "true_false" && (
                        <p className="pl-4 text-xs font-bold text-slate-600">Option: True / False</p>
                      )}

                      {printConfig.includeAnswers && (
                        <div className="border-t border-slate-200 mt-2 pt-1 text-[11px] text-slate-600">
                          <p><strong>Key Answer:</strong> {q.correctAnswer}</p>
                          {q.explanation && <p><strong>Rationale:</strong> {q.explanation}</p>}
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

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-none p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-gray-900">Save Assessment Template</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {generatedQuestions.some((q) => q.imagePending) && (
              <div className="flex items-start gap-2 p-3 bg-violet-50 border border-violet-200 rounded-none text-xs text-violet-750 font-bold">
                <ImageIcon size={13} className="shrink-0 mt-0.5" />
                <span>
                  <strong>
                    {generatedQuestions.filter((q) => q.imagePending).length}
                  </strong>{" "}
                  diagram image(s) will be uploaded to Cloudinary when you save.
                </span>
              </div>
            )}

            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-none text-xs text-red-600 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAssessment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">Assessment Title</label>
                <input
                  type="text" required value={assessmentTitle}
                  onChange={(e) => setAssessmentTitle(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-none px-4 py-2.5 text-xs text-gray-900 focus:border-blue-600 outline-none"
                  placeholder="e.g. Physics Lecturer Selection Exam"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">Allowed Duration (Minutes)</label>
                <input
                  type="number" required value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded-none px-4 py-2.5 text-xs text-gray-900 focus:border-blue-600 outline-none"
                  min={5} max={180}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer group pt-2">
                <div
                  onClick={() => setIsPublic(!isPublic)}
                  className={`h-5 w-5 rounded-none border-2 flex items-center justify-center transition-all cursor-pointer ${
                    isPublic ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                  }`}
                >
                  {isPublic && <CheckCircle size={12} className="text-white" />}
                </div>
                <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">Save as public template (visible to other HR accounts)</span>
              </label>

              <button
                type="submit" disabled={saveLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-none text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {saveLoading ? "Registering Template..." : "Confirm & Save Template"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Print / Export Config Modal */}
      {showPrintConfigModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 w-full max-w-lg rounded-none p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {activePrintMode === "pdf" ? "Export Assessment as PDF" : "Print Assessment Exam"}
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Configure exam print layout fields</p>
              </div>
              <button
                onClick={() => setShowPrintConfigModal(false)}
                type="button"
                className="p-2 hover:bg-gray-100 rounded-none text-gray-400 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Format Choice: Questions Only vs With Answer Key */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
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
                        ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
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
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">Assessment Title</label>
                <input
                  type="text"
                  value={printConfig.assessmentName}
                  onChange={(e) => setPrintConfig({ ...printConfig, assessmentName: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                />
              </div>

              {/* School Name select dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">Target Institution / School</label>
                <select
                  value={printConfig.schoolName}
                  onChange={(e) => setPrintConfig({ ...printConfig, schoolName: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                >
                  {allschoolsdata.map((school) => (
                    <option key={school.id} value={school.name}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Position & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">Position</label>
                  <input
                    type="text"
                    value={printConfig.position}
                    onChange={(e) => setPrintConfig({ ...printConfig, position: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">Department</label>
                  <input
                    type="text"
                    value={printConfig.department}
                    onChange={(e) => setPrintConfig({ ...printConfig, department: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                  />
                </div>
              </div>

              {/* Date & Day and Classification & Duration Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column: Date & Day Stack */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">Date</label>
                    <input
                      type="text"
                      value={printConfig.date}
                      onChange={(e) => setPrintConfig({ ...printConfig, date: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">Day</label>
                    <input
                      type="text"
                      value={printConfig.day}
                      onChange={(e) => setPrintConfig({ ...printConfig, day: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                </div>

                {/* Right Column: Classification & Duration Stack */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">Classification</label>
                    <input
                      type="text"
                      value={printConfig.classification}
                      onChange={(e) => setPrintConfig({ ...printConfig, classification: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">Duration</label>
                    <input
                      type="text"
                      value={printConfig.duration}
                      onChange={(e) => setPrintConfig({ ...printConfig, duration: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Generated By */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block flex justify-between">
                  <span>Supervised / Generated By</span>
                  <span className="text-[8px] text-gray-400 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={printConfig.generatedBy}
                  onChange={(e) => setPrintConfig({ ...printConfig, generatedBy: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowPrintConfigModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-none font-bold text-xs text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              {activePrintMode === "pdf" && isMounted ? (
                <PDFDownloadLink
                  key={`${printConfig.assessmentName}-${printConfig.schoolName}-${printConfig.position}-${printConfig.department}-${printConfig.classification}-${printConfig.date}-${printConfig.day}-${printConfig.duration}-${printConfig.generatedBy}-${printConfig.includeAnswers}-${generatedQuestions.length}`}
                  document={<QuestionBankPDFDocument questions={generatedQuestions} config={printConfig} />}
                  fileName={`${printConfig.assessmentName.replace(/\s+/g, "_") || "Recruitment_Assessment"}_${printConfig.includeAnswers ? "Solutions" : "Questions"}.pdf`}
                  onClick={() => {
                    setTimeout(() => setShowPrintConfigModal(false), 500);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-sm py-3 rounded-none font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white no-underline text-center cursor-pointer"
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
                  className="flex-1 py-3 rounded-none font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer"
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
