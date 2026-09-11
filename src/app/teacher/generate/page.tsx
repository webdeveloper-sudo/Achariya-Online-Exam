"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  Sliders,
  Zap,
  Loader as LoaderIcon,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  GripVertical,
  Printer,
  FileDown,
  Image as ImageIcon,
  RefreshCw,
  Edit2,
  ArrowLeft,
  Lightbulb,
  TimerIcon,
} from "lucide-react";
import Loader from "@/components/Loader";
import dynamic from "next/dynamic";

const PDFDownloadLink = dynamic(
  () =>
    import("@react-pdf/renderer").then((m) => ({ default: m.PDFDownloadLink })),
  { ssr: false },
);

import QuestionBankPDFDocument from "@/components/teacher/QuestionBankPDFDocument";

interface Question {
  id: string;
  type: string; // "multiple_choice" | "true_false" | "short_answer" | "diagram_mcq" | "diagram_short_answer" | "fill_in_the_blanks" | "match_the_following" | "odd_one_out" | "long_answer"
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  imageUrl?: string; // Cloudinary URL (after save) or temporary preview URL
  images?: string[]; // Array of image URLs
  sharedImageId?: string;
  requiresReview?: boolean;
  confidence?: number;
  imagePending?: boolean; // true = temporary URL/base64, not yet uploaded to Cloudinary
  imageGenerating?: boolean; // true = AI is currently generating image
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
  const [pdfClassification, setPdfClassification] = useState<
    | "syllabus"
    | "question_paper_with_answers"
    | "question_paper_without_answers"
  >("syllabus");
  const [generationMode, setGenerationMode] = useState<
    "pdf_only" | "pdf_context" | "text_only"
  >("pdf_only");
  const [contextText, setContextText] = useState("");
  const [unassignedImages, setUnassignedImages] = useState<
    { id: string; url: string; pageNumber: number }[]
  >([]);
  const [selectedImageForReassign, setSelectedImageForReassign] = useState<{
    url: string;
    fromQIdx?: number;
  } | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [targetQuestionForReassign, setTargetQuestionForReassign] =
    useState<number>(0);

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
    diagram_mcq: false,
    diagram_short_answer: false,
  });
  const [generatorLoading, setGeneratorLoading] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  // Add Question / Drag rearrangement States
  const [newQuestionForm, setNewQuestionForm] = useState<any | null>(null);
  const [newQuestionError, setNewQuestionError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const newImageInputRef = useRef<HTMLInputElement>(null);

  const [editingImageIdx, setEditingImageIdx] = useState<
    Record<number, boolean>
  >({});
  const imageAbortControllersRef = useRef<{ [key: number]: AbortController }>(
    {},
  );
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

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [highlightedQuestionIdx, setHighlightedQuestionIdx] = useState<number | null>(null);
  const [saveForm, setSaveForm] = useState({
    title: "",
    duration: 30,
    subject: "",
    lesson: "",
    isPublic: false,
  });

  // Print / Export Popups and layouts states
  const [activePrintMode, setActivePrintMode] = useState<"print" | "pdf">(
    "print",
  );
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
      assessmentName:
        printConfig.assessmentName ||
        saveForm.title ||
        (topic || "AI Generated") + " Assessment",
      schoolName:
        printConfig.schoolName &&
        printConfig.schoolName !== "Achariya Higher Secondary School"
          ? printConfig.schoolName
          : "ACHARIYA WORLD CLASS EDUCATION",
      subject:
        printConfig.subject || saveForm.subject || subjectFromSelection(),
      lesson: printConfig.lesson || saveForm.lesson || "Chapter 1",
      grade: printConfig.grade || grade || "5th Grade",
      date: printConfig.date || new Date().toLocaleDateString("en-IN"),
      day:
        printConfig.day ||
        new Date().toLocaleDateString("en-IN", { weekday: "long" }),
      duration: printConfig.duration || `${saveForm.duration || 30} Minutes`,
      generatedBy:
        printConfig.generatedBy ||
        teacher?.userName ||
        teacher?.email?.split("@")[0] ||
        "",
      includeAnswers:
        printConfig.includeAnswers !== undefined
          ? printConfig.includeAnswers
          : true,
    });
    setShowPrintConfigModal(true);
  };

  const openSaveModal = () => {
    // 1. Validate that every question has a correct answer configured
    const firstUnconfiguredIdx = generatedQuestions.findIndex(
      (q) => !q.correctAnswer || !q.correctAnswer.trim()
    );

    if (firstUnconfiguredIdx !== -1) {
      setHighlightedQuestionIdx(firstUnconfiguredIdx);
      const qNum = firstUnconfiguredIdx + 1;
      const errorMsg = `Question #${qNum} has no correct answer configured. Please set the correct answer before saving.`;
      setValidationError(errorMsg);

      setTimeout(() => {
        const el = document.getElementById(`question-card-${firstUnconfiguredIdx}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);

      return;
    }

    setValidationError(null);
    setHighlightedQuestionIdx(null);

    setPrintConfig({
      assessmentName:
        printConfig.assessmentName ||
        saveForm.title ||
        (topic || "AI Generated") + " Assessment",
      schoolName:
        printConfig.schoolName &&
        printConfig.schoolName !== "Achariya Higher Secondary School"
          ? printConfig.schoolName
          : "ACHARIYA WORLD CLASS EDUCATION",
      subject:
        printConfig.subject || saveForm.subject || subjectFromSelection(),
      lesson: printConfig.lesson || saveForm.lesson || "Chapter 1",
      grade: printConfig.grade || grade || "5th Grade",
      date: printConfig.date || new Date().toLocaleDateString("en-IN"),
      day:
        printConfig.day ||
        new Date().toLocaleDateString("en-IN", { weekday: "long" }),
      duration: printConfig.duration || `${saveForm.duration || 30} Minutes`,
      generatedBy:
        printConfig.generatedBy ||
        teacher?.userName ||
        teacher?.email?.split("@")[0] ||
        "",
      includeAnswers:
        printConfig.includeAnswers !== undefined
          ? printConfig.includeAnswers
          : true,
    });
    setShowSaveModal(true);
  };

  useEffect(() => {
    setIsMounted(true);
    const t = localStorage.getItem("teacherToken");
    const u = localStorage.getItem("teacherUser");
    if (!t || !u) {
      router.push("/teacher/login");
      return;
    }
    setToken(t);
    setTeacher(JSON.parse(u));

    // Load saved generator state from localStorage
    try {
      const savedGenQuestions = localStorage.getItem(
        "teach_generatedQuestions",
      );
      if (savedGenQuestions) {
        setGeneratedQuestions(JSON.parse(savedGenQuestions));
      }

      const savedGenMode = localStorage.getItem("teach_generationMode");
      if (savedGenMode) setGenerationMode(savedGenMode as any);

      const savedContextText = localStorage.getItem("teach_contextText");
      if (savedContextText) setContextText(savedContextText);

      const savedDiff = localStorage.getItem("teach_difficulty");
      if (savedDiff) setDifficulty(savedDiff);

      const savedTopic = localStorage.getItem("teach_topic");
      if (savedTopic) setTopic(savedTopic);

      const savedSyllabus = localStorage.getItem("teach_syllabus");
      if (savedSyllabus) setSyllabus(savedSyllabus);

      const savedGrade = localStorage.getItem("teach_grade");
      if (savedGrade) setGrade(savedGrade);

      const savedAssessmentStyle = localStorage.getItem(
        "teach_assessmentStyle",
      );
      if (savedAssessmentStyle) setAssessmentStyle(savedAssessmentStyle);

      const savedNumQuestions = localStorage.getItem("teach_numQuestions");
      if (savedNumQuestions) setNumQuestions(Number(savedNumQuestions));

      const savedQuestionTypes = localStorage.getItem("teach_questionTypes");
      if (savedQuestionTypes) {
        setQuestionTypes(JSON.parse(savedQuestionTypes));
      }
    } catch (err) {
      console.warn(
        "Failed to load saved assessment generator state from localStorage:",
        err,
      );
    }
    setIsStateLoaded(true);
  }, [router]);

  // Auto-save generator state to localStorage
  useEffect(() => {
    if (!isStateLoaded) return;
    try {
      localStorage.setItem(
        "teach_generatedQuestions",
        JSON.stringify(generatedQuestions),
      );
      localStorage.setItem("teach_generationMode", generationMode);
      localStorage.setItem("teach_contextText", contextText);
      localStorage.setItem("teach_difficulty", difficulty);
      localStorage.setItem("teach_topic", topic);
      localStorage.setItem("teach_syllabus", syllabus);
      localStorage.setItem("teach_grade", grade);
      localStorage.setItem("teach_assessmentStyle", assessmentStyle);
      localStorage.setItem("teach_numQuestions", String(numQuestions));
      localStorage.setItem(
        "teach_questionTypes",
        JSON.stringify(questionTypes),
      );
    } catch (err) {
      console.warn(
        "Failed to save assessment generator state to localStorage:",
        err,
      );
    }
  }, [
    isStateLoaded,
    generatedQuestions,
    generationMode,
    contextText,
    difficulty,
    topic,
    syllabus,
    grade,
    assessmentStyle,
    numQuestions,
    questionTypes,
  ]);

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
        setFiles((prev) => [...prev, ...validFilesList]);
        setGeneratorError(null);
      }
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
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
    files.forEach((f) => {
      formData.append("file", f);
    });
    formData.append("numQuestions", numQuestions.toString());
    formData.append("questionTypes", types);
    formData.append("generationMode", generationMode);
    formData.append("pdfClassification", pdfClassification);
    formData.append("contextText", contextText);
    formData.append("difficulty", difficulty);
    formData.append("topic", topic);
    formData.append("syllabus", syllabus);
    formData.append("grade", grade);
    formData.append("assessmentStyle", assessmentStyle);

    try {
      const res = await fetch("/api/teacher/assessment/generate", {
        method: "POST",
        body: formData,
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(
          res.status === 500
            ? "Server error during question generation. Please check Gemini API quotas or try with fewer questions."
            : `Server returned unexpected response (${res.status}).`,
        );
      }

      if (res.ok && data.success) {
        const questions: Question[] = data.questions;

        let autoTitle = "";
        if (generationMode !== "text_only" && files.length > 0) {
          const firstFile = files[0];
          const baseName =
            firstFile.name.substring(0, firstFile.name.lastIndexOf(".")) ||
            firstFile.name;
          autoTitle = baseName + " Assessment";
        } else {
          autoTitle = (topic || "AI Generated") + " Assessment";
        }

        setSaveForm({
          title: autoTitle,
          duration: 30,
          subject: subjectFromSelection(),
          lesson: "Chapter 1",
          isPublic: false,
        });

        setPrintConfig({
          assessmentName: autoTitle,
          schoolName: "ACHARIYA WORLD CLASS EDUCATION",
          subject: subjectFromSelection(),
          lesson: "Chapter 1",
          grade: grade || "5th Grade",
          date: new Date().toLocaleDateString("en-IN"),
          day: new Date().toLocaleDateString("en-IN", { weekday: "long" }),
          duration: "30 Minutes",
          generatedBy: teacher?.userName || teacher?.email?.split("@")[0] || "",
          includeAnswers: true,
        });

        // Direct Question Paper Mode (Zero AI) -> Direct preview
        if (
          pdfClassification === "question_paper_with_answers" ||
          pdfClassification === "question_paper_without_answers"
        ) {
          setGeneratedQuestions(questions);
          setUnassignedImages(data.unassignedImages || []);
          setGeneratorLoading(false);
          return;
        }

        // Mark diagram questions as generating for Syllabus AI flow
        const markedQuestions = questions.map((q) =>
          isDiagramType(q.type) ? { ...q, imageGenerating: true } : q,
        );
        setGeneratedQuestions(markedQuestions);
        setGeneratorLoading(false);

        // Generate images for diagram questions in background asynchronously
        markedQuestions.forEach((q, idx) => {
          if (!isDiagramType(q.type)) return;
          const controller = new AbortController();
          imageAbortControllersRef.current[idx] = controller;

          fetch("/api/teacher/generate-diagram-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              questionText: q.question,
              context: contextText,
            }),
            signal: controller.signal,
          })
            .then((res) => res.json())
            .then((imgData) => {
              setGeneratedQuestions((prev) => {
                const updated = [...prev];
                if (updated[idx]) {
                  updated[idx] = {
                    ...updated[idx],
                    imageGenerating: false,
                    imageUrl: imgData.success
                      ? imgData.base64
                      : updated[idx].imageUrl,
                    imagePending: imgData.success
                      ? true
                      : updated[idx].imagePending,
                  };
                }
                return updated;
              });
            })
            .catch((err) => {
              if (err?.name !== "AbortError") {
                setGeneratedQuestions((prev) => {
                  const updated = [...prev];
                  if (updated[idx]) {
                    updated[idx] = { ...updated[idx], imageGenerating: false };
                  }
                  return updated;
                });
              }
            })
            .finally(() => {
              delete imageAbortControllersRef.current[idx];
            });
        });
      } else {
        setGeneratorError(data.message || "Failed to generate questions.");
        setGeneratorLoading(false);
      }
    } catch (err: any) {
      setGeneratorError("Network error: " + err.message);
      setGeneratorLoading(false);
    }
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = printConfig.assessmentName.trim();
    const subject = printConfig.subject.trim();
    const lesson = printConfig.lesson ? printConfig.lesson.trim() : "General";
    const durationNum =
      parseInt(printConfig.duration.replace(/\D/g, ""), 10) || 30;

    if (!title || !subject) {
      setSaveError("Assessment Name and Subject are required.");
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

      // 2. Clean imageGenerating / imagePending flags and ensure non-empty correctAnswer before saving
      const cleanQuestions = finalQuestions.map(
        ({ imageGenerating, imagePending, ...rest }: any) => {
          let ca = (rest.correctAnswer || "").trim();
          if (!ca) {
            ca =
              rest.options && rest.options.length > 0
                ? rest.options[0]
                : rest.type === "true_false"
                  ? "True"
                  : "Option A";
          }
          return { ...rest, correctAnswer: ca };
        },
      );

      const res = await fetch("/api/teacher/assessment/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          duration: durationNum,
          subject,
          lesson,
          isPublic: saveForm.isPublic,
          questions: cleanQuestions,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.removeItem("teach_generatedQuestions");
        localStorage.removeItem("teach_generationMode");
        localStorage.removeItem("teach_contextText");
        localStorage.removeItem("teach_difficulty");
        localStorage.removeItem("teach_topic");
        localStorage.removeItem("teach_syllabus");
        localStorage.removeItem("teach_grade");
        localStorage.removeItem("teach_assessmentStyle");
        localStorage.removeItem("teach_numQuestions");
        localStorage.removeItem("teach_questionTypes");

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

  const handleDiscardAssessment = () => {
    if (
      window.confirm(
        "Are you sure you want to discard this generated assessment? This will clear the current question board and reset your inputs.",
      )
    ) {
      localStorage.removeItem("teach_generatedQuestions");
      localStorage.removeItem("teach_generationMode");
      localStorage.removeItem("teach_contextText");
      localStorage.removeItem("teach_difficulty");
      localStorage.removeItem("teach_topic");
      localStorage.removeItem("teach_syllabus");
      localStorage.removeItem("teach_grade");
      localStorage.removeItem("teach_assessmentStyle");
      localStorage.removeItem("teach_numQuestions");
      localStorage.removeItem("teach_questionTypes");

      setGeneratedQuestions([]);
      setGenerationMode("pdf_only");
      setContextText("");
      setDifficulty("mixed");
      setTopic("");
      setSyllabus("CBSE");
      setGrade("5th Grade");
      setAssessmentStyle("standard");
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
          const res = await fetch("/api/teacher/upload-image", {
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

  const handleCancelImageGeneration = (idx: number) => {
    if (imageAbortControllersRef.current[idx]) {
      imageAbortControllersRef.current[idx].abort();
      delete imageAbortControllersRef.current[idx];
    }
    setGeneratedQuestions((prev) => {
      const updated = [...prev];
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], imageGenerating: false };
      }
      return updated;
    });
    setEditingImageIdx((prev) => ({ ...prev, [idx]: true }));
  };

  const handleRegenerateImage = async (idx: number) => {
    const q = generatedQuestions[idx];
    if (!q) return;

    setGeneratedQuestions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], imageGenerating: true };
      return updated;
    });
    setEditingImageIdx((prev) => ({ ...prev, [idx]: false }));

    const controller = new AbortController();
    imageAbortControllersRef.current[idx] = controller;

    try {
      const imgRes = await fetch("/api/teacher/generate-diagram-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: q.question,
          context: contextText,
        }),
        signal: controller.signal,
      });
      const imgData = await imgRes.json();
      setGeneratedQuestions((prev) => {
        const updated = [...prev];
        if (updated[idx]) {
          updated[idx] = {
            ...updated[idx],
            imageGenerating: false,
            imageUrl: imgData.success ? imgData.base64 : updated[idx].imageUrl,
            imagePending: imgData.success ? true : updated[idx].imagePending,
          };
        }
        return updated;
      });
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setGeneratedQuestions((prev) => {
          const updated = [...prev];
          if (updated[idx]) {
            updated[idx] = { ...updated[idx], imageGenerating: false };
          }
          return updated;
        });
      }
    } finally {
      delete imageAbortControllersRef.current[idx];
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

  const handlePrint = () => {
    setShowPrintConfigModal(false);
    setTimeout(() => window.print(), 300);
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    const updated = [...generatedQuestions];
    (updated[idx] as any)[field] = value;
    setGeneratedQuestions(updated);
    if (field === "correctAnswer" && value && String(value).trim()) {
      if (highlightedQuestionIdx === idx) {
        setHighlightedQuestionIdx(null);
        setValidationError(null);
      }
    }
  };
  const updateOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...generatedQuestions];
    const prevVal = updated[qIdx].options[optIdx];
    const isOldCorrect = updated[qIdx].correctAnswer === prevVal;
    updated[qIdx].options[optIdx] = val;
    if (isOldCorrect) {
      updated[qIdx].correctAnswer = val;
    }
    setGeneratedQuestions(updated);
  };
  const removeQuestion = (idx: number) =>
    setGeneratedQuestions(generatedQuestions.filter((_, i) => i !== idx));

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
      explanation: "",
    });
  };

  const saveNewQuestion = () => {
    if (!newQuestionForm) return;
    if (!newQuestionForm.question.trim()) {
      setNewQuestionError("Please enter the question text.");
      return;
    }

    if (
      newQuestionForm.type === "multiple_choice" ||
      newQuestionForm.type === "diagram_mcq"
    ) {
      if (newQuestionForm.options.some((opt: string) => !opt.trim())) {
        setNewQuestionError(
          "Please fill out all option fields for multiple choice questions.",
        );
        return;
      }
      if (!newQuestionForm.correctAnswer.trim()) {
        setNewQuestionError("Please select a correct answer.");
        return;
      }
    } else if (newQuestionForm.type === "true_false") {
      if (!newQuestionForm.correctAnswer.trim()) {
        setNewQuestionError(
          "Please select the correct option (True or False).",
        );
        return;
      }
    } else if (
      newQuestionForm.type === "short_answer" ||
      newQuestionForm.type === "diagram_short_answer"
    ) {
      if (!newQuestionForm.correctAnswer.trim()) {
        setNewQuestionError("Please enter the correct answer.");
        return;
      }
    }

    const newQs = [
      ...generatedQuestions,
      {
        id: Date.now().toString(),
        type: newQuestionForm.type,
        question: newQuestionForm.question.trim(),
        options:
          newQuestionForm.type === "multiple_choice" ||
          newQuestionForm.type === "diagram_mcq"
            ? newQuestionForm.options.map((o: string) => o.trim())
            : newQuestionForm.type === "true_false"
              ? ["True", "False"]
              : [],
        correctAnswer: newQuestionForm.correctAnswer.trim(),
        explanation: (newQuestionForm.explanation || "").trim(),
        imageUrl: newQuestionForm.imageUrl,
        imagePending: newQuestionForm.imagePending,
      },
    ];

    setGeneratedQuestions(newQs);
    setNewQuestionForm(null);
    setNewQuestionError(null);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      <div className="no-print">
        <h2 className="text-3xl font-black text-gray-900">
          AI Question Bank Generator
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Upload course syllabi, textbooks, or notes. Gemini AI parses the
          document and builds a custom exam.
        </p>
      </div>

      <div
        className="grid lg:grid-cols-5 gap-8 items-start"
        style={formHeight ? { height: `${formHeight}px` } : undefined}
      >
        {/* LEFT: Config Panel */}
        <div className="lg:col-span-2 space-y-6 no-print">
          <form ref={formRef} onSubmit={handleGenerate} className="space-y-6">
            {/* Generation Mode Selector */}
            <div className="bg-white/80 border border-gray-200 shadow-sm backdrop-blur-sm p-5 space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                Generation Mode
              </label>
              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1 border border-gray-200">
                {[
                  { id: "pdf_only", label: "PDF Only", icon: FileText },
                  { id: "pdf_context", label: "PDF + Context", icon: Zap },
                  { id: "text_only", label: "Text Only", icon: Sliders },
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
                    <h3 className="text-sm font-bold text-gray-900">
                      Source Documents
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold">
                    {files.length} uploaded
                  </span>
                </div>

                {/* 3-Option Radio Selector for PDF Classification */}
                <div className="space-y-1.5 pb-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-700 block">
                    PDF Content Classification
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {[
                      {
                        id: "syllabus",
                        label: "Syllabus",
                        desc: "Extract content & generate questions via AI",
                      },
                      {
                        id: "question_paper_with_answers",
                        label: "Question Paper with Answers",
                        desc: "Direct parser; extracts questions, options & answers",
                      },
                      {
                        id: "question_paper_without_answers",
                        label: "Question Paper without Answers",
                        desc: "Direct parser; extracts questions & options only",
                      },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`p-2.5 border rounded-none flex flex-col cursor-pointer transition-all ${
                          pdfClassification === opt.id
                            ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 text-blue-900"
                            : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="teacherPdfClassification"
                            value={opt.id}
                            checked={pdfClassification === opt.id}
                            onChange={() => setPdfClassification(opt.id as any)}
                            className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="font-bold text-xs">{opt.label}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 ml-5 leading-tight">
                          {opt.desc}
                        </p>
                      </label>
                    ))}
                  </div>
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
                    <p className="font-bold text-gray-700 text-sm">
                      Click or drag files here
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      PDF, DOCX, or TXT (Supports multiple)
                    </p>
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
                          <FileText
                            size={13}
                            className="text-blue-600 shrink-0"
                          />
                          <span className="font-bold text-blue-600 truncate">
                            {f.name}
                          </span>
                          <span className="text-[9px] text-gray-400 shrink-0">
                            ({(f.size / 1024).toFixed(1)} KB)
                          </span>
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
                  <h3 className="text-sm font-bold text-gray-900">
                    Contextual Instructions
                  </h3>
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

            {/* Target Alignment Options Accordion - Only shown for Syllabus / AI text generation */}
            {generationMode !== "text_only" &&
              pdfClassification === "syllabus" && (
                <div className="bg-white/80 border border-gray-200 shadow-sm backdrop-blur-sm p-6 space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full text-left outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders size={16} className="text-blue-600" />
                      <h3 className="text-sm font-bold text-gray-900">
                        Target Alignment Options
                      </h3>
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
                          <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                            Difficulty
                          </label>
                          <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-600 font-bold"
                          >
                            <option value="mixed">Mixed Difficulty</option>
                            <option value="easy">Easy / Recall</option>
                            <option value="medium">Medium / Conceptual</option>
                            <option value="hard">
                              Hard / Critical Thinking
                            </option>
                          </select>
                        </div>

                        {/* Grade */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                            Grade Level
                          </label>
                          <select
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-600 font-bold"
                          >
                            {[
                              "1st Grade",
                              "2nd Grade",
                              "3rd Grade",
                              "4th Grade",
                              "5th Grade",
                              "6th Grade",
                              "7th Grade",
                              "8th Grade",
                              "9th Grade",
                              "10th Grade",
                              "11th Grade",
                              "12th Grade",
                            ].map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Syllabus */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                            Syllabus / Board
                          </label>
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
                          <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                            Style
                          </label>
                          <select
                            value={assessmentStyle}
                            onChange={(e) => setAssessmentStyle(e.target.value)}
                            className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-600 font-bold"
                          >
                            <option value="standard">Standard Exam</option>
                            <option value="concept_focused">
                              Concept Focused
                            </option>
                            <option value="application_based">
                              Application Based
                            </option>
                            <option value="hots">
                              HOTS (Higher-Order Thinking)
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Topic */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                          Topic / Subject Category
                        </label>
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

            {/* Config Panel: Direct Extraction Mode Notice OR AI Parameter Controls */}
            {generationMode !== "text_only" &&
            pdfClassification !== "syllabus" ? (
              <div className="bg-blue-50/70 border border-blue-200 p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">
                    Direct Question Paper Extraction Mode
                  </h3>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                  The engine will automatically extract the{" "}
                  <strong>exact total number of questions</strong> and{" "}
                  <strong>exact original formats</strong> (MCQ, True/False,
                  Short Answer, Diagram Questions, etc.) directly from your PDF.
                  Question count and format filters are bypassed.
                </p>
                <div className="pt-1 flex items-center gap-2 text-[10px] text-blue-700 font-bold">
                  <CheckCircle size={13} className="text-blue-600" />
                  <span>
                    {pdfClassification === "question_paper_with_answers"
                      ? "Extracting questions + answer keys + embedded diagrams"
                      : "Extracting questions + options + embedded diagrams"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 border border-gray-200 shadow-sm backdrop-blur-sm p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Sliders size={16} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-gray-900">
                    Generator Configuration
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Number of Questions
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={numQuestions}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val))
                            setNumQuestions(Math.min(Math.max(val, 1), 100));
                        }}
                        className="w-16 text-center border border-gray-300 font-extrabold text-sm py-0.5 px-1 bg-white text-gray-900 outline-none focus:border-blue-600"
                      />
                      <span className="text-xs font-bold text-gray-400">
                        / 100
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={1}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                    <span>5</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[5, 10, 20, 30, 50, 75, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNumQuestions(preset)}
                        className={`px-2 py-0.5 text-[10px] font-bold border transition-all ${
                          numQuestions === preset
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Question Types
                  </label>
                  {[
                    { key: "multiple_choice", label: "Multiple Choice (MCQ)" },
                    { key: "true_false", label: "True / False" },
                    { key: "short_answer", label: "Short Answer Prompts" },
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
                    <label
                      key={key}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div
                        onClick={() =>
                          setQuestionTypes({
                            ...questionTypes,
                            [key]: !(questionTypes as any)[key],
                          })
                        }
                        className={`h-5 w-5 border-2 flex items-center justify-center transition-all cursor-pointer ${
                          (questionTypes as any)[key]
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-300 bg-transparent"
                        }`}
                      >
                        {(questionTypes as any)[key] && (
                          <CheckCircle size={12} className="text-white" />
                        )}
                      </div>
                      <span className="text-xs text-gray-700 group-hover:text-gray-900 transition-colors flex-1">
                        {label}
                      </span>
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
            )}

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
                (generationMode === "pdf_context" &&
                  (files.length === 0 || !contextText.trim())) ||
                (generationMode === "text_only" && !contextText.trim())
              }
              className="w-full bg-brand-red hover:bg-[#b01f1f] disabled:opacity-50 disabled:cursor-not-allowed py-4 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm text-white animate-in cursor-pointer"
            >
              {generatorLoading ? (
                <>
                  <LoaderIcon size={16} className="animate-spin text-white" />
                  {generationMode !== "text_only" &&
                  pdfClassification !== "syllabus"
                    ? "Parsing Question Paper PDF..."
                    : generationMode === "text_only"
                      ? "Generating Questions..."
                      : "Processing Documents..."}
                </>
              ) : (
                <>
                  {generationMode !== "text_only" &&
                  pdfClassification !== "syllabus" ? (
                    <>
                      <FileText size={16} />
                      Extract Questions From Paper
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      Execute Gemini Generator
                    </>
                  )}
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT: Generated Questions Preview */}
        <div className="lg:col-span-3 space-y-6 print-page relative h-full overflow-y-auto custom-scrollbar bg-white/20 border border-gray-200 rounded-none px-6 pb-6 space-y-4 shadow-sm backdrop-blur-sm">
          {/* Print Watermark */}
          <div className="print-watermark-container">
            <img
              src="/images/ACHARIYA-lOGO-OUTLINE-01.png"
              className="print-watermark-image"
              alt="Watermark"
            />
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
                  <span className="block font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                    Date
                  </span>
                  <span className="text-slate-900 font-extrabold text-[11px] mt-0.5 block">
                    {printConfig.date}
                  </span>
                </div>

                {/* Center Column: Title, and Subject & Lesson below */}
                <div className="text-center space-y-1">
                  <h1 className="text-xl font-black tracking-tight uppercase text-black leading-tight">
                    {printConfig.assessmentName}
                  </h1>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wide">
                    {printConfig.subject}
                    {printConfig.lesson ? ` · ${printConfig.lesson}` : ""}
                  </p>
                </div>

                {/* Right Column: Duration */}
                <div className="text-right text-slate-700">
                  <span className="block font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                    Duration
                  </span>
                  <span className="text-slate-900 font-extrabold text-[11px] mt-0.5 block">
                    {printConfig.duration}
                  </span>
                </div>
              </div>

              <div className="mt-6 text-[10px] text-slate-500 italic leading-relaxed border-l-2 border-slate-300 pl-3">
                Instructions: Read all questions carefully. Select the most
                appropriate option or provide a clear and concise response in
                the designated spaces.
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
                    {printConfig.subject}
                    {printConfig.lesson ? ` · ${printConfig.lesson}` : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-bold text-black uppercase tracking-wider">
                    Achariya Educator Platform
                  </p>
                  <p className="mt-0.5">{printConfig.date}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-black">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">
                    Subject Category
                  </span>
                  <span className="text-slate-800 font-extrabold text-[11px] mt-0.5 block">
                    {printConfig.subject || "General"}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">
                    Duration Allowance
                  </span>
                  <span className="text-slate-800 font-extrabold text-[11px] mt-0.5 block">
                    {printConfig.duration}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">
                    Difficulty Level
                  </span>
                  <span className="text-slate-800 font-extrabold text-[11px] mt-0.5 block uppercase">
                    {difficulty}
                  </span>
                </div>
              </div>

              <div className="mt-6 text-[10px] text-slate-500 italic leading-relaxed border-l-2 border-slate-300 pl-3">
                Instructions: Read all questions carefully. Select the most
                appropriate option or provide a clear and concise response in
                the designated spaces.
              </div>
            </div>
          )}

          <div className="flex items-center justify-end no-print border-b absolute border-gray-200 py-4 sticky bg-white z-10">
            {generatedQuestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 border border-gray-300 transition-all cursor-pointer"
                >
                  <Plus size={12} /> Add Question
                </button>

                <button
                  type="button"
                  onClick={() => openPrintModal("print")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-750 px-4 py-2 rounded-none text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={12} /> Print Exam
                </button>

                <button
                  type="button"
                  onClick={() => openPrintModal("pdf")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-emerald-600 px-4 py-2 rounded-none text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileDown size={12} /> Export PDF
                </button>

                <button
                  type="button"
                  onClick={handleDiscardAssessment}
                  className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-650 px-4 py-2 rounded-none text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Trash2 size={12} /> Discard
                </button>

                <button
                  type="button"
                  onClick={() => openSaveModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-none text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save size={12} /> Save Assessment
                </button>
              </div>
            )}
          </div>

          {generatorLoading ? (
            <div className="bg-white border border-gray-200 rounded-none p-16 text-center text-gray-500 h-1/2 flex flex-col items-center justify-start space-y-6 no-print shadow-sm min-h-[350px]">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <TimerIcon />
                <span className="text-gray-900 font-extrabold">
                  Please Wait, It May Take Few Minutes...
                </span>
              </h3>
              <Loader
                variant="inline"
                message="Formulating questions..."
                className="scale-150 py-8"
              />
              <div className="space-y-2 max-w-md">
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 animate-pulse flex items-end mx-auto justify-center gap-1">
                  <Lightbulb size={18} /> Did you know?
                </p>
                <p className="text-xs text-gray-700 leading-relaxed font-bold italic text-center">
                  "{currentFact}"
                </p>
              </div>
            </div>
          ) : generatorError ? (
            <div className="bg-white border border-red-200 p-12 text-center space-y-5 no-print shadow-sm">
              <div className="h-16 w-16 bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-base font-extrabold text-gray-900">
                  Question Generation Failed
                </h3>
                <p className="text-xs text-red-700 font-semibold leading-relaxed bg-red-50 p-4 border border-red-200 break-words">
                  {generatorError}
                </p>
                <p className="text-[11px] text-gray-500">
                  Please adjust the question count, syllabus parameters, or
                  contextual instructions and try again.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setGeneratorError(null);
                    formRef.current?.requestSubmit();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 shadow-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw size={13} />
                  <span>Retry Generation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGeneratorError(null)}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold px-4 py-2.5 shadow-sm transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : generatedQuestions.length === 0 ? (
            <div className="bg-white/65 border border-dashed border-gray-300 h-full flex flex-col items-center justify-center p-8 text-center gap-4 text-gray-400 backdrop-blur-sm shadow-sm">
              <div className="h-16 w-16 bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                <Zap size={32} className="text-gray-400 animate-pulse" />
              </div>
              <div>
                <p className="font-black text-gray-700 text-base">
                  {generationMode === "pdf_only" && "Upload documents to begin"}
                  {generationMode === "pdf_context" &&
                    "Upload documents & add instructions"}
                  {generationMode === "text_only" &&
                    "Provide text instructions to generate"}
                </p>
                <p className="text-xs text-gray-500 max-w-[280px] mx-auto mt-2">
                  {generationMode === "pdf_only" &&
                    "Gemini AI will extract key syllabus facts and build your comprehensive exam bank."}
                  {generationMode === "pdf_context" &&
                    "Combine reference literature with your specific focal points and page ranges."}
                  {generationMode === "text_only" &&
                    "Standalone AI generation tailored by syllabus, difficulty, grade, and topic."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* New Question Draft Form at the top */}
              {newQuestionForm && (
                <div className="bg-white border border-blue-200 p-5 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-600">
                      Draft New Question
                    </span>
                    <button
                      onClick={() => {
                        setNewQuestionForm(null);
                        setNewQuestionError(null);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                    {/* Question Type Options */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                        Question Type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { val: "multiple_choice", label: "Multiple Choice" },
                          { val: "true_false", label: "True / False" },
                          { val: "short_answer", label: "Short Answer" },
                          { val: "diagram_mcq", label: "Diagram MCQ" },
                          {
                            val: "diagram_short_answer",
                            label: "Diagram Short Answer",
                          },
                        ].map((t) => (
                          <button
                            key={t.val}
                            type="button"
                            onClick={() => {
                              setNewQuestionForm({
                                ...newQuestionForm,
                                type: t.val,
                                options:
                                  t.val === "multiple_choice" ||
                                  t.val === "diagram_mcq"
                                    ? ["", "", "", ""]
                                    : t.val === "true_false"
                                      ? ["True", "False"]
                                      : [],
                                correctAnswer:
                                  t.val === "true_false" ? "True" : "",
                                imageUrl: isDiagramType(t.val)
                                  ? newQuestionForm.imageUrl
                                  : undefined,
                                imagePending: isDiagramType(t.val)
                                  ? newQuestionForm.imagePending
                                  : false,
                              });
                              setNewQuestionError(null);
                            }}
                            className={`px-3 py-1.5 text-xs font-bold border transition-all ${
                              newQuestionForm.type === t.val
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-gray-50 border-gray-200 text-gray-650 hover:text-gray-900"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>{" "}
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                      Question Text
                    </label>
                    <textarea
                      value={newQuestionForm.question}
                      onChange={(e) =>
                        setNewQuestionForm({
                          ...newQuestionForm,
                          question: e.target.value,
                        })
                      }
                      placeholder="Type the question..."
                      rows={2}
                      className="w-full bg-white border border-gray-300 px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-blue-600 resize-none"
                    />
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
                          <UploadCloud size={20} className="text-violet-400" />
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

                  {/* Options & Correct Answer fields based on type */}
                  {(newQuestionForm.type === "multiple_choice" ||
                    newQuestionForm.type === "diagram_mcq") && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                        Options
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {newQuestionForm.options.map(
                          (opt: string, optIdx: number) => (
                            <div
                              key={optIdx}
                              className="flex items-center gap-2"
                            >
                              <span className="text-xs font-bold text-blue-600">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <input
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...newQuestionForm.options];
                                  newOpts[optIdx] = e.target.value;
                                  setNewQuestionForm({
                                    ...newQuestionForm,
                                    options: newOpts,
                                  });
                                }}
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-600"
                              />
                            </div>
                          ),
                        )}
                      </div>

                      <div className="space-y-1.5 mt-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 font-bold">
                          Correct Answer
                        </label>
                        <select
                          value={newQuestionForm.correctAnswer}
                          onChange={(e) =>
                            setNewQuestionForm({
                              ...newQuestionForm,
                              correctAnswer: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-600"
                        >
                          <option value="">Select Correct Option</option>
                          {newQuestionForm.options.map(
                            (opt: string, optIdx: number) => {
                              const label =
                                opt.trim() ||
                                `Option ${String.fromCharCode(65 + optIdx)}`;
                              return (
                                <option key={optIdx} value={opt}>
                                  {String.fromCharCode(65 + optIdx)}. {label}
                                </option>
                              );
                            },
                          )}
                        </select>
                      </div>
                    </div>
                  )}

                  {newQuestionForm.type === "true_false" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                        Correct Answer
                      </label>
                      <div className="flex gap-4">
                        {["True", "False"].map((val) => (
                          <label
                            key={val}
                            className="flex items-center gap-2 cursor-pointer text-xs text-gray-700"
                          >
                            <input
                              type="radio"
                              name="gen_tf_answer"
                              value={val}
                              checked={newQuestionForm.correctAnswer === val}
                              onChange={() =>
                                setNewQuestionForm({
                                  ...newQuestionForm,
                                  correctAnswer: val,
                                })
                              }
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
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                        Correct Answer Solution
                      </label>
                      <input
                        value={newQuestionForm.correctAnswer}
                        onChange={(e) =>
                          setNewQuestionForm({
                            ...newQuestionForm,
                            correctAnswer: e.target.value,
                          })
                        }
                        placeholder="Enter the expected correct answer..."
                        className="w-full bg-white border border-gray-300 px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-600"
                      />
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                      Explanation / Reasoning (Optional)
                    </label>
                    <textarea
                      value={newQuestionForm.explanation || ""}
                      onChange={(e) =>
                        setNewQuestionForm({
                          ...newQuestionForm,
                          explanation: e.target.value,
                        })
                      }
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
                      onClick={() => {
                        setNewQuestionForm(null);
                        setNewQuestionError(null);
                      }}
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

              {/* Unassigned Diagrams Tray */}
              {unassignedImages.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 p-4 space-y-3 no-print">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-amber-600" />
                      <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                        Unassigned Diagrams ({unassignedImages.length})
                      </h4>
                    </div>
                    <span className="text-[10px] text-amber-700 font-bold">
                      Extracted from PDF but not automatically linked
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {unassignedImages.map((uImg, uIdx) => (
                      <div
                        key={uImg.id || uIdx}
                        className="bg-white border border-amber-200 p-2 space-y-2"
                      >
                        <img
                          src={uImg.url}
                          alt={`Unassigned Diagram ${uIdx + 1}`}
                          className="w-full h-24 object-contain bg-gray-50 border border-gray-100"
                        />
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] text-gray-500 font-bold">
                            Page {uImg.pageNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImageForReassign({ url: uImg.url });
                              setTargetQuestionForReassign(0);
                              setShowReassignModal(true);
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2 py-1 cursor-pointer transition-colors shadow-sm"
                          >
                            Assign to Q
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validationError && (
                <div className="bg-red-50 border-2 border-red-500 p-4 text-xs text-red-800 font-bold flex items-center justify-between gap-3 no-print shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={18} className="text-red-600 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValidationError(null)}
                    className="text-red-500 hover:text-red-700 font-extrabold cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {generatedQuestions.map((q, idx) => (
                <div
                  id={`question-card-${idx}`}
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
                  className={`p-5 space-y-3 relative transition-all shadow-sm print:bg-white print:border-gray-300 print:text-black print:shadow-none print:p-4 print:mb-4 print:page-break-inside-avoid ${
                    highlightedQuestionIdx === idx
                      ? "bg-red-50/50 border-2 border-red-500 ring-4 ring-red-400/30 animate-pulse shadow-md"
                      : "bg-white/80 border border-gray-200 hover:border-blue-500/40"
                  }`}
                >
                  {highlightedQuestionIdx === idx && (
                    <div className="bg-red-600 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between gap-2 shadow-sm no-print">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle size={14} />
                        <span>Action Required: Please configure the Correct Answer for Question #{idx + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHighlightedQuestionIdx(null)}
                        className="text-white hover:text-red-200 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 no-print">
                    <div className="flex items-center gap-2">
                      <div
                        className="cursor-move p-1 text-gray-400 hover:text-gray-700"
                        title="Drag to reorder"
                      >
                        <GripVertical size={14} />
                      </div>
                      <span className="h-6 w-6 bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex-1">
                      {q.type.replace(/_/g, " ")}
                    </span>
                    {q.requiresReview && (
                      <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-none mr-2">
                        Needs Review
                      </span>
                    )}
                    {(isDiagramType(q.type) ||
                      q.imageUrl ||
                      (q.images && q.images.length > 0)) && (
                      <span className="text-[9px] font-black uppercase bg-violet-100 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded-none mr-2">
                        Diagram
                      </span>
                    )}
                    <button
                      onClick={() => removeQuestion(idx)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Diagram image section */}
                  {(isDiagramType(q.type) ||
                    q.imageUrl ||
                    (q.images && q.images.length > 0)) && (
                    <div className="space-y-2 print:hidden">
                      {q.imageGenerating ? (
                        <div className="h-44 bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 border border-violet-200 rounded-none flex flex-col items-center justify-center gap-3 p-4">
                          <div className="flex items-center gap-2">
                            <ImageIcon
                              size={24}
                              className="text-violet-500 animate-bounce"
                            />
                            <p className="text-xs text-violet-800 font-bold">
                              Generating educational diagram with AI...
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCancelImageGeneration(idx)}
                            className="bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-none shadow-sm cursor-pointer flex items-center gap-1.5 transition-colors"
                          >
                            <X size={13} /> Cancel & Upload Manually
                          </button>
                        </div>
                      ) : (q.imageUrl || (q.images && q.images.length > 0)) &&
                        !editingImageIdx[idx] ? (
                        <div className="space-y-2">
                          {(q.images && q.images.length > 0
                            ? q.images
                            : [q.imageUrl!]
                          ).map((imgSrc, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="relative group border border-gray-200 bg-gray-50 p-1"
                            >
                              <img
                                src={imgSrc}
                                alt={`Diagram for question ${idx + 1}`}
                                className="w-full max-h-56 object-contain"
                              />
                              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedImageForReassign({
                                      url: imgSrc,
                                      fromQIdx: idx,
                                    });
                                    setTargetQuestionForReassign(idx);
                                    setShowReassignModal(true);
                                  }}
                                  className="bg-white border border-gray-300 text-blue-600 hover:bg-blue-50 px-2 py-1 text-[10px] font-bold shadow-sm cursor-pointer"
                                  title="Reassign to another question"
                                >
                                  Reassign
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGeneratedQuestions((prev) => {
                                      const updated = [...prev];
                                      const curQ = { ...updated[idx] };
                                      curQ.images = (curQ.images || []).filter(
                                        (u) => u !== imgSrc,
                                      );
                                      if (curQ.imageUrl === imgSrc) {
                                        curQ.imageUrl =
                                          curQ.images[0] || undefined;
                                      }
                                      updated[idx] = curQ;
                                      return updated;
                                    });
                                    setUnassignedImages((prev) => [
                                      ...prev,
                                      {
                                        id: `temp-img-${Date.now()}`,
                                        url: imgSrc,
                                        pageNumber: 1,
                                      },
                                    ]);
                                  }}
                                  className="bg-white border border-gray-300 text-red-600 hover:bg-red-50 p-1 shadow-sm cursor-pointer"
                                  title="Detach image"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-violet-300 p-5 flex flex-col gap-3 bg-violet-50/15">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <div className="flex items-center gap-1.5">
                              <ImageIcon
                                size={20}
                                className="text-violet-500"
                              />
                              <p className="text-xs text-violet-800 font-bold">
                                {q.imageUrl
                                  ? "Modify Diagram Image"
                                  : "Diagram Image Required"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!q.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleRegenerateImage(idx)}
                                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-2.5 py-1 rounded-none flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                >
                                  <Zap size={12} /> Generate with AI
                                </button>
                              )}
                              {q.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingImageIdx((prev) => ({
                                      ...prev,
                                      [idx]: false,
                                    }))
                                  }
                                  className="text-[10px] uppercase font-black tracking-wider text-red-650 hover:text-red-855 transition-colors cursor-pointer font-bold"
                                >
                                  Cancel Edit
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-wider text-gray-500 block font-bold">
                              Upload image from device or paste image link
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Paste image link (starts with http/https)..."
                                value={
                                  q.imageUrl && !q.imageUrl.startsWith("data:")
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
                                className="bg-white border border-gray-300 text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-1.5 rounded-none shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-bold transition-all"
                                title="Upload custom image"
                              >
                                <UploadCloud
                                  size={14}
                                  className="text-blue-600"
                                />
                                <span>Browse File</span>
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

                  {/* Print-only Question Number and Type */}
                  <div className="hidden print:flex items-center gap-2 mb-2 text-black">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Question {idx + 1} · {q.type.replace("_", " ")}
                    </span>
                  </div>

                  <textarea
                    value={q.question}
                    onChange={(e) =>
                      updateQuestion(idx, "question", e.target.value)
                    }
                    rows={2}
                    className="w-full bg-white border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-blue-600 resize-none print:hidden"
                  />
                  <p className="hidden print:block text-sm font-bold text-slate-900 leading-relaxed">
                    {q.question}
                  </p>

                  {q.imageUrl &&
                    !q.imageGenerating &&
                    isDiagramType(q.type) && (
                      <img
                        src={q.imageUrl}
                        alt={`Diagram ${idx + 1}`}
                        className="max-h-48 object-contain border border-gray-200 my-2 hidden print:block"
                      />
                    )}

                  {(q.type === "multiple_choice" || q.type === "diagram_mcq") &&
                    q.options?.length > 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-2 print:hidden">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className="flex items-center gap-2"
                            >
                              <span className="text-[10px] font-black text-blue-600 shrink-0">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <input
                                value={opt}
                                onChange={(e) =>
                                  updateOption(idx, optIdx, e.target.value)
                                }
                                className="w-full bg-white border border-gray-200 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-blue-600"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="hidden print:grid grid-cols-2 gap-4 mt-2 text-black">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className="flex items-start gap-2 text-xs"
                            >
                              <span className="font-extrabold text-slate-700">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span className="text-slate-800">{opt}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                  {/* Correct Answer and Explanation print wrapper */}
                  <div
                    className={`space-y-2 mt-3 ${!printConfig.includeAnswers ? "print:hidden" : ""}`}
                  >
                    {/* Screen edit controls (hidden on print) */}
                    <div className="space-y-1.5 print:hidden">
                      <label className="text-[9px] font-black uppercase tracking-wider text-blue-600 block">
                        Correct Answer
                      </label>
                      {(q.type === "multiple_choice" || q.type === "diagram_mcq" || (q.options && q.options.length > 0 && q.type !== "true_false")) ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {q.options.map((opt, optIdx) => {
                            const letter = String.fromCharCode(65 + optIdx);
                            const ca = (q.correctAnswer || "").trim();
                            const isSelected =
                              Boolean(ca) && (
                                ca.toLowerCase() === opt.trim().toLowerCase() ||
                                ca.toUpperCase() === letter ||
                                ca.startsWith(`${letter})`) ||
                                ca.startsWith(`${letter}.`) ||
                                ca.startsWith(`(${letter})`)
                              );

                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-2 p-2 border cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-green-50 border-green-500 text-green-900 font-bold ring-1 ring-green-400"
                                    : "bg-white border-gray-200 text-gray-700 hover:border-blue-400"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`t_q_${idx}_correctAnswer`}
                                  value={opt || letter}
                                  checked={isSelected}
                                  onChange={() =>
                                    updateQuestion(idx, "correctAnswer", opt || letter)
                                  }
                                  className="accent-green-600 cursor-pointer"
                                />
                                <span className="text-xs truncate">
                                  <span className="font-extrabold">{letter}.</span>{" "}
                                  {opt ? (opt.length > 25 ? opt.slice(0, 25) + "…" : opt) : `Option ${letter}`}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      ) : q.type === "true_false" ? (
                        <div className="flex gap-4">
                          {["True", "False"].map((val) => {
                            const isSelected =
                              (q.correctAnswer || "").trim().toLowerCase() === val.toLowerCase();
                            return (
                              <label
                                key={val}
                                className={`flex items-center gap-2 px-3 py-1.5 border cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-green-50 border-green-500 text-green-900 font-bold ring-1 ring-green-400"
                                    : "bg-white border-gray-200 text-gray-700 hover:border-blue-400"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`t_q_${idx}_correctAnswer`}
                                  value={val}
                                  checked={isSelected}
                                  onChange={() =>
                                    updateQuestion(idx, "correctAnswer", val)
                                  }
                                  className="accent-green-600 cursor-pointer"
                                />
                                <span className="text-xs font-semibold">{val}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={q.correctAnswer}
                          onChange={(e) =>
                            updateQuestion(idx, "correctAnswer", e.target.value)
                          }
                          placeholder="Enter expected correct answer..."
                          className="w-full bg-green-50/50 border border-green-200 px-3 py-1.5 text-xs text-blue-800 outline-none focus:border-blue-600"
                        />
                      )}
                    </div>

                    {q.explanation !== undefined && (
                      <div className="space-y-1.5 print:hidden">
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                          Explanation
                        </label>
                        <textarea
                          value={q.explanation}
                          onChange={(e) =>
                            updateQuestion(idx, "explanation", e.target.value)
                          }
                          rows={2}
                          className="w-full bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs text-gray-600 outline-none focus:border-blue-600 resize-none italic"
                        />
                      </div>
                    )}

                    {/* Print-only Answers & Explanations */}
                    <div className="hidden print:block p-3 bg-slate-50 border border-slate-200 rounded-none space-y-1.5 text-xs text-black">
                      <p className="font-extrabold text-emerald-700">
                        ✔ Correct Answer:{" "}
                        <span className="text-slate-950 font-black">
                          {q.correctAnswer}
                        </span>
                      </p>
                      {q.explanation && (
                        <p className="text-[11px] text-slate-600 italic leading-relaxed">
                          <span className="font-bold uppercase text-[9px] tracking-wider not-italic text-slate-500 block mb-0.5">
                            Explanation / Reasoning
                          </span>
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Last Page PDF Footer / Generated By Sign */}
              {activePrintMode === "pdf" &&
                printConfig.generatedBy &&
                printConfig.generatedBy.trim() !== "" && (
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
                <h3 className="text-xl font-bold text-gray-900">
                  Save Assessment
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Commit assessment details to database
                </p>
              </div>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-2 hover:bg-gray-100 rounded-none text-gray-500 cursor-pointer"
              >
                <X size={16} />
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

            <form onSubmit={handleSaveAssessment} className="space-y-4">
              {/* Assessment Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">
                  Assessment Name
                </label>
                <input
                  type="text"
                  required
                  value={printConfig.assessmentName}
                  onChange={(e) =>
                    setPrintConfig({
                      ...printConfig,
                      assessmentName: e.target.value,
                    })
                  }
                  placeholder="e.g. Chapter 3 Biology Quiz"
                  className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                />
              </div>

              {/* School Name select dropdown */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">
                  School Name
                </label>
                <select
                  value={printConfig.schoolName}
                  onChange={(e) =>
                    setPrintConfig({
                      ...printConfig,
                      schoolName: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                >
                  <option value="ACHARIYA WORLD CLASS EDUCATION">
                    ACHARIYA WORLD CLASS EDUCATION
                  </option>
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
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={printConfig.subject}
                    onChange={(e) =>
                      setPrintConfig({
                        ...printConfig,
                        subject: e.target.value,
                      })
                    }
                    placeholder="e.g. Biology"
                    className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block flex justify-between">
                    <span>Lesson</span>
                    <span className="text-[8px] text-gray-400 font-normal">
                      Optional
                    </span>
                  </label>
                  <input
                    type="text"
                    value={printConfig.lesson}
                    onChange={(e) =>
                      setPrintConfig({ ...printConfig, lesson: e.target.value })
                    }
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
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">
                      Date
                    </label>
                    <input
                      type="text"
                      required
                      value={printConfig.date}
                      onChange={(e) =>
                        setPrintConfig({ ...printConfig, date: e.target.value })
                      }
                      placeholder="e.g. 21/05/2026"
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">
                      Day
                    </label>
                    <input
                      type="text"
                      required
                      value={printConfig.day}
                      onChange={(e) =>
                        setPrintConfig({ ...printConfig, day: e.target.value })
                      }
                      placeholder="e.g. Thursday"
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                </div>

                {/* Right Column: Grade & Duration Stack */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">
                      Grade
                    </label>
                    <input
                      type="text"
                      required
                      value={printConfig.grade}
                      onChange={(e) =>
                        setPrintConfig({
                          ...printConfig,
                          grade: e.target.value,
                        })
                      }
                      placeholder="e.g. 5th Grade"
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block">
                      Duration
                    </label>
                    <input
                      type="text"
                      required
                      value={printConfig.duration}
                      onChange={(e) =>
                        setPrintConfig({
                          ...printConfig,
                          duration: e.target.value,
                        })
                      }
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
                  <span className="text-[8px] text-gray-400 font-normal">
                    Optional
                  </span>
                </label>
                <input
                  type="text"
                  value={printConfig.generatedBy}
                  onChange={(e) =>
                    setPrintConfig({
                      ...printConfig,
                      generatedBy: e.target.value,
                    })
                  }
                  placeholder="e.g. Mr. Rajesh Kumar"
                  className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                />
              </div>

              {/* Visibility Scope */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-none">
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    Visibility Scope
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Public = visible to all activated teachers
                  </p>
                </div>
                <div className="flex gap-3">
                  {[
                    { val: false, label: "Private" },
                    { val: true, label: "Public" },
                  ].map(({ val, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        setSaveForm({ ...saveForm, isPublic: val })
                      }
                      className={`px-3 py-1.5 rounded-none text-[11px] font-bold border transition-all ${
                        saveForm.isPublic === val
                          ? "bg-blue-600 border-blue-600 text-white cursor-pointer"
                          : "bg-white border-gray-300 text-gray-700 cursor-pointer"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {saveError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {saveError}
                </p>
              )}

              <button
                type="submit"
                disabled={saveLoading}
                className="w-full bg-brand-red hover:bg-brand-red/90 disabled:opacity-50 py-3.5 rounded-none font-bold text-sm flex items-center justify-center gap-2 transition-all text-white cursor-pointer"
              >
                {saveLoading ? (
                  <>
                    <LoaderIcon size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save to Database
                  </>
                )}
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
                  {activePrintMode === "pdf"
                    ? "Export Assessment as PDF"
                    : "Print Assessment Exam"}
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Configure exam print layout fields
                </p>
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
                  { label: "With Answer Key", value: true },
                ].map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() =>
                      setPrintConfig({ ...printConfig, includeAnswers: value })
                    }
                    type="button"
                    className={`py-2.5 px-4 rounded-none border text-center font-bold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      printConfig.includeAnswers === value
                        ? "bg-blue-50 border-blue-600 text-blue-600 shadow-sm"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <CheckCircle
                      size={12}
                      className={
                        printConfig.includeAnswers === value
                          ? "opacity-100"
                          : "opacity-0"
                      }
                    />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Fields Grid */}
            <div className="space-y-4">
              {/* Assessment Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">
                  Assessment Name
                </label>
                <input
                  type="text"
                  value={printConfig.assessmentName}
                  onChange={(e) =>
                    setPrintConfig({
                      ...printConfig,
                      assessmentName: e.target.value,
                    })
                  }
                  placeholder="e.g. Chapter 3 Biology Quiz"
                  className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                />
              </div>

              {/* School Name select dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">
                  School Name
                </label>
                <select
                  value={printConfig.schoolName}
                  onChange={(e) =>
                    setPrintConfig({
                      ...printConfig,
                      schoolName: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                >
                  <option value="ACHARIYA WORLD CLASS EDUCATION">
                    ACHARIYA WORLD CLASS EDUCATION
                  </option>
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
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={printConfig.subject}
                    onChange={(e) =>
                      setPrintConfig({
                        ...printConfig,
                        subject: e.target.value,
                      })
                    }
                    placeholder="e.g. Biology"
                    className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block flex justify-between">
                    <span>Lesson</span>
                    <span className="text-[8px] text-gray-400 font-normal">
                      Optional
                    </span>
                  </label>
                  <input
                    type="text"
                    value={printConfig.lesson}
                    onChange={(e) =>
                      setPrintConfig({ ...printConfig, lesson: e.target.value })
                    }
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
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">
                      Date
                    </label>
                    <input
                      type="text"
                      value={printConfig.date}
                      onChange={(e) =>
                        setPrintConfig({ ...printConfig, date: e.target.value })
                      }
                      placeholder="e.g. 21/05/2026"
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">
                      Day
                    </label>
                    <input
                      type="text"
                      value={printConfig.day}
                      onChange={(e) =>
                        setPrintConfig({ ...printConfig, day: e.target.value })
                      }
                      placeholder="e.g. Thursday"
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                </div>

                {/* Right Column: Grade & Duration Stack */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">
                      Grade
                    </label>
                    <input
                      type="text"
                      value={printConfig.grade}
                      onChange={(e) =>
                        setPrintConfig({
                          ...printConfig,
                          grade: e.target.value,
                        })
                      }
                      placeholder="e.g. 5th Grade"
                      className="w-full bg-white border border-gray-300 rounded-none px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={printConfig.duration}
                      onChange={(e) =>
                        setPrintConfig({
                          ...printConfig,
                          duration: e.target.value,
                        })
                      }
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
                  <span className="text-[8px] text-gray-400 font-normal">
                    Optional
                  </span>
                </label>
                <input
                  type="text"
                  value={printConfig.generatedBy}
                  onChange={(e) =>
                    setPrintConfig({
                      ...printConfig,
                      generatedBy: e.target.value,
                    })
                  }
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
                  document={
                    <QuestionBankPDFDocument
                      questions={generatedQuestions}
                      config={printConfig}
                    />
                  }
                  fileName={`${printConfig.assessmentName.replace(/\s+/g, "_") || "Assessment"}_${printConfig.includeAnswers ? "Solutions" : "Questions"}.pdf`}
                  onClick={() => {
                    setTimeout(() => setShowPrintConfigModal(false), 500);
                  }}
                  className="flex-1 bg-brand-red hover:bg-brand-red/90 py-3 rounded-none font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white no-underline text-center cursor-pointer shadow-md shadow-red-600/10"
                >
                  {({ loading, error }) =>
                    loading ? (
                      <>
                        <LoaderIcon size={13} className="animate-spin" />
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
                  }
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

      {/* Reassign Diagram Modal */}
      {showReassignModal && selectedImageForReassign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-gray-900">
                Assign Diagram to Question
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedImageForReassign(null);
                }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <img
                src={selectedImageForReassign.url}
                alt="Selected Diagram"
                className="w-full max-h-48 object-contain bg-gray-50 border border-gray-200"
              />
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                  Select Target Question
                </label>
                <select
                  value={targetQuestionForReassign}
                  onChange={(e) =>
                    setTargetQuestionForReassign(Number(e.target.value))
                  }
                  className="w-full bg-white border border-gray-300 px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-blue-600"
                >
                  {generatedQuestions.map((gq, gIdx) => (
                    <option key={gq.id || gIdx} value={gIdx}>
                      Question {gIdx + 1}: {gq.question.substring(0, 60)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedImageForReassign(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetIdx = targetQuestionForReassign;
                  const imgUrl = selectedImageForReassign.url;
                  setGeneratedQuestions((prev) => {
                    const updated = [...prev];
                    // If moving from an existing question, remove from old question
                    if (selectedImageForReassign.fromQIdx !== undefined) {
                      const fromQ = {
                        ...updated[selectedImageForReassign.fromQIdx],
                      };
                      fromQ.images = (fromQ.images || []).filter(
                        (u) => u !== imgUrl,
                      );
                      if (fromQ.imageUrl === imgUrl) {
                        fromQ.imageUrl = fromQ.images[0] || undefined;
                      }
                      updated[selectedImageForReassign.fromQIdx] = fromQ;
                    }
                    // Add to target question
                    if (updated[targetIdx]) {
                      const targetQ = { ...updated[targetIdx] };
                      targetQ.imageUrl = targetQ.imageUrl || imgUrl;
                      targetQ.images = Array.from(
                        new Set([...(targetQ.images || []), imgUrl]),
                      );
                      targetQ.requiresReview = false;
                      if (targetQ.type === "multiple_choice")
                        targetQ.type = "diagram_mcq";
                      if (targetQ.type === "short_answer")
                        targetQ.type = "diagram_short_answer";
                      updated[targetIdx] = targetQ;
                    }
                    return updated;
                  });
                  // Remove from unassigned images if it was unassigned
                  setUnassignedImages((prev) =>
                    prev.filter((u) => u.url !== imgUrl),
                  );
                  setShowReassignModal(false);
                  setSelectedImageForReassign(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
