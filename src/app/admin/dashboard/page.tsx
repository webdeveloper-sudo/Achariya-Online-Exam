"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  Menu,
  Users,
  UserPlus,
  FileSpreadsheet,
  Search,
  RefreshCw,
  LogOut,
  Edit2,
  Trash2,
  Lock,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Server,
  Plus,
  ShieldCheck,
  ChevronDown,
  Globe,
  BookOpen,
  Clock,
  ArrowLeft,
  Compass,
  Activity,
  Trophy,
  ChevronUp,
  Check,
  X,
  Calendar,
  ShieldAlert,
  Shield,
  BarChart2,
  AlertCircle,
  Mail,
  Phone,
  Award,
  Briefcase,
  User,
  FolderOpen,
  ArrowRight,
  History
} from "lucide-react";
import Loader from "@/components/Loader";

interface Teacher {
  id: string;
  userId: string;
  userName: string;
  joiningDate: string;
  branch: string;
  designation: string;
  subjects: string[];
  qualifications: string;
  gradesInCharge: string[];
  experience: string;
  mobileNo: string;
  email: string;
  status: string;
  activated: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Layout Tab selection
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>("teachers");

  // Original Teacher Onboarding States
  const [activeTab, setActiveTab] = useState<"list" | "create" | "upload">("list");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Platform-wide Assessment States
  const [assessments, setAssessments] = useState<any[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);

  // Platform-wide Live Session States
  const [adminSessions, setAdminSessions] = useState<any[]>([]);
  const [adminSessionsLoading, setAdminSessionsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [selectedSessionLoading, setSelectedSessionLoading] = useState(false);
  const [adminSessionSearchQuery, setAdminSessionSearchQuery] = useState("");
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Recruiter Activities States
  const [recruiterCandidates, setRecruiterCandidates] = useState<any[]>([]);
  const [recruiterCandidatesLoading, setRecruiterCandidatesLoading] = useState(false);
  const [recruiterCandidateSearchQuery, setRecruiterCandidateSearchQuery] = useState("");
  const [selectedRecruiterCandidate, setSelectedRecruiterCandidate] = useState<any>(null);
  const [selectedRecruiterCandidateLoading, setSelectedRecruiterCandidateLoading] = useState(false);
  const [expandedRecruiterCandidateEmail, setExpandedRecruiterCandidateEmail] = useState<string | null>(null);

  const [recruiterSessions, setRecruiterSessions] = useState<any[]>([]);
  const [recruiterSessionsLoading, setRecruiterSessionsLoading] = useState(false);
  const [recruiterSessionSearchQuery, setRecruiterSessionSearchQuery] = useState("");
  const [selectedRecruiterSession, setSelectedRecruiterSession] = useState<any>(null);
  const [selectedRecruiterSessionLoading, setSelectedRecruiterSessionLoading] = useState(false);
  const [expandedRecruiterStudentId, setExpandedRecruiterStudentId] = useState<string | null>(null);

  const [recruiterAssessments, setRecruiterAssessments] = useState<any[]>([]);
  const [recruiterAssessmentsLoading, setRecruiterAssessmentsLoading] = useState(false);
  const [selectedRecruiterAssessment, setSelectedRecruiterAssessment] = useState<any>(null);

  // Manual Form State
  const [formData, setFormData] = useState({
    userId: "",
    userName: "",
    joiningDate: "",
    branch: "",
    designation: "",
    subjects: "",
    qualifications: "",
    gradesInCharge: "",
    experience: "",
    email: "",
    mobileNo: ""
  });

  // Edit / Password Reset States
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState<string | null>(null); // Teacher ID
  const [newPassword, setNewPassword] = useState("");
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);

  // Upload States
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [parsedTeachers, setParsedTeachers] = useState<any[]>([]);
  const [uploadPreviewOpen, setUploadPreviewOpen] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("adminToken");
    const savedUser = localStorage.getItem("adminUser");

    if (!savedToken || !savedUser) {
      router.push("/admin/login");
      return;
    }

    setToken(savedToken);
    setAdminUser(JSON.parse(savedUser));
    fetchTeachers(savedToken);
  }, []);

  const fetchTeachers = async (authToken = token) => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/teachers", {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setTeachers(data.teachers || []);
      } else {
        showMsg("error", data.message || "Failed to load teachers");
      }
    } catch (err) {
      showMsg("error", "Error contacting the server");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAssessments = async (authToken = token) => {
    if (!authToken) return;
    setAssessmentsLoading(true);
    try {
      const res = await fetch("/api/admin/assessments", {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setAssessments(data.assessments || []);
      } else {
        showMsg("error", data.message || "Failed to load assessments");
      }
    } catch (err) {
      showMsg("error", "Error loading platform assessments");
    } finally {
      setAssessmentsLoading(false);
    }
  };

  useEffect(() => {
    if (token && activeSidebarTab === "assessments") {
      fetchAllAssessments(token);
    }
  }, [token, activeSidebarTab]);

  const fetchAdminSessions = async (authToken = token) => {
    if (!authToken) return;
    setAdminSessionsLoading(true);
    try {
      const res = await fetch("/api/admin/live-sessions", {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSessions(data.sessions || []);
      } else {
        showMsg("error", data.message || "Failed to load live sessions");
      }
    } catch (err) {
      showMsg("error", "Error loading platform live sessions");
    } finally {
      setAdminSessionsLoading(false);
    }
  };

  const fetchAdminSessionDetails = async (sessionId: string, authToken = token) => {
    if (!authToken || !sessionId) return;
    setSelectedSessionLoading(true);
    try {
      const res = await fetch(`/api/live/sessions/details/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedSession(data.session);
      } else {
        showMsg("error", data.message || "Failed to load session details");
      }
    } catch (err) {
      showMsg("error", "Error loading detailed session report");
    } finally {
      setSelectedSessionLoading(false);
    }
  };

  useEffect(() => {
    if (token && activeSidebarTab === "live_sessions") {
      fetchAdminSessions(token);
    }
  }, [token, activeSidebarTab]);

  // Recruiter Activities Fetch API Functions
  const fetchRecruiterCandidates = async (authToken = token) => {
    if (!authToken) return;
    setRecruiterCandidatesLoading(true);
    try {
      const res = await fetch("/api/recruitment/candidates", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRecruiterCandidates(data.candidates || []);
      } else {
        showMsg("error", data.message || "Failed to load candidates");
      }
    } catch (err) {
      showMsg("error", "Error loading recruiter candidates");
    } finally {
      setRecruiterCandidatesLoading(false);
    }
  };

  const fetchRecruiterCandidateDetails = async (email: string, authToken = token) => {
    if (!authToken || !email) return;
    setSelectedRecruiterCandidateLoading(true);
    try {
      const res = await fetch(`/api/recruitment/candidates/${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedRecruiterCandidate(data);
      } else {
        showMsg("error", data.message || "Failed to load candidate profile details");
      }
    } catch (err) {
      showMsg("error", "Error loading detailed candidate profile");
    } finally {
      setSelectedRecruiterCandidateLoading(false);
    }
  };

  const fetchRecruiterSessions = async (authToken = token) => {
    if (!authToken) return;
    setRecruiterSessionsLoading(true);
    try {
      const res = await fetch("/api/recruitment/sessions", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecruiterSessions(data.sessions || []);
      } else {
        showMsg("error", data.message || "Failed to load recruiter sessions");
      }
    } catch (err) {
      showMsg("error", "Error loading recruiter sessions");
    } finally {
      setRecruiterSessionsLoading(false);
    }
  };

  const fetchRecruiterSessionDetails = async (sessionId: string, authToken = token) => {
    if (!authToken || !sessionId) return;
    setSelectedRecruiterSessionLoading(true);
    try {
      const res = await fetch(`/api/recruitment/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedRecruiterSession(data.session);
      } else {
        showMsg("error", data.message || "Failed to load recruiter session details");
      }
    } catch (err) {
      showMsg("error", "Error loading recruiter session details");
    } finally {
      setSelectedRecruiterSessionLoading(false);
    }
  };

  const fetchRecruiterAssessments = async (authToken = token) => {
    if (!authToken) return;
    setRecruiterAssessmentsLoading(true);
    try {
      const res = await fetch("/api/recruitment/assessment", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecruiterAssessments(data.myAssessments || []);
      } else {
        showMsg("error", data.message || "Failed to load recruiter assessments");
      }
    } catch (err) {
      showMsg("error", "Error loading recruiter assessments");
    } finally {
      setRecruiterAssessmentsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (activeSidebarTab === "recruiter_candidates") {
        fetchRecruiterCandidates(token);
      } else if (activeSidebarTab === "recruiter_sessions") {
        fetchRecruiterSessions(token);
      } else if (activeSidebarTab === "recruiter_assessments") {
        fetchRecruiterAssessments(token);
      }
    }
  }, [token, activeSidebarTab]);

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    router.push("/");
  };

  // Single Teacher Form Sample Loader
  const handleLoadSingleSampleData = (checked: boolean) => {
    if (checked) {
      setFormData({
        userId: "TCH-007",
        userName: "Aishwarya Sen",
        joiningDate: new Date().toISOString().split('T')[0],
        branch: "Pondicherry Main Campus",
        designation: "Senior English Lecturer",
        subjects: "English, Literature, Communication",
        qualifications: "M.A. English Literature, B.Ed.",
        gradesInCharge: "Grade 11, Grade 12",
        experience: "7 Years of teaching experience",
        email: "aishwarya@achariya.org",
        mobileNo: "9876543219"
      });
      showMsg("success", "Loaded single teacher sample data!");
    } else {
      setFormData({
        userId: "",
        userName: "",
        joiningDate: "",
        branch: "",
        designation: "",
        subjects: "",
        qualifications: "",
        gradesInCharge: "",
        experience: "",
        email: "",
        mobileNo: ""
      });
    }
  };

  // Create single teacher
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);

    try {
      const payload = {
        ...formData,
        subjects: formData.subjects.split(",").map((s) => s.trim()).filter(Boolean),
        gradesInCharge: formData.gradesInCharge.split(",").map((g) => g.trim()).filter(Boolean)
      };

      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showMsg("success", data.message || "Teacher onboarded successfully!");
        setFormData({
          userId: "",
          userName: "",
          joiningDate: "",
          branch: "",
          designation: "",
          subjects: "",
          qualifications: "",
          gradesInCharge: "",
          experience: "",
          email: "",
          mobileNo: ""
        });
        setActiveTab("list");
        fetchTeachers();
      } else {
        showMsg("error", data.message || "Failed to register teacher");
      }
    } catch (err) {
      showMsg("error", "Network error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  // Update teacher
  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingTeacher) return;
    setActionLoading(true);
    setModalError(null);

    try {
      const payload = {
        ...editFormData,
        subjects: typeof editFormData.subjects === "string" 
          ? editFormData.subjects.split(",").map((s: string) => s.trim()).filter(Boolean) 
          : editFormData.subjects,
        gradesInCharge: typeof editFormData.gradesInCharge === "string" 
          ? editFormData.gradesInCharge.split(",").map((g: string) => g.trim()).filter(Boolean) 
          : editFormData.gradesInCharge
      };

      const res = await fetch(`/api/admin/teachers/${editingTeacher.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showMsg("success", "Teacher updated successfully!");
        setEditingTeacher(null);
        setModalError(null);
        fetchTeachers();
      } else {
        setModalError(data.message || "Failed to update teacher");
      }
    } catch (err) {
      setModalError("Network error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete teacher
  const handleDeleteTeacher = async (id: string) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this teacher account?")) return;

    setDeletingTeacherId(id);
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        showMsg("success", "Teacher profile deleted successfully.");
        setTeachers((prev) => prev.filter((t) => t.id !== id));
      } else {
        showMsg("error", data.message || "Failed to delete teacher");
      }
    } catch (err) {
      showMsg("error", "Network error occurred.");
    } finally {
      setDeletingTeacherId(null);
    }
  };

  // Reset teacher password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !showPasswordReset) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/teachers/${showPasswordReset}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        showMsg("success", "Password reset successfully!");
        setShowPasswordReset(null);
        setNewPassword("");
      } else {
        showMsg("error", data.message || "Failed to reset password");
      }
    } catch (err) {
      showMsg("error", "Network error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  // Sample Data Loader Handler
  const handleLoadSampleData = (checked: boolean) => {
    if (checked) {
      const sampleTeachers = [
        {
          userId: "TCH-001",
          userName: "Sarah Jenkins",
          joiningDate: new Date().toISOString().split('T')[0],
          branch: "Pondicherry Main Campus",
          designation: "Senior Mathematics Lecturer",
          subjects: ["Mathematics", "Statistics"],
          qualifications: "M.Sc. Mathematics, B.Ed.",
          gradesInCharge: ["Grade 11", "Grade 12"],
          experience: "8 Years",
          email: "sarah@achariya.org",
          mobileNo: "9876543210",
          status: "Active",
          activated: false
        },
        {
          userId: "TCH-002",
          userName: "Michael Vance",
          joiningDate: new Date().toISOString().split('T')[0],
          branch: "Karaikal Campus",
          designation: "Physics Educator",
          subjects: ["Physics", "Mechanics"],
          qualifications: "M.Sc. Physics",
          gradesInCharge: ["Grade 12"],
          experience: "5 Years",
          email: "michael@achariya.org",
          mobileNo: "9876543211",
          status: "Active",
          activated: false
        },
        {
          userId: "TCH-003",
          userName: "Divya Rajan",
          joiningDate: new Date().toISOString().split('T')[0],
          branch: "Pondicherry Main Campus",
          designation: "Chemistry Department Head",
          subjects: ["Chemistry", "Organic Chemistry"],
          qualifications: "Ph.D. Chemistry",
          gradesInCharge: ["Grade 11", "Grade 12"],
          experience: "12 Years",
          email: "divya@achariya.org",
          mobileNo: "9876543212",
          status: "Active",
          activated: false
        }
      ];
      setParsedTeachers(sampleTeachers);
      setUploadPreviewOpen(true);
      showMsg("success", "Loaded sample teacher data for preview!");
    } else {
      setParsedTeachers([]);
      setUploadPreviewOpen(false);
    }
  };

  // Excel Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleParseExcel = async () => {
    if (!uploadFile || !token) return;
    setActionLoading(true);

    const fData = new FormData();
    fData.append("file", uploadFile);

    try {
      const res = await fetch("/api/admin/teachers/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: fData
      });

      const data = await res.json();
      if (res.ok) {
        setParsedTeachers(data.data || []);
        setUploadPreviewOpen(true);
        showMsg("success", `Parsed ${data.count} teacher records!`);
      } else {
        showMsg("error", data.message || "Failed to parse spreadsheet file");
      }
    } catch (err) {
      showMsg("error", "Error uploading/parsing file");
    } finally {
      setActionLoading(false);
    }
  };

  const handleImportParsed = async () => {
    if (parsedTeachers.length === 0 || !token) return;
    setActionLoading(true);

    try {
      const res = await fetch("/api/admin/teachers/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ teachers: parsedTeachers })
      });

      const data = await res.json();
      if (res.ok) {
        showMsg(
          "success",
          `Import complete! Saved: ${data.saved}, Skipped: ${data.skipped}.`
        );
        setUploadPreviewOpen(false);
        setParsedTeachers([]);
        setUploadFile(null);
        setActiveTab("list");
        fetchTeachers();
      } else {
        showMsg("error", data.message || "Failed to import datasets");
      }
    } catch (err) {
      showMsg("error", "Error during import operation.");
    } finally {
      setActionLoading(false);
    }
  };

  // Inline preview cell edit
  const handlePreviewCellChange = (index: number, field: string, value: string) => {
    const updated = [...parsedTeachers];
    if (field === "subjects" || field === "gradesInCharge") {
      updated[index][field] = value.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      updated[index][field] = value;
    }
    setParsedTeachers(updated);
  };

  // Filtering
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && t.status === "Active") ||
      (statusFilter === "inactive" && t.status === "Inactive") ||
      (statusFilter === "leave" && t.status === "On Leave") ||
      (statusFilter === "activated" && t.activated) ||
      (statusFilter === "pending" && !t.activated);

    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalCount = teachers.length;
  const activeCount = teachers.filter((t) => t.status === "Active").length;
  const activatedCount = teachers.filter((t) => t.activated).length;
  const pendingCount = totalCount - activatedCount;

  return (
    <div className="min-h-screen text-gray-900 font-sans flex flex-col md:flex-row relative overflow-hidden bg-transparent" data-portal-layout="true">
      {/* Soft Ambient Glows (from home page aesthetic) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#C72323]/5 blur-[120px] rounded-full z-0 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#20407D]/5 blur-[120px] rounded-full z-0 pointer-events-none" />

      {/* Mobile Top Header */}
      <div className="flex md:hidden items-center justify-between px-6 py-4 bg-white border-b border-gray-300 relative z-20 w-full shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-[#C72323] flex items-center justify-center font-bold text-base text-white shadow-sm">
            A
          </div>
          <span className="text-sm font-black text-gray-900 tracking-wider">ACHARIYA</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-gray-700 hover:bg-gray-100 border border-gray-200 cursor-pointer"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Shared Global Sidebar */}
      <Sidebar
        role="admin"
        activeTab={activeSidebarTab}
        setActiveTab={(tab) => {
          setActiveSidebarTab(tab);
          setIsSidebarOpen(false);
          if (tab === "teachers") {
            setActiveTab("list");
          }
        }}
        userName="Super Admin"
        userEmail={adminUser?.email || "admin@achariya.org"}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 container mx-auto my-8 flex flex-col justify-between h-screen overflow-y-auto relative z-10 p-4 sm:p-8">
        <main className="flex-1 space-y-8 pb-12">
          {/* Toast Alerts */}
          {message && (
            <div
              className={`fixed bottom-6 right-6 z-50 p-4 border backdrop-blur-xl shadow-2xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-bottom-5 duration-300 max-w-md ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <CheckCircle size={20} className="shrink-0 text-emerald-600" />
              <span>{message.text}</span>
            </div>
          )}

          {/* VIEW A: ORIGINAL EDUCATOR MANAGEMENT VIEW */}
          {activeSidebarTab === "teachers" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
              <div>
                <h2 className="text-3xl font-black text-gray-900">Super Admin Console</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Onboard academic educators, view active listings, and audit system-wide permissions.
                </p>
              </div>

              {/* Overview Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white/80 border border-gray-300 p-6 relative overflow-hidden shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Total Teachers
                    </span>
                    <Users size={20} className="text-[#20407D]" />
                  </div>
                  <p className="text-3xl font-black text-gray-900">{totalCount}</p>
                </div>

                <div className="bg-white/80 border border-gray-300 p-6 relative overflow-hidden shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Active Staff
                    </span>
                    <CheckCircle size={20} className="text-emerald-600" />
                  </div>
                  <p className="text-3xl font-black text-emerald-600">{activeCount}</p>
                </div>

                <div className="bg-white/80 border border-gray-300 p-6 relative overflow-hidden shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Activated
                    </span>
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <p className="text-3xl font-black text-blue-600">{activatedCount}</p>
                </div>

                <div className="bg-white/80 border border-gray-300 p-6 relative overflow-hidden shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Pending Activation
                    </span>
                    <AlertTriangle size={20} className="text-amber-600" />
                  </div>
                  <p className="text-3xl font-black text-amber-600">{pendingCount}</p>
                </div>
              </div>

        {/* Tabs Control */}
        <div className="flex border-b border-gray-300 gap-6">
          <button
            onClick={() => setActiveTab("list")}
            className={`pb-4 text-sm font-bold tracking-wide transition-all border-b-2 ${
              activeTab === "list"
                ? "border-[#20407D] text-[#20407D]"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Teacher Registry
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`pb-4 text-sm font-bold tracking-wide transition-all border-b-2 ${
              activeTab === "create"
                ? "border-[#20407D] text-[#20407D]"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Manually Onboard Teacher
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`pb-4 text-sm font-bold tracking-wide transition-all border-b-2 ${
              activeTab === "upload"
                ? "border-[#20407D] text-[#20407D]"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Bulk Onboard (Excel)
          </button>
        </div>

        {/* Tab Panels */}

        {/* Panel 1: Teacher Registry List */}
        {activeTab === "list" && (
          <div className="space-y-6">
            {/* Filter and search bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-300 pl-12 pr-4 py-2.5 text-sm focus:border-[#20407D] outline-none transition-all placeholder-gray-400 text-gray-900"
                  placeholder="Search by ID, Name, Branch, or Designation..."
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 px-4 py-2.5 text-sm focus:border-[#20407D] outline-none w-full sm:w-auto"
                >
                  <option value="all">All States</option>
                  <option value="active">Active Status</option>
                  <option value="inactive">Inactive Status</option>
                  <option value="leave">On Leave</option>
                  <option value="activated">Activated Profiles</option>
                  <option value="pending">Pending Activation</option>
                </select>

                <button
                  onClick={() => fetchTeachers()}
                  className="p-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 transition-colors shrink-0 cursor-pointer"
                  title="Reload Registry"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* List Loader / Table */}
            {loading ? (
              <Loader variant="card" message="Loading educator registry..." className="min-h-[250px]" />
            ) : filteredTeachers.length === 0 ? (
              <div className="h-64 border border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/50">
                <Users size={40} className="text-gray-400" />
                <p className="font-bold">No teachers found</p>
                <p className="text-xs">Onboard some teachers using the onboard tabs.</p>
              </div>
            ) : (
              <div className="bg-white/80 border border-gray-300 overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-300 text-xs text-gray-700 font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Employee ID</th>
                        <th className="px-6 py-4">Name / Designation</th>
                        <th className="px-6 py-4">Branch Hub</th>
                        <th className="px-6 py-4">Subjects</th>
                        <th className="px-6 py-4">Activation Status</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredTeachers.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-200 text-gray-900">
                          <td className="px-6 py-4 font-mono font-bold text-[#20407D]">
                            {t.userId}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-gray-900">{t.userName}</p>
                              <p className="text-xs text-gray-600">{t.designation}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300 font-medium">
                            {t.branch}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {t.subjects.slice(0, 3).map((sub, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-bold bg-white/5 border border-white/5 rounded-full px-2 py-0.5"
                                >
                                  {sub}
                                </span>
                              ))}
                              {t.subjects.length > 3 && (
                                <span className="text-[10px] text-indigo-400 font-bold">
                                  +{t.subjects.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {t.activated ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                                  Active Portal
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                                  Pending Activation
                                </span>
                              )}
                              <span className="text-slate-500">•</span>
                              <span className="text-xs text-slate-400">{t.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {/* Edit Action */}
                              <button
                                onClick={() => {
                                  setModalError(null);
                                  setEditingTeacher(t);
                                  setEditFormData({
                                    ...t,
                                    subjects: t.subjects.join(", "),
                                    gradesInCharge: t.gradesInCharge.join(", "),
                                    joiningDate: t.joiningDate.slice(0, 10)
                                  });
                                }}
                                className="p-1.5 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 rounded-lg transition-all"
                                title="Edit Teacher"
                              >
                                <Edit2 size={15} />
                              </button>

                              {/* Password Reset Action */}
                              <button
                                onClick={() => setShowPasswordReset(t.id)}
                                className="p-1.5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 rounded-lg transition-all"
                                title="Reset Password"
                              >
                                <Lock size={15} />
                              </button>

                              {/* Delete Action */}
                              <button
                                onClick={() => handleDeleteTeacher(t.id)}
                                disabled={deletingTeacherId !== null}
                                className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-all disabled:opacity-50"
                                title="Delete"
                              >
                                {deletingTeacherId === t.id ? (
                                  <RefreshCw size={15} className="animate-spin text-rose-500" />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Panel 2: Manually Onboard Teacher */}
        {activeTab === "create" && (
          <div className="bg-white/80 border border-gray-300 rounded-3xl w-max-content p-8 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#20407D]/5 rounded-full blur-2xl" />
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-900">Register Individual Educator</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Onboard a new teacher directly into the assessment database.
                </p>
              </div>
 
              <form onSubmit={handleCreateTeacher} className="space-y-6">
                {/* Single Teacher Form Sample Loader Checkbox */}
                <div className="flex items-center gap-3 p-4 bg-white/50 border border-gray-300 rounded-2xl hover:border-[#20407D]/20 transition-colors shadow-sm">
                  <input
                    type="checkbox"
                    id="loadSingleSampleCheckbox"
                    onChange={(e) => handleLoadSingleSampleData(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#20407D] focus:ring-[#20407D] cursor-pointer"
                  />
                  <div className="text-xs">
                    <label htmlFor="loadSingleSampleCheckbox" className="font-bold text-gray-800 cursor-pointer select-none">
                      Load Sample Teacher Profile Data
                    </label>
                    <p className="text-gray-500 mt-0.5">
                      Pre-fill all manual onboarding inputs with a single sample profile to test form validation and database creation immediately.
                    </p>
                  </div>
                </div>
 
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Employee ID / User ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      placeholder="e.g. TCH001"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-[#20407D] outline-none transition-all placeholder-gray-400 text-gray-900 shadow-sm"
                    />
                  </div>
 
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-[#20407D] outline-none transition-all placeholder-gray-400 text-gray-900 shadow-sm"
                    />
                  </div>
 
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Joining Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-[#20407D] outline-none transition-all text-gray-900 shadow-sm"
                    />
                  </div>
 
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Branch Hub <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="e.g. Pondicherry Main Campus"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-[#20407D] outline-none transition-all placeholder-gray-400 text-gray-900 shadow-sm"
                    />
                  </div>
 
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Designation <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Senior Math Lecturer"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-[#20407D] outline-none transition-all placeholder-gray-400 text-gray-900 shadow-sm"
                    />
                  </div>
 
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Email Address <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. sarah@achariya.org"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-[#20407D] outline-none transition-all placeholder-gray-400 text-gray-900 shadow-sm"
                    />
                  </div>
 
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Contact Mobile <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.mobileNo}
                      onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-[#20407D] outline-none transition-all placeholder-gray-400 text-gray-900 shadow-sm"
                    />
                  </div>
 
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Subjects Assigned <span className="text-gray-400">(Comma separated)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.subjects}
                      onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                      placeholder="e.g. Mathematics, Physics"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-[#20407D] outline-none transition-all placeholder-gray-400 text-gray-900 shadow-sm"
                    />
                  </div>
 
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Qualifications
                    </label>
                    <input
                      type="text"
                      value={formData.qualifications}
                      onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                      placeholder="e.g. M.Sc. Mathematics, B.Ed."
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-[#20407D] outline-none transition-all placeholder-gray-400 text-gray-900 shadow-sm"
                    />
                  </div>
 
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Grades In-charge <span className="text-gray-400">(Comma separated)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.gradesInCharge}
                      onChange={(e) => setFormData({ ...formData, gradesInCharge: e.target.value })}
                      placeholder="e.g. Grade 11, Grade 12"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-[#20407D] outline-none transition-all placeholder-gray-400 text-gray-900 shadow-sm"
                    />
                  </div>
 
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Professional Experience
                    </label>
                    <input
                      type="text"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      placeholder="e.g. 8 years teaching high school mathematics"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-[#20407D] outline-none transition-all placeholder-gray-400 text-gray-900 shadow-sm"
                    />
                  </div>
                </div>
 
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-[#20407D] hover:bg-[#1a3364] text-white px-6 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg disabled:opacity-50 text-sm transition-all flex items-center gap-2 cursor-pointer border border-[#20407D]"
                  >
                    {actionLoading ? "Registering..." : (
                      <>
                        <UserPlus size={16} /> Register & Onboard
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Panel 3: Bulk Excel Onboarding */}
        {activeTab === "upload" && (
          <div className="space-y-8">
            {/* Upload Area */}
            <div className="bg-white/80 border border-gray-300 rounded-3xl p-8 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#20407D]/5 rounded-full blur-2xl" />
 
              <div className=" space-y-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Bulk Educator Onboarding</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload an Excel (.xlsx, .xls) or CSV template file to onboard multiple teachers.
                  </p>
                </div>
 
                {/* Upload drag drop */}
                <div className="border-2 border-dashed border-gray-300 hover:border-[#20407D]/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-white/40 transition-colors group cursor-pointer relative shadow-sm">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="h-14 w-14 rounded-2xl bg-[#20407D]/10 border border-[#20407D]/20 flex items-center justify-center text-[#20407D] group-hover:scale-110 transition-transform">
                    <UploadCloud size={28} />
                  </div>
                  <div className="text-center">
                    {uploadFile ? (
                      <p className="font-bold text-[#20407D]">{uploadFile.name}</p>
                    ) : (
                      <>
                        <p className="font-bold text-gray-700">Click or drag spreadsheet here</p>
                        <p className="text-xs text-gray-500 mt-1">Accepts Excel sheets or CSV files</p>
                      </>
                    )}
                  </div>
                </div>
 
                {/* Sample Data Loader */}
                <div className="flex items-center gap-3 p-4 bg-white/50 border border-gray-300 rounded-2xl hover:border-[#20407D]/20 transition-colors shadow-sm">
                  <input
                    type="checkbox"
                    id="loadSampleCheckbox"
                    onChange={(e) => handleLoadSampleData(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#20407D] focus:ring-[#20407D] cursor-pointer"
                  />
                  <div className="text-xs">
                    <label htmlFor="loadSampleCheckbox" className="font-bold text-gray-800 cursor-pointer select-none">
                      Load Sample Teacher Dataset
                    </label>
                    <p className="text-gray-500 mt-0.5">
                      Pre-populate the preview grid with 3 high-quality sample educator profiles to test bulk onboarding immediately.
                    </p>
                  </div>
                </div>
 
                {/* Info Note */}
                <div className="p-4 bg-white border border-gray-300 rounded-2xl text-xs text-gray-600 leading-relaxed flex gap-3 shadow-sm">
                  <FileSpreadsheet size={16} className="text-[#20407D] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-900 mb-1">Expected Template Structure:</p>
                    <p>
                      Ensure columns exist for: <span className="font-mono text-[#20407D] font-bold">User ID</span> (Employee ID), <span className="font-mono text-[#20407D] font-bold">Full Name</span>, <span className="font-mono text-[#20407D] font-bold">Joining Date</span>, <span className="font-mono text-[#20407D] font-bold">Branch</span>, and <span className="font-mono text-[#20407D] font-bold">Designation</span>. You can also include fields like Subjects, Qualifications, Grades, and Experience.
                    </p>
                  </div>
                </div>
 
                {uploadFile && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleParseExcel}
                      disabled={actionLoading}
                      className="bg-[#20407D] hover:bg-[#1a3364] text-white px-6 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 text-sm flex items-center gap-2 cursor-pointer shadow-md border border-[#20407D]"
                    >
                      {actionLoading ? "Parsing spreadsheet..." : "Parse & Preview Dataset"}
                    </button>
                  </div>
                )}
              </div>
            </div>
 
            {/* Upload preview editable Grid */}
            {uploadPreviewOpen && parsedTeachers.length > 0 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-black text-gray-900">Interactive Dataset Preview</h4>
                    <p className="text-xs text-gray-600">
                      Double-check or modify parsed fields directly below before bulk importing.
                    </p>
                  </div>
 
                  <button
                    onClick={handleImportParsed}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2 border border-emerald-600 cursor-pointer"
                  >
                    <CheckCircle size={16} /> Import {parsedTeachers.length} Teachers
                  </button>
                </div>
 
                <div className="bg-white border border-gray-300 rounded-3xl overflow-hidden shadow-md">
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100 text-xs text-gray-700 font-bold uppercase tracking-wider sticky top-0 border-b border-gray-300">
                        <tr>
                          <th className="px-4 py-3">Employee ID</th>
                          <th className="px-4 py-3">Full Name</th>
                          <th className="px-4 py-3">Branch Hub</th>
                          <th className="px-4 py-3">Designation</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Subjects</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {parsedTeachers.map((t, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                            <td className="px-4 py-2 font-mono">
                              <input
                                type="text"
                                value={t.userId}
                                onChange={(e) => handlePreviewCellChange(idx, "userId", e.target.value)}
                                className="bg-transparent border border-transparent focus:border-[#20407D] rounded px-2 py-1 text-sm font-mono w-28 focus:bg-white text-gray-900 outline-none"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={t.userName}
                                onChange={(e) => handlePreviewCellChange(idx, "userName", e.target.value)}
                                className="bg-transparent border border-transparent focus:border-[#20407D] rounded px-2 py-1 text-sm w-44 font-bold focus:bg-white text-gray-900 outline-none"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={t.branch}
                                onChange={(e) => handlePreviewCellChange(idx, "branch", e.target.value)}
                                className="bg-transparent border border-transparent focus:border-[#20407D] rounded px-2 py-1 text-sm w-44 focus:bg-white text-gray-900 outline-none"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={t.designation}
                                onChange={(e) => handlePreviewCellChange(idx, "designation", e.target.value)}
                                className="bg-transparent border border-transparent focus:border-[#20407D] rounded px-2 py-1 text-sm w-40 focus:bg-white text-gray-900 outline-none"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="email"
                                value={t.email}
                                onChange={(e) => handlePreviewCellChange(idx, "email", e.target.value)}
                                className="bg-transparent border border-transparent focus:border-[#20407D] rounded px-2 py-1 text-sm w-44 focus:bg-white text-gray-900 outline-none"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={Array.isArray(t.subjects) ? t.subjects.join(", ") : t.subjects}
                                onChange={(e) => handlePreviewCellChange(idx, "subjects", e.target.value)}
                                className="bg-transparent border border-transparent focus:border-[#20407D] rounded px-2 py-1 text-xs w-44 focus:bg-white text-gray-800 outline-none"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )}

    {/* VIEW B: ALL SAVED ASSESSMENTS PLATFORM-WIDE */}
    {activeSidebarTab === "assessments" && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
        <div>
          <h2 className="text-3xl font-black text-gray-900">All Platform Assessments</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor and audit every single assessment question bank generated across all school branches.
          </p>
        </div>

        <div className="bg-white/80 border border-gray-300 rounded-3xl overflow-hidden shadow-md">
          {assessmentsLoading ? (
            <Loader variant="card" message="Loading platform assessments..." className="min-h-[250px]" />
          ) : assessments.length === 0 ? (
            <div className="h-64 border border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/50">
              <Compass size={40} className="text-gray-400" />
              <p className="font-bold text-gray-900">No assessments generated yet</p>
              <p className="text-xs text-gray-500">Assessments generated by activated teachers will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Assessment Title</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Lesson/Module</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Created By Educator</th>
                    <th className="px-6 py-4">Scope</th>
                    <th className="px-6 py-4">Date Generated</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assessments.map((a) => {
                    const qs = Array.isArray(a.questions) ? a.questions : JSON.parse(a.questions || "[]");
                    return (
                      <tr key={a.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-200 text-gray-900">
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900 block text-sm max-w-[200px] truncate">{a.title}</span>
                          <span className="text-[10px] text-gray-500 mt-0.5 block">{qs.length} questions compiled</span>
                        </td>
                        <td className="px-6 py-4 text-gray-800 font-medium">{a.subject}</td>
                        <td className="px-6 py-4 text-gray-700">{a.lesson}</td>
                        <td className="px-6 py-4 text-gray-700 font-mono">{a.duration} mins</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-[#20407D] block">{a.createdByTeacherName || "System"}</span>
                          <span className="text-[9px] text-gray-500 block">{a.createdByEmail}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            a.isPublic ? "bg-indigo-50 text-indigo-800 border border-indigo-150" : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}>
                            {a.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                            {a.isPublic ? "Public" : "Private"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{new Date(a.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedAssessment(a);
                              setActiveSidebarTab("view_assessment");
                            }}
                            className="bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 px-3.5 py-1.5 rounded-lg border border-gray-300 transition-all text-[11px] font-bold shadow-sm cursor-pointer"
                          >
                            View Questions
                          </button>
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
    )}

    {/* VIEW C: INDIVIDUAL ASSESSMENT DETAILS INSPECTOR */}
    {activeSidebarTab === "view_assessment" && selectedAssessment && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center pb-6 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSidebarTab("assessments")}
              className="p-2.5 bg-white border border-gray-300 rounded-none hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-gray-900">{selectedAssessment.title}</h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[10px] font-bold border ${
                  selectedAssessment.isPublic ? "bg-indigo-50 text-indigo-800 border-indigo-200" : "bg-gray-100 text-gray-700 border-gray-200"
                }`}>
                  {selectedAssessment.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                  {selectedAssessment.isPublic ? "Public" : "Private"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Generated by {selectedAssessment.createdByTeacherName} ({selectedAssessment.createdByEmail}) on {new Date(selectedAssessment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Meta details card list */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 border border-gray-300 rounded-none p-5 flex items-center gap-4 shadow-sm backdrop-blur-sm">
            <BookOpen className="text-[#20407D]" size={24} />
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Subject Category</label>
              <p className="text-sm font-black text-gray-800 mt-0.5">{selectedAssessment.subject}</p>
            </div>
          </div>

          <div className="bg-white/80 border border-gray-300 rounded-none p-5 flex items-center gap-4 shadow-sm backdrop-blur-sm">
            <Clock className="text-[#20407D]" size={24} />
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Duration Limit</label>
              <p className="text-sm font-black text-gray-800 mt-0.5">{selectedAssessment.duration} Minutes</p>
            </div>
          </div>

          <div className="bg-white/80 border border-gray-300 rounded-none p-5 flex items-center gap-4 shadow-sm backdrop-blur-sm">
            <Compass className="text-[#20407D]" size={24} />
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Lesson Chapter</label>
              <p className="text-sm font-black text-gray-800 mt-0.5">{selectedAssessment.lesson}</p>
            </div>
          </div>

          <div className="bg-white/80 border border-gray-300 rounded-none p-5 flex items-center gap-4 shadow-sm backdrop-blur-sm">
            <Users className="text-[#20407D]" size={24} />
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400">School Branch</label>
              <p className="text-sm font-black text-gray-800 mt-0.5">{selectedAssessment.createdBy?.branch || "Main Campus"}</p>
            </div>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-6">
          {(Array.isArray(selectedAssessment.questions) ? selectedAssessment.questions : JSON.parse(selectedAssessment.questions || "[]")).map((q: any, idx: number) => (
            <div key={idx} className="bg-white/80 border border-gray-300 rounded-none p-6 relative shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-6 w-6 rounded-none bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-center justify-center font-bold text-[10px]">
                  {idx + 1}
                </span>
                <span className="text-[9px] uppercase tracking-widest font-black text-gray-400">{q.type.replace("_", " ")}</span>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-black text-gray-900">{q.question}</p>

                {q.type === "multiple_choice" && q.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="relative flex items-center">
                        <span className="absolute left-3.5 text-[10px] font-black text-[#20407D]">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span className="w-full bg-gray-50 border border-gray-200 rounded-none pl-9 pr-4 py-2.5 text-xs text-gray-700">
                          {opt}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-250 rounded-none space-y-1.5 font-mono">
                  <p className="text-[10px] font-bold text-emerald-800">
                    ✔ CORRECT SOLUTION: <span className="font-extrabold text-emerald-900">{q.correctAnswer}</span>
                  </p>
                  {q.explanation && (
                    <p className="text-[10px] text-gray-600 leading-relaxed italic">
                      REASONING: {q.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* VIEW D: PLATFORM-WIDE CONDUCTED LIVE SESSIONS LIST */}
    {activeSidebarTab === "live_sessions" && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900">Platform Live Sessions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Monitor real-time and completed assessments conducted by all educators across the institution.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={adminSessionSearchQuery}
                onChange={(e) => setAdminSessionSearchQuery(e.target.value)}
                placeholder="Search by title, subject, host, token..."
                className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-4 py-2.5 text-xs focus:border-[#20407D] outline-none transition-all placeholder-gray-400 text-gray-900 shadow-sm"
              />
            </div>
            <button
              onClick={() => fetchAdminSessions(token)}
              className="p-2.5 bg-white border border-gray-300 rounded-none text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw size={14} className={adminSessionsLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Live Session stats bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 border border-gray-300 rounded-none p-4 flex items-center gap-4 shadow-sm backdrop-blur-sm">
            <Activity className="text-[#20407D]" size={24} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Conducted Rooms</p>
              <p className="text-2xl font-black mt-1 text-gray-900">{adminSessionsLoading ? "—" : adminSessions.length}</p>
            </div>
          </div>
          <div className="bg-white/80 border border-gray-300 rounded-none p-4 flex items-center gap-4 shadow-sm backdrop-blur-sm">
            <Users className="text-emerald-600" size={24} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Active Rooms</p>
              <p className="text-2xl font-black mt-1 text-emerald-600">
                {adminSessionsLoading ? "—" : adminSessions.filter(s => s.status === "ACTIVE").length}
              </p>
            </div>
          </div>
          <div className="bg-white/80 border border-gray-300 rounded-none p-4 flex items-center gap-4 shadow-sm backdrop-blur-sm">
            <Trophy className="text-violet-600" size={24} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Completed Audits</p>
              <p className="text-2xl font-black mt-1 text-violet-600">
                {adminSessionsLoading ? "—" : adminSessions.filter(s => s.status === "COMPLETED").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 border border-gray-300 rounded-none overflow-hidden shadow-sm backdrop-blur-sm">
          {adminSessionsLoading ? (
            <Loader variant="card" message="Loading completed live sessions..." className="min-h-[250px]" />
          ) : adminSessions.length === 0 ? (
            <div className="h-64 border border-dashed border-gray-300 rounded-none flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/50">
              <Calendar size={40} className="text-gray-400" />
              <p className="font-bold text-gray-900">No live assessment rooms conducted yet</p>
              <p className="text-xs text-gray-500">Live rooms run by teachers will appear in this log.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-4">Assessment / Token</th>
                    <th className="px-6 py-4">Subject Category</th>
                    <th className="px-6 py-4">Host Teacher</th>
                    <th className="px-6 py-4">Turnout</th>
                    <th className="px-6 py-4">Benchmark Average</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Conducted Date</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminSessions
                    .filter((s) => {
                      const q = adminSessionSearchQuery.toLowerCase();
                      return (
                        s.assessment.title.toLowerCase().includes(q) ||
                        s.assessment.subject.toLowerCase().includes(q) ||
                        s.host.userName.toLowerCase().includes(q) ||
                        s.token.toLowerCase().includes(q)
                      );
                    })
                    .map((s) => {
                      const totalQ = s.assessment.totalQuestions;
                      return (
                        <tr key={s.id} className="hover:bg-gray-50/30 transition-all border-b border-gray-250 text-gray-900">
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900 block text-sm max-w-[200px] truncate">{s.assessment.title}</span>
                            <span className="text-[10px] text-[#20407D] font-mono mt-0.5 block font-bold">{s.token}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-800">
                            <span>{s.assessment.subject}</span>
                            <span className="text-[10px] text-gray-500 block">{s.assessment.lesson}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-800 block">{s.host.userName}</span>
                            <span className="text-[10px] text-gray-500 block">{s.host.branch}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-bold font-mono">{s.stats.participantCount} Students</td>
                          <td className="px-6 py-4">
                            {s.status === "COMPLETED" ? (
                              <span className="font-extrabold text-violet-700 font-mono text-sm">{s.stats.avgScore} <span className="text-[10px] text-gray-500 font-bold">/ {totalQ}</span></span>
                            ) : (
                              <span className="text-gray-400 font-mono">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none border text-[10px] font-bold ${
                              s.status === "COMPLETED" ? "bg-emerald-50 text-emerald-800 border-emerald-250" :
                              s.status === "ACTIVE" ? "bg-blue-50 text-blue-800 border-blue-250 animate-pulse" :
                              "bg-gray-100 text-gray-700 border-gray-200"
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{new Date(s.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                fetchAdminSessionDetails(s.id);
                                setActiveSidebarTab("view_live_session");
                              }}
                              className="bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 px-3.5 py-1.5 border border-gray-300 transition-all text-[11px] font-bold shadow-sm cursor-pointer rounded-none"
                            >
                              Audit Report
                            </button>
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
    )}

    {/* VIEW E: PLATFORM-WIDE DETAILED SESSION ANALYTICS INSPECTOR */}
    {activeSidebarTab === "view_live_session" && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
        {selectedSessionLoading ? (
          <Loader variant="card" message="Compiling master session analytics..." className="min-h-[250px]" />
        ) : !selectedSession ? (
          <div className="h-64 border border-dashed border-gray-300 rounded-none flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/50">
            <AlertCircle size={40} className="text-gray-400" />
            <p className="font-bold text-gray-900">Failed to load detailed report</p>
            <button
              onClick={() => setActiveSidebarTab("live_sessions")}
              className="bg-white border border-gray-300 rounded-none px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 shadow-sm"
            >
              Back to List
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header / Meta */}
            <div className="flex justify-between items-center pb-6 border-b border-gray-300">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSidebarTab("live_sessions")}
                  className="p-2.5 bg-white border border-gray-300 rounded-none hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors shadow-sm cursor-pointer"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-gray-900">{selectedSession.assessment.title}</h2>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[10px] font-bold border ${
                      selectedSession.status === "COMPLETED" ? "bg-emerald-50 text-emerald-800 border-emerald-250" : "bg-blue-50 text-blue-800 border-blue-250 animate-pulse"
                    }`}>
                      {selectedSession.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Subject: {selectedSession.assessment.subject} · Unit: {selectedSession.assessment.lesson} · Key code: <span className="font-mono text-[#20407D] font-bold">{selectedSession.token}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Educator Profile Card */}
            <div className="bg-white/80 border border-gray-300 rounded-none p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#20407D]/5 rounded-full blur-xl" />
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-center justify-center font-bold text-lg rounded-none">T</div>
                <div>
                  <h4 className="font-black text-gray-800 text-sm">Host Educator: {selectedSession.host.userName}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedSession.host.designation} · {selectedSession.host.email}</p>
                </div>
              </div>
              <div className="text-right md:border-l md:border-gray-250 md:pl-6">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Assigned School Hub</p>
                <p className="text-sm font-black text-gray-800 mt-0.5">{selectedSession.host.branch}</p>
              </div>
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white/80 border border-gray-300 rounded-none p-5 shadow-sm">
                <div className="flex items-center gap-3 text-[#20407D] mb-3">
                  <Users size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Student Turnout</span>
                </div>
                <p className="text-3xl font-black text-gray-900">{selectedSession.stats.participantCount}</p>
                <p className="text-[10px] text-gray-400 mt-1">Total joined</p>
              </div>

              <div className="bg-white/80 border border-gray-300 rounded-none p-5 shadow-sm">
                <div className="flex items-center gap-3 text-violet-600 mb-3">
                  <BarChart2 size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Class Average</span>
                </div>
                <p className="text-3xl font-black text-violet-600">{selectedSession.stats.avgScore} <span className="text-xs text-gray-400 font-bold">/ {selectedSession.assessment.totalQuestions}</span></p>
                <p className="text-[10px] text-gray-400 mt-1">Overall correctness accuracy</p>
              </div>

              <div className="bg-white/80 border border-gray-300 rounded-none p-5 shadow-sm">
                <div className="flex items-center gap-3 text-emerald-600 mb-3">
                  <Trophy size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Peak Top Score</span>
                </div>
                <p className="text-3xl font-black text-emerald-600">{selectedSession.stats.highScore} <span className="text-xs text-gray-400 font-bold">/ {selectedSession.assessment.totalQuestions}</span></p>
                <p className="text-[10px] text-gray-400 mt-1">Leaderboard winner peak</p>
              </div>

              <div className="bg-white/80 border border-gray-300 rounded-none p-5 shadow-sm">
                <div className="flex items-center gap-3 text-rose-600 mb-3">
                  <ShieldAlert size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Lowest Score</span>
                </div>
                <p className="text-3xl font-black text-rose-600">{selectedSession.stats.lowScore} <span className="text-xs text-gray-400 font-bold">/ {selectedSession.assessment.totalQuestions}</span></p>
                <p className="text-[10px] text-gray-400 mt-1">Benchmark minimum marks</p>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white/80 border border-gray-300 rounded-none overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-6 py-4 text-center w-16">Rank</th>
                      <th className="px-6 py-4">Student Details</th>
                      <th className="px-6 py-4">Grade & Section</th>
                      <th className="px-6 py-4">Duration Taken</th>
                      <th className="px-6 py-4">Integrity (Tab Switches)</th>
                      <th className="px-6 py-4">Marks Earned</th>
                      <th className="px-6 py-4 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedSession.participants.map((p: any, idx: number) => {
                      const totalQ = selectedSession.assessment.totalQuestions;
                      const scorePercentage = totalQ > 0 ? (p.score / totalQ) * 100 : 0;
                      const isExpanded = expandedStudentId === p.id;

                      const assessmentQuestions = selectedSession.assessment.questions
                        ? (typeof selectedSession.assessment.questions === "string"
                            ? JSON.parse(selectedSession.assessment.questions)
                            : selectedSession.assessment.questions)
                        : [];

                      const studentAnswers = p.answers
                        ? (typeof p.answers === "string"
                            ? JSON.parse(p.answers)
                            : p.answers)
                        : {};

                      const answersArray = Array.isArray(assessmentQuestions)
                        ? assessmentQuestions.map((q: any, qIdx: number) => {
                            const studentAnswer = studentAnswers[q.id] || "No Answer";
                            const isCorrect = studentAnswer === q.correctAnswer;
                            return {
                              questionIndex: qIdx,
                              questionText: q.question,
                              studentAnswer,
                              correctAnswer: q.correctAnswer,
                              isCorrect,
                            };
                          })
                        : [];

                      const barColor = scorePercentage >= 80 ? "bg-emerald-500" :
                                       scorePercentage >= 50 ? "bg-amber-500" : "bg-rose-500";

                      const formatSecs = (sec: number | null) => {
                        if (sec === null || sec === undefined) return "N/A";
                        const mins = Math.floor(sec / 60);
                        const remainder = sec % 60;
                        return mins > 0 ? `${mins}m ${remainder}s` : `${remainder}s`;
                      };

                      return (
                        <Fragment key={p.id}>
                          <tr className="hover:bg-gray-50/30 transition-all text-gray-900 border-b border-gray-100">
                            <td className="px-6 py-4 text-center">
                              {idx === 0 ? (
                                <span className="inline-flex h-6 w-6 rounded-none bg-amber-50 border border-amber-200 text-amber-700 font-black items-center justify-center text-[10px]">1st</span>
                              ) : idx === 1 ? (
                                <span className="inline-flex h-6 w-6 rounded-none bg-gray-100 border border-gray-300 text-gray-600 font-black items-center justify-center text-[10px]">2nd</span>
                              ) : idx === 2 ? (
                                <span className="inline-flex h-6 w-6 rounded-none bg-amber-50 border border-amber-300 text-amber-800 font-black items-center justify-center text-[10px]">3rd</span>
                              ) : (
                                <span className="text-gray-500 font-bold">{idx + 1}</span>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                                <p className="text-[10px] text-gray-550 font-mono mt-0.5">ID: {p.studentId}</p>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-700 bg-gray-100 px-2.5 py-1 border border-gray-200 rounded-none text-[10px]">
                                {p.grade} - {p.section}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-gray-700 font-mono">
                              {formatSecs(p.timeTakenSeconds)}
                            </td>

                            <td className="px-6 py-4">
                              {p.tabSwitches > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-250 px-2 py-0.5 rounded-none animate-pulse">
                                  <ShieldAlert size={10} />
                                  {p.tabSwitches} Warning{p.tabSwitches > 1 ? "s" : ""}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-none">
                                  <Shield size={10} />
                                  Verified Secured
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <div className="w-32 space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-gray-700">{p.score !== null ? `${p.score} / ${totalQ}` : "Incomplete"}</span>
                                  <span className="text-gray-550">{scorePercentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-250 h-1.5 rounded-none overflow-hidden border border-gray-300">
                                  <div className={`h-full ${barColor} rounded-none`} style={{ width: `${scorePercentage}%` }} />
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => setExpandedStudentId(isExpanded ? null : p.id)}
                                className="p-1.5 bg-white border border-gray-300 hover:border-emerald-500/20 rounded-none hover:bg-emerald-50 text-gray-500 hover:text-emerald-700 transition-all flex items-center gap-1 font-bold text-[10px] mx-auto cursor-pointer shadow-sm"
                              >
                                <span>Inspect</span>
                                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-gray-50/50">
                              <td colSpan={7} className="px-8 py-6 border-t border-b border-gray-200">
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-black text-xs uppercase tracking-wider text-gray-500 mb-2">Response Sheet Audit: {p.name}</h5>
                                    <span className="text-[10px] text-gray-400 font-mono">Time of Submission: {p.completedAt ? new Date(p.completedAt).toLocaleString() : "Never Completed"}</span>
                                  </div>

                                  {answersArray.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic">No answered submissions recorded for this student.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {answersArray.map((ans: any, aIdx: number) => (
                                        <div key={aIdx} className={`p-4 border rounded-none flex items-start gap-3 ${
                                          ans.isCorrect
                                            ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                                            : "bg-rose-50 border-rose-250 text-rose-800"
                                        }`}>
                                          <span className={`h-5 w-5 rounded-none flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                            ans.isCorrect
                                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                              : "bg-rose-100 text-rose-800 border border-rose-300"
                                          }`}>
                                            {ans.isCorrect ? <Check size={10} /> : <X size={10} />}
                                          </span>
                                          <div className="text-xs space-y-1">
                                            <p className="font-bold text-gray-900">Q{ans.questionIndex + 1}: {ans.questionText || `Question ${ans.questionIndex + 1}`}</p>
                                            <p className="text-[11px] text-gray-600 mt-1">
                                              Student Selection: <span className="font-extrabold text-gray-800">{ans.studentAnswer || "N/A"}</span>
                                            </p>
                                            {!ans.isCorrect && (
                                              <p className="text-[11px] text-emerald-700">
                                                ✔ Expected Solution: <span className="font-extrabold">{ans.correctAnswer}</span>
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

    {/* REC VIEW A: RECRUITER CANDIDATES REGISTRY */}
    {activeSidebarTab === "recruiter_candidates" && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 font-sans">Recruiter Candidates Registry</h2>
            <p className="text-sm text-gray-600 mt-1">
              Centralised registry of all unique applicants who participated in recruiter assessments across all recruiters.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:max-w-sm">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={recruiterCandidateSearchQuery}
                onChange={(e) => setRecruiterCandidateSearchQuery(e.target.value)}
                placeholder="Search by name, email, mobile, position..."
                className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-4 py-2.5 text-xs focus:border-[#20407D] outline-none text-gray-900 placeholder-gray-400 shadow-sm"
              />
            </div>
            <button
              onClick={() => fetchRecruiterCandidates()}
              className="p-2.5 bg-white border border-gray-300 rounded-none text-gray-750 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw size={14} className={recruiterCandidatesLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 border border-gray-300 rounded-none p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Unique Candidates</span>
              <Users size={16} className="text-[#20407D]" />
            </div>
            <p className="text-3xl font-black text-gray-900">{recruiterCandidatesLoading ? "—" : recruiterCandidates.length}</p>
            <p className="text-[10px] text-gray-400 mt-1">In registry</p>
          </div>
          <div className="bg-white/80 border border-gray-300 rounded-none p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Total Attempts</span>
              <BookOpen size={16} className="text-purple-600" />
            </div>
            <p className="text-3xl font-black text-purple-600">{recruiterCandidatesLoading ? "—" : recruiterCandidates.reduce((acc, c) => acc + c.assessmentCount, 0)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Across all assessments</p>
          </div>
          <div className="bg-white/80 border border-gray-300 rounded-none p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Completed</span>
              <CheckCircle size={16} className="text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-emerald-600">{recruiterCandidatesLoading ? "—" : recruiterCandidates.filter((c) => c.latestCompletedAt && !c.hasTerminated).length}</p>
            <p className="text-[10px] text-gray-400 mt-1">Fully submitted</p>
          </div>
          <div className="bg-white/80 border border-gray-300 rounded-none p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Disqualified</span>
              <ShieldAlert size={16} className="text-red-500" />
            </div>
            <p className="text-3xl font-black text-red-500">{recruiterCandidatesLoading ? "—" : recruiterCandidates.filter((c) => c.hasTerminated).length}</p>
            <p className="text-[10px] text-gray-400 mt-1">Tab-violation lockouts</p>
          </div>
        </div>

        {/* Candidate registry table */}
        {recruiterCandidatesLoading ? (
          <Loader variant="card" message="Loading recruiter candidates..." className="min-h-[250px]" />
        ) : recruiterCandidates.length === 0 ? (
          <div className="bg-white/40 border border-dashed border-gray-300 rounded-none h-80 flex flex-col items-center justify-center gap-3 text-gray-400 shadow-sm backdrop-blur-sm">
            <FolderOpen size={44} className="text-gray-300" />
            <p className="font-bold text-sm text-gray-600">
              {recruiterCandidateSearchQuery ? "No candidates match your search" : "No candidates have registered yet"}
            </p>
          </div>
        ) : (
          <div className="bg-white/80 border border-gray-300 rounded-none overflow-hidden shadow-sm backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-4">Candidate Details</th>
                    <th className="px-6 py-4">Experience &amp; Qualifications</th>
                    <th className="px-6 py-4 text-center">Assessments Taken</th>
                    <th className="px-6 py-4">Latest Position Applied</th>
                    <th className="px-6 py-4">Latest Score</th>
                    <th className="px-6 py-4">Integrity Flag</th>
                    <th className="px-6 py-4 text-center w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recruiterCandidates
                    .filter((c) => {
                      if (!recruiterCandidateSearchQuery) return true;
                      const q = recruiterCandidateSearchQuery.toLowerCase();
                      return (
                        c.name.toLowerCase().includes(q) ||
                        c.email.toLowerCase().includes(q) ||
                        (c.phone || "").includes(q) ||
                        (c.latestPosition || "").toLowerCase().includes(q) ||
                        (c.qualification || "").toLowerCase().includes(q)
                      );
                    })
                    .map((c) => {
                      const isExpanded = expandedRecruiterCandidateEmail === c.email;
                      const latestPercentage =
                        c.latestScore !== null && c.latestTotalQuestions
                          ? Math.round((c.latestScore / c.latestTotalQuestions) * 100)
                          : null;

                      return (
                        <Fragment key={c.email}>
                          <tr className="hover:bg-gray-50/30 transition-all border-b border-gray-250 text-gray-900">
                            {/* Name, email, phone */}
                            <td className="px-6 py-4 space-y-1 max-w-[200px]">
                              <button
                                onClick={() => {
                                  fetchRecruiterCandidateDetails(c.email);
                                  setActiveSidebarTab("view_recruiter_candidate");
                                }}
                                className="font-black text-sm text-gray-900 hover:text-[#20407D] hover:underline transition-colors cursor-pointer block text-left"
                              >
                                {c.name}
                              </button>
                              <p className="text-[10px] text-gray-500 flex items-center gap-1.5 font-mono">
                                <Mail size={11} className="shrink-0" />
                                <span className="truncate">{c.email}</span>
                              </p>
                              <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
                                <Phone size={11} className="shrink-0" />
                                <span>{c.phone}</span>
                              </p>
                            </td>

                            {/* Qualifications */}
                            <td className="px-6 py-4 space-y-1">
                              <p className="font-bold text-gray-700">{c.qualification || "Not Specified"}</p>
                              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Award size={11} className="text-[#20407D] shrink-0" />
                                <span>{c.experience || "No experience reported"}</span>
                              </p>
                            </td>

                            {/* Assessments count badge */}
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex flex-col items-center gap-1">
                                <span className="text-2xl font-black text-[#20407D]">{c.assessmentCount}</span>
                                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                                  {c.assessmentCount === 1 ? "attempt" : "attempts"}
                                </span>
                              </div>
                            </td>

                            {/* Latest position */}
                            <td className="px-6 py-4 space-y-1 max-w-[180px]">
                              <p className="font-bold text-gray-700 truncate">{c.latestPosition || "N/A"}</p>
                              <p className="text-[10px] text-gray-400 truncate">{c.latestRecruitmentFor || ""}</p>
                            </td>

                            {/* Latest score */}
                            <td className="px-6 py-4">
                              {c.hasTerminated ? (
                                <span className="font-black text-red-500 text-xs uppercase">Disqualified</span>
                              ) : c.latestScore !== null && c.latestTotalQuestions ? (
                                <div className="space-y-1">
                                  <p className="font-black text-sm text-emerald-700">{latestPercentage}%</p>
                                  <p className="text-[10px] text-gray-550 font-bold">{c.latestScore} / {c.latestTotalQuestions} Marks</p>
                                </div>
                              ) : c.latestCompletedAt === null ? (
                                <span className="text-amber-600 font-bold text-xs">Not Submitted</span>
                              ) : (
                                <span className="text-gray-400 text-xs">N/A</span>
                              )}
                            </td>

                            {/* Integrity status */}
                            <td className="px-6 py-4">
                              {c.hasTerminated ? (
                                <div className="flex items-center gap-1.5 text-red-500 font-bold">
                                  <ShieldAlert size={13} className="shrink-0 animate-pulse" />
                                  <span className="text-xs">Disqualified</span>
                                </div>
                              ) : c.tabSwitches > 0 ? (
                                <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                                  <AlertTriangle size={13} className="shrink-0" />
                                  <span className="text-xs">{c.tabSwitches} Warning{c.tabSwitches > 1 ? "s" : ""}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                  <ShieldCheck size={13} className="shrink-0" />
                                  <span className="text-xs">Clean Record</span>
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <button
                                  onClick={() => {
                                    fetchRecruiterCandidateDetails(c.email);
                                    setActiveSidebarTab("view_recruiter_candidate");
                                  }}
                                  className="px-3 py-1.5 bg-[#20407D] hover:bg-[#1a3364] border border-[#20407D] text-white rounded-none font-bold text-[10px] transition-all cursor-pointer shadow-sm"
                                >
                                  Full Profile
                                </button>
                                {c.assessmentCount > 1 && (
                                  <button
                                    onClick={() => setExpandedRecruiterCandidateEmail(isExpanded ? null : c.email)}
                                    className="p-1.5 bg-white border border-gray-300 rounded-none hover:border-gray-400 hover:bg-gray-50 text-gray-500 transition-all flex items-center gap-1 font-bold text-[10px] mx-auto cursor-pointer shadow-sm"
                                  >
                                    <span>{isExpanded ? "Collapse" : `All ${c.assessmentCount} Attempts`}</span>
                                    {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded: Attempt history */}
                          {isExpanded && c.attempts && (
                            <tr className="bg-gray-50/50">
                              <td colSpan={7} className="px-8 py-6 border-t border-b border-gray-250">
                                <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                                  <h5 className="font-black text-xs uppercase tracking-wider text-gray-500 mb-2">
                                    Assessment Attempt History — {c.name}
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {c.attempts.map((attempt: any, aIdx: number) => {
                                      const aPct = attempt.score !== null && attempt.totalQuestions
                                        ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                                        : null;
                                      return (
                                        <div key={attempt.id || aIdx} className="bg-white border border-gray-300 rounded-none p-4 space-y-2 shadow-sm">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Attempt #{aIdx + 1}</span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 border rounded-none ${
                                              attempt.terminated ? "bg-red-50 text-red-600 border-red-200" :
                                              attempt.completedAt ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                              "bg-amber-50 text-amber-500 border-amber-200"
                                            }`}>
                                              {attempt.terminated ? "Disqualified" : attempt.completedAt ? "Completed" : "Incomplete"}
                                            </span>
                                          </div>
                                          <p className="font-bold text-gray-850 text-xs truncate">{attempt.assessmentTitle || "Hiring Exam"}</p>
                                          <p className="text-[10px] text-gray-400">Position: <span className="font-bold text-gray-600">{attempt.position || "N/A"}</span></p>
                                          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                            <span className="text-[10px] text-gray-400">
                                              {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : attempt.joinedAt ? new Date(attempt.joinedAt).toLocaleDateString() : "—"}
                                            </span>
                                            <span className={`font-black text-sm ${attempt.terminated ? "text-red-500" : aPct !== null ? (aPct >= 60 ? "text-emerald-600" : "text-amber-500") : "text-gray-400"}`}>
                                              {attempt.terminated ? "DQ" : aPct !== null ? `${aPct}%` : "—"}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )}

    {/* REC VIEW B: INDIVIDUAL RECRUITER CANDIDATE TIMELINE */}
    {activeSidebarTab === "view_recruiter_candidate" && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
        {selectedRecruiterCandidateLoading ? (
          <Loader variant="card" message="Loading candidate profile..." className="min-h-[250px]" />
        ) : !selectedRecruiterCandidate ? (
          <div className="h-64 border border-dashed border-gray-300 rounded-none flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/50">
            <AlertCircle size={40} className="text-gray-400" />
            <p className="font-bold text-gray-900">Failed to load detailed profile</p>
            <button
              onClick={() => setActiveSidebarTab("recruiter_candidates")}
              className="bg-white border border-gray-300 rounded-none px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 shadow-sm cursor-pointer"
            >
              Back to List
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Back Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedRecruiterCandidate(null);
                  setActiveSidebarTab("recruiter_candidates");
                }}
                className="p-3 bg-white border border-gray-300 rounded-none hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors shadow-sm cursor-pointer animate-in"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Candidate Directory</span>
                <h2 className="text-2xl font-black mt-1 text-gray-900">Applicant Profile</h2>
              </div>
            </div>

            {/* Profile banner */}
            <div className="bg-white/80 border border-gray-300 rounded-none shadow-sm backdrop-blur-sm p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="h-20 w-20 bg-blue-50 border border-blue-200 flex items-center justify-center text-[#20407D] font-black text-2xl uppercase shadow-inner shrink-0 rounded-none">
                {selectedRecruiterCandidate.profile?.name ? selectedRecruiterCandidate.profile.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2) : <User size={32} />}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">{selectedRecruiterCandidate.profile?.name}</h3>
                  <p className="text-xs text-blue-600 font-bold mt-1">Qualification: {selectedRecruiterCandidate.profile?.qualification || "Not Specified"}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2.5 text-xs text-gray-600">
                    <Mail size={14} className="text-gray-400 shrink-0" />
                    <span className="truncate font-mono">{selectedRecruiterCandidate.profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-gray-600">
                    <Phone size={14} className="text-gray-400 shrink-0" />
                    <span>{selectedRecruiterCandidate.profile?.phone || "No Mobile"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-gray-600">
                    <Award size={14} className="text-gray-400 shrink-0" />
                    <span>Experience: {selectedRecruiterCandidate.profile?.experience || "No experience reported"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Roster Timeline */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-gray-900">Chronological Assessment Timeline</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Browse candidate's historical attempts, comparative accuracy scores, integrity indexes, and detailed answer audits.
                </p>
              </div>

              {selectedRecruiterCandidate.attempts?.length === 0 ? (
                <div className="bg-white border border-gray-300 rounded-none p-12 text-center text-gray-400 font-bold shadow-sm">
                  No assessment attempts found for this candidate.
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedRecruiterCandidate.attempts?.map((attempt: any, idx: number) => {
                    const totalQuestions = attempt.totalQuestions;
                    const scorePercentage = totalQuestions > 0 && attempt.score !== null ? (attempt.score / totalQuestions) * 100 : 0;
                    const isExpanded = expandedRecruiterCandidateEmail === attempt.id;

                    const assessmentQuestions = attempt.assessment?.questions
                      ? (typeof attempt.assessment.questions === "string"
                          ? JSON.parse(attempt.assessment.questions)
                          : attempt.assessment.questions)
                      : [];

                    const studentAnswers = attempt.answers
                      ? (typeof attempt.answers === "string"
                          ? JSON.parse(attempt.answers)
                          : attempt.answers)
                      : {};

                    const answersArray = Array.isArray(assessmentQuestions)
                      ? assessmentQuestions.map((q: any, qIdx: number) => {
                          const studentAnswer = studentAnswers[q.id] || "No Answer";
                          const isCorrect = studentAnswer === q.correctAnswer;
                          return {
                            questionIndex: qIdx,
                            questionText: q.question,
                            studentAnswer,
                            correctAnswer: q.correctAnswer,
                            isCorrect,
                          };
                        })
                      : [];

                    const barColor = attempt.terminated ? "bg-red-500" :
                                     scorePercentage >= 80 ? "bg-emerald-500" :
                                     scorePercentage >= 50 ? "bg-blue-500" : "bg-red-400";

                    return (
                      <div key={attempt.id} className="bg-white border border-gray-300 rounded-none shadow-sm relative overflow-hidden space-y-6 p-6">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#20407D]" />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attempt #{selectedRecruiterCandidate.attempts.length - idx}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-none border ${
                                attempt.terminated ? "bg-red-50 text-red-600 border-red-200" :
                                attempt.completedAt ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                "bg-amber-50 text-amber-600 border-amber-200"
                              }`}>
                                {attempt.terminated ? "Disqualified" : attempt.completedAt ? "Completed" : "In Progress"}
                              </span>
                            </div>
                            <h4 className="font-black text-base text-gray-900">{attempt.assessment?.title}</h4>
                            <p className="text-[11px] text-gray-550">
                              Position: <span className="font-bold text-gray-700">{attempt.assessment?.position}</span> · Target: <span className="font-bold text-gray-700">{attempt.assessment?.recruitmentFor}</span>
                            </p>
                          </div>
                          <div className="text-right space-y-1 text-gray-400 text-[10px] md:text-xs">
                            <p className="flex items-center gap-1.5 justify-end">
                              <Calendar size={12} />
                              <span>Joined: {new Date(attempt.joinedAt).toLocaleString()}</span>
                            </p>
                            {attempt.completedAt && (
                              <p className="flex items-center gap-1.5 justify-end">
                                <Clock size={12} />
                                <span>Duration: {attempt.timeTakenSeconds ? `${Math.floor(attempt.timeTakenSeconds / 60)}m ${attempt.timeTakenSeconds % 60}s` : "N/A"}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Marks &amp; Accuracy</span>
                            {attempt.terminated ? (
                              <p className="font-extrabold text-red-500 text-sm uppercase">Auto Disqualified</p>
                            ) : attempt.score !== null ? (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-bold">
                                  <span className="text-gray-700">{`${attempt.score} / ${totalQuestions} Marks`}</span>
                                  <span className={`${scorePercentage >= 80 ? "text-emerald-600" : scorePercentage >= 50 ? "text-blue-600" : "text-red-550"}`}>{scorePercentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 border border-gray-200">
                                  <div className={`h-full ${barColor}`} style={{ width: `${scorePercentage}%` }} />
                                </div>
                              </div>
                            ) : (
                              <p className="text-amber-600 font-bold text-xs">Evaluating Attempt...</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Integrity Score</span>
                            {attempt.terminated ? (
                              <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs">
                                <ShieldAlert size={14} className="shrink-0 animate-pulse" />
                                <span>Focus Violations (Disqualified)</span>
                              </div>
                            ) : attempt.tabSwitches > 0 ? (
                              <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
                                <ShieldAlert size={14} className="shrink-0" />
                                <span>{attempt.tabSwitches} Focus Warnings</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                                <Shield size={14} className="shrink-0" />
                                <span>Fully Compliant (0 switches)</span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={() => setExpandedRecruiterCandidateEmail(isExpanded ? null : attempt.id)}
                              className="px-4 py-2 bg-[#20407D] hover:bg-[#1a3364] border border-[#20407D] text-white rounded-none text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                            >
                              <span>{isExpanded ? "Close Audit" : "Inspect Response Sheet"}</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-100 pt-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between">
                              <h5 className="font-black text-xs uppercase tracking-wider text-gray-500">Answer sheet transcript</h5>
                              <span className="text-[10px] text-gray-400 font-mono">Room ID: {attempt.sessionToken}</span>
                            </div>

                            {answersArray.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">No responses recorded for this attempt.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {answersArray.map((ans: any, aIdx: number) => (
                                  <div key={aIdx} className={`p-4 border rounded-none flex items-start gap-3 ${
                                    ans.isCorrect ? "bg-emerald-50 border-emerald-255 text-emerald-800" : "bg-red-50 border-red-255 text-red-800"
                                  }`}>
                                    <span className={`h-5 w-5 rounded-none flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border ${
                                      ans.isCorrect ? "bg-emerald-100 text-emerald-600 border-emerald-300" : "bg-red-100 text-red-600 border-red-300"
                                    }`}>
                                      {ans.isCorrect ? <Check size={10} /> : <X size={10} />}
                                    </span>
                                    <div className="text-xs space-y-1">
                                      <p className="font-bold text-gray-900">Q{ans.questionIndex + 1}: {ans.questionText || `Question ${ans.questionIndex + 1}`}</p>
                                      <p className="text-[11px] text-gray-500 mt-1">Candidate Selection: <span className="font-extrabold text-gray-700">{ans.studentAnswer || "No Answer"}</span></p>
                                      {!ans.isCorrect && (
                                        <p className="text-[11px] text-emerald-600">✔ Expected Solution: <span className="font-extrabold">{ans.correctAnswer}</span></p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )}

    {/* REC VIEW C: RECRUITER CONDUCTED SESSIONS */}
    {activeSidebarTab === "recruiter_sessions" && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900">Recruiter Conducted Sessions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Browse and audit all real-time candidate examination rooms initiated across recruiters.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={recruiterSessionSearchQuery}
                onChange={(e) => setRecruiterSessionSearchQuery(e.target.value)}
                placeholder="Search by exam title, position, token..."
                className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-4 py-2.5 text-xs focus:border-[#20407D] outline-none transition-all placeholder:text-gray-400 text-gray-900 shadow-sm"
              />
            </div>
            <button
              onClick={() => fetchRecruiterSessions()}
              className="p-2.5 bg-white border border-gray-300 rounded-none text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw size={14} className={recruiterSessionsLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Aggregated widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white/80 border border-gray-300 rounded-none p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Rooms Run</span>
              <Activity size={18} className="text-[#20407D]" />
            </div>
            <p className="text-4xl font-black text-gray-900">{recruiterSessionsLoading ? "—" : recruiterSessions.length}</p>
            <p className="text-[10px] text-gray-400 mt-1">Conducted from Recruiter Console</p>
          </div>

          <div className="bg-white/80 border border-gray-300 rounded-none p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Average Turnout</span>
              <Users size={18} className="text-[#20407D]" />
            </div>
            <p className="text-4xl font-black text-gray-900">{recruiterSessionsLoading ? "—" : (recruiterSessions.length > 0 ? (recruiterSessions.reduce((acc, curr) => acc + curr.stats.participantCount, 0) / recruiterSessions.length).toFixed(1) : "0")}</p>
            <p className="text-[10px] text-gray-400 mt-1">Candidates per session</p>
          </div>

          <div className="bg-white/80 border border-gray-300 rounded-none p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Benchmark Avg Score</span>
              <Trophy size={18} className="text-emerald-600" />
            </div>
            <p className="text-4xl font-black text-emerald-600">
              {recruiterSessionsLoading ? "—" : (recruiterSessions.filter(s => s.status === "COMPLETED").length > 0 ? `${(recruiterSessions.filter(s => s.status === "COMPLETED").reduce((acc, curr) => acc + curr.stats.avgScore, 0) / recruiterSessions.filter(s => s.status === "COMPLETED").length).toFixed(1)} Qs` : "0 Qs")}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Across all completed candidate sessions</p>
          </div>
        </div>

        {/* Sessions list */}
        {recruiterSessionsLoading ? (
          <Loader variant="card" message="Loading recruiter sessions..." className="min-h-[250px]" />
        ) : recruiterSessions.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-none h-80 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Calendar size={40} className="text-gray-300" />
            <p className="font-bold text-sm">
              {recruiterSessionSearchQuery ? "No conducted rooms match your search" : "No live session history found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recruiterSessions
              .filter((s) =>
                s.assessment.title.toLowerCase().includes(recruiterSessionSearchQuery.toLowerCase()) ||
                (s.assessment.position || "").toLowerCase().includes(recruiterSessionSearchQuery.toLowerCase()) ||
                s.token.toLowerCase().includes(recruiterSessionSearchQuery.toLowerCase())
              )
              .map((session) => {
                const formattedTime = new Date(session.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                });
                const totalQ = session.assessment.totalQuestions;

                return (
                  <div key={session.id} className="bg-white/80 border border-gray-300 rounded-none p-6 hover:border-blue-300 hover:shadow-md transition-all shadow-sm backdrop-blur-sm flex flex-col justify-between min-h-[240px]">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-none border ${
                          session.status === "COMPLETED" ? "bg-emerald-50 text-emerald-800 border-emerald-250" :
                          session.status === "ACTIVE" ? "bg-blue-50 text-blue-800 border-blue-200 animate-pulse" :
                          "bg-gray-100 text-gray-500 border-gray-200"
                        }`}>
                          {session.status}
                        </span>
                        <span className="text-[10px] text-gray-400">{formattedTime}</span>
                      </div>

                      <h4 className="font-black text-base text-gray-900 leading-tight mb-1 line-clamp-1">{session.assessment.title}</h4>
                      <p className="text-xs text-gray-500 mb-2">Position: <span className="font-bold text-gray-700">{session.assessment.position}</span></p>
                      <p className="text-[10px] text-gray-400 line-clamp-1">{session.assessment.recruitmentFor}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-150 my-4 bg-gray-50 px-3 text-center">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 block uppercase">Applicants</span>
                        <span className="text-sm font-extrabold text-gray-700 mt-0.5 block">{session.stats.participantCount}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 block uppercase">Average</span>
                        <span className="text-sm font-extrabold text-blue-600 mt-0.5 block">
                          {session.status === "COMPLETED" ? `${session.stats.avgScore}/${totalQ}` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 block uppercase">Top Score</span>
                        <span className="text-sm font-extrabold text-emerald-600 mt-0.5 block">
                          {session.status === "COMPLETED" ? `${session.stats.highScore}/${totalQ}` : "—"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        fetchRecruiterSessionDetails(session.id);
                        setActiveSidebarTab("view_recruiter_session");
                      }}
                      className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-2.5 rounded-none text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      Open Roster Report <ArrowRight size={12} className="text-gray-400" />
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    )}

    {/* REC VIEW D: DETAILED RECRUITER SESSION ROSTER REPORT */}
    {activeSidebarTab === "view_recruiter_session" && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
        {selectedRecruiterSessionLoading ? (
          <Loader variant="card" message="Compiling session statistics roster..." className="min-h-[250px]" />
        ) : !selectedRecruiterSession ? (
          <div className="h-64 border border-dashed border-gray-300 rounded-none flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/50">
            <AlertCircle size={40} className="text-gray-400" />
            <p className="font-bold text-gray-900">Failed to load session roster</p>
            <button
              onClick={() => setActiveSidebarTab("recruiter_sessions")}
              className="bg-white border border-gray-300 rounded-none px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 shadow-sm"
            >
              Back to List
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header / Meta */}
            <div className="flex justify-between items-center pb-6 border-b border-gray-300">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSidebarTab("recruiter_sessions")}
                  className="p-2.5 bg-white border border-gray-300 rounded-none hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors shadow-sm cursor-pointer"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-gray-900">{selectedRecruiterSession.assessment?.title}</h2>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[10px] font-bold border ${
                      selectedRecruiterSession.status === "COMPLETED" ? "bg-emerald-50 text-emerald-800 border-emerald-250" : "bg-blue-50 text-blue-800 border-blue-250 animate-pulse"
                    }`}>
                      {selectedRecruiterSession.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Position: {selectedRecruiterSession.assessment?.position} · Client: {selectedRecruiterSession.assessment?.recruitmentFor} · Key code: <span className="font-mono text-[#20407D] font-bold">{selectedRecruiterSession.token}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Recruiter Host profile card */}
            <div className="bg-white/80 border border-gray-300 rounded-none p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#20407D]/5 rounded-full blur-xl" />
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-center justify-center font-bold text-lg rounded-none">R</div>
                <div>
                  <h4 className="font-black text-gray-800 text-sm">Host Recruiter: {selectedRecruiterSession.host?.name || "System"}</h4>
                  <p className="text-xs text-gray-555 mt-0.5">{selectedRecruiterSession.host?.email}</p>
                </div>
              </div>
            </div>

            {/* Stats list */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white/80 border border-gray-300 rounded-none p-5 shadow-sm">
                <div className="flex items-center gap-3 text-[#20407D] mb-3">
                  <Users size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Candidate Turnout</span>
                </div>
                <p className="text-3xl font-black text-gray-900">{selectedRecruiterSession.stats.participantCount}</p>
                <p className="text-[10px] text-gray-400 mt-1">Total joined</p>
              </div>

              <div className="bg-white/80 border border-gray-300 rounded-none p-5 shadow-sm">
                <div className="flex items-center gap-3 text-violet-600 mb-3">
                  <BarChart2 size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Class Average</span>
                </div>
                <p className="text-3xl font-black text-violet-600">{selectedRecruiterSession.stats.avgScore} <span className="text-xs text-gray-400 font-bold">/ {selectedRecruiterSession.assessment?.totalQuestions}</span></p>
                <p className="text-[10px] text-gray-400 mt-1">Average Marks</p>
              </div>

              <div className="bg-white/80 border border-gray-300 rounded-none p-5 shadow-sm">
                <div className="flex items-center gap-3 text-emerald-600 mb-3">
                  <Trophy size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Top Peak Score</span>
                </div>
                <p className="text-3xl font-black text-emerald-600">{selectedRecruiterSession.stats.highScore} <span className="text-xs text-gray-400 font-bold">/ {selectedRecruiterSession.assessment?.totalQuestions}</span></p>
                <p className="text-[10px] text-gray-400 mt-1">Max marks scored</p>
              </div>

              <div className="bg-white/80 border border-gray-300 rounded-none p-5 shadow-sm">
                <div className="flex items-center gap-3 text-rose-600 mb-3">
                  <ShieldAlert size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Lowest Score</span>
                </div>
                <p className="text-3xl font-black text-rose-600">{selectedRecruiterSession.stats.lowScore} <span className="text-xs text-gray-400 font-bold">/ {selectedRecruiterSession.assessment?.totalQuestions}</span></p>
                <p className="text-[10px] text-gray-400 mt-1">Minimum marks scored</p>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white/80 border border-gray-300 rounded-none overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-6 py-4 text-center w-16">Rank</th>
                      <th className="px-6 py-4">Candidate Details</th>
                      <th className="px-6 py-4">Qualifications &amp; Experience</th>
                      <th className="px-6 py-4">Duration Taken</th>
                      <th className="px-6 py-4">Integrity status</th>
                      <th className="px-6 py-4">Marks Earned</th>
                      <th className="px-6 py-4 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedRecruiterSession.participants.map((p: any, idx: number) => {
                      const totalQ = selectedRecruiterSession.assessment?.totalQuestions;
                      const scorePercentage = totalQ > 0 ? (p.score / totalQ) * 100 : 0;
                      const isExpanded = expandedRecruiterStudentId === p.id;

                      const assessmentQuestions = selectedRecruiterSession.assessment?.questions
                        ? (typeof selectedRecruiterSession.assessment.questions === "string"
                            ? JSON.parse(selectedRecruiterSession.assessment.questions)
                            : selectedRecruiterSession.assessment.questions)
                        : [];

                      const studentAnswers = p.answers
                        ? (typeof p.answers === "string"
                            ? JSON.parse(p.answers)
                            : p.answers)
                        : {};

                      const answersArray = Array.isArray(assessmentQuestions)
                        ? assessmentQuestions.map((q: any, qIdx: number) => {
                            const studentAnswer = studentAnswers[q.id] || "No Answer";
                            const isCorrect = studentAnswer === q.correctAnswer;
                            return {
                              questionIndex: qIdx,
                              questionText: q.question,
                              studentAnswer,
                              correctAnswer: q.correctAnswer,
                              isCorrect,
                            };
                          })
                        : [];

                      const barColor = p.terminated ? "bg-red-500" :
                                       scorePercentage >= 80 ? "bg-emerald-500" :
                                       scorePercentage >= 50 ? "bg-blue-500" : "bg-red-400";

                      return (
                        <Fragment key={p.id}>
                          <tr className="hover:bg-gray-50/30 transition-all text-gray-900 border-b border-gray-100">
                            <td className="px-6 py-4 text-center">
                              {idx === 0 ? (
                                <span className="inline-flex h-6 w-6 rounded-none bg-amber-50 border border-amber-200 text-amber-700 font-black items-center justify-center text-[10px]">1st</span>
                              ) : idx === 1 ? (
                                <span className="inline-flex h-6 w-6 rounded-none bg-gray-100 border border-gray-300 text-gray-600 font-black items-center justify-center text-[10px]">2nd</span>
                              ) : idx === 2 ? (
                                <span className="inline-flex h-6 w-6 rounded-none bg-amber-50 border border-amber-300 text-amber-850 font-black items-center justify-center text-[10px]">3rd</span>
                              ) : (
                                <span className="text-gray-555 font-bold">{idx + 1}</span>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                                <p className="text-[10px] text-gray-550 font-mono mt-0.5">{p.email}</p>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div>
                                <p className="font-bold text-gray-750">{p.qualification || "N/A"}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">{p.experience}</p>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-gray-750 font-mono">
                              {p.timeTakenSeconds ? `${Math.floor(p.timeTakenSeconds / 60)}m ${p.timeTakenSeconds % 60}s` : "N/A"}
                            </td>

                            <td className="px-6 py-4">
                              {p.terminated ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-50 border border-red-250 px-2 py-0.5 rounded-none animate-pulse">
                                  <ShieldAlert size={10} />
                                  Disqualified
                                </span>
                              ) : p.tabSwitches > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-250 px-2 py-0.5 rounded-none animate-pulse">
                                  <ShieldAlert size={10} />
                                  {p.tabSwitches} Warning{p.tabSwitches > 1 ? "s" : ""}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-none">
                                  <Shield size={10} />
                                  Verified Secured
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <div className="w-32 space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-gray-700">{p.score !== null ? `${p.score} / ${totalQ}` : "Incomplete"}</span>
                                  <span className="text-gray-550">{scorePercentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-250 h-1.5 border border-gray-300 rounded-none overflow-hidden">
                                  <div className={`h-full ${barColor}`} style={{ width: `${scorePercentage}%` }} />
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => setExpandedRecruiterStudentId(isExpanded ? null : p.id)}
                                className="p-1.5 bg-white border border-gray-300 hover:border-emerald-500/20 rounded-none hover:bg-emerald-50 text-gray-500 hover:text-emerald-755 transition-all flex items-center gap-1 font-bold text-[10px] mx-auto cursor-pointer shadow-sm"
                              >
                                <span>Inspect</span>
                                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-gray-50/50">
                              <td colSpan={7} className="px-8 py-6 border-t border-b border-gray-205">
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-black text-xs uppercase tracking-wider text-gray-500 mb-2">Response Sheet Audit: {p.name}</h5>
                                    <span className="text-[10px] text-gray-450 font-mono font-bold">Submitted: {p.completedAt ? new Date(p.completedAt).toLocaleString() : "Never Completed"}</span>
                                  </div>

                                  {answersArray.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic">No answered submissions recorded for this candidate.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {answersArray.map((ans: any, aIdx: number) => (
                                        <div key={aIdx} className={`p-4 border rounded-none flex items-start gap-3 ${
                                          ans.isCorrect ? "bg-emerald-50 border-emerald-250 text-emerald-800" : "bg-rose-50 border-rose-250 text-rose-800"
                                        }`}>
                                          <span className={`h-5 w-5 rounded-none flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border ${
                                            ans.isCorrect ? "bg-emerald-100 text-emerald-600 border-emerald-350" : "bg-rose-100 text-rose-600 border-rose-350"
                                          }`}>
                                            {ans.isCorrect ? <Check size={10} /> : <X size={10} />}
                                          </span>
                                          <div className="text-xs space-y-1">
                                            <p className="font-bold text-gray-900">Q{ans.questionIndex + 1}: {ans.questionText || `Question ${ans.questionIndex + 1}`}</p>
                                            <p className="text-[11px] text-gray-605 mt-1">Selection: <span className="font-extrabold text-gray-800">{ans.studentAnswer || "No Answer"}</span></p>
                                            {!ans.isCorrect && (
                                              <p className="text-[11px] text-emerald-700">✔ Expected Solution: <span className="font-extrabold">{ans.correctAnswer}</span></p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

    {/* REC VIEW E: RECRUITERS GENERATED ALL ASSESSMENTS */}
    {activeSidebarTab === "recruiter_assessments" && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Recruiters Generated All Assessments</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor and audit every recruitment assessment compiled by all recruiters across the platform.
          </p>
        </div>

        <div className="bg-white/80 border border-gray-300 rounded-none overflow-hidden shadow-sm">
          {recruiterAssessmentsLoading ? (
            <Loader variant="card" message="Loading recruitment assessments..." className="min-h-[250px]" />
          ) : recruiterAssessments.length === 0 ? (
            <div className="h-64 border border-dashed border-gray-300 rounded-none flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/50">
              <Compass size={40} className="text-gray-400" />
              <p className="font-bold text-gray-900">No recruitment assessments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-4">Assessment Title</th>
                    <th className="px-6 py-4">Department / Domain</th>
                    <th className="px-6 py-4">Applied Position</th>
                    <th className="px-6 py-4">Target Institution</th>
                    <th className="px-6 py-4">Duration Limit</th>
                    <th className="px-6 py-4">Compiled By Recruiter</th>
                    <th className="px-6 py-4">Public Status</th>
                    <th className="px-6 py-4">Date Generated</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recruiterAssessments.map((a) => {
                    const qs = Array.isArray(a.questions) ? a.questions : JSON.parse(a.questions || "[]");
                    return (
                      <tr key={a.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-200 text-gray-900">
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900 block text-sm max-w-[200px] truncate">{a.title}</span>
                          <span className="text-[10px] text-gray-500 mt-0.5 block">{qs.length} questions compiled</span>
                        </td>
                        <td className="px-6 py-4 text-gray-800 font-medium">
                          <span>{a.department}</span>
                          <span className="text-[9px] text-gray-400 block uppercase font-bold">{a.teaching}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-850 font-bold">{a.position}</td>
                        <td className="px-6 py-4 text-gray-700 truncate max-w-[140px]">{a.recruitmentFor}</td>
                        <td className="px-6 py-4 text-gray-750 font-mono">{a.duration} mins</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-[#20407D] block">{a.generatedBy || "Recruiter"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none border text-[9px] font-bold ${
                            a.isPublic ? "bg-indigo-50 text-indigo-800 border-indigo-250" : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}>
                            {a.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                            {a.isPublic ? "Public" : "Private"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{new Date(a.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedRecruiterAssessment(a);
                              setActiveSidebarTab("view_recruiter_assessment");
                            }}
                            className="bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 px-3.5 py-1.5 rounded-none border border-gray-300 transition-all text-[11px] font-bold shadow-sm cursor-pointer"
                          >
                            View Questions
                          </button>
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
    )}

    {/* REC VIEW F: DETAILED RECRUITER ASSESSMENT INSPECTOR */}
    {activeSidebarTab === "view_recruiter_assessment" && selectedRecruiterAssessment && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center pb-6 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSidebarTab("recruiter_assessments")}
              className="p-2.5 bg-white border border-gray-300 rounded-none hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-gray-900">{selectedRecruiterAssessment.title}</h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[10px] font-bold border ${
                  selectedRecruiterAssessment.isPublic ? "bg-indigo-50 text-indigo-800 border-indigo-250" : "bg-gray-100 text-gray-700 border-gray-200"
                }`}>
                  {selectedRecruiterAssessment.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                  {selectedRecruiterAssessment.isPublic ? "Public" : "Private"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Generated by recruiter: {selectedRecruiterAssessment.generatedBy} on {new Date(selectedRecruiterAssessment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Meta details card list */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 border border-gray-300 rounded-none p-5 flex items-center gap-4 shadow-sm backdrop-blur-sm">
            <BookOpen className="text-[#20407D]" size={24} />
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Department / Type</label>
              <p className="text-sm font-black text-gray-800 mt-0.5">{selectedRecruiterAssessment.department} ({selectedRecruiterAssessment.teaching})</p>
            </div>
          </div>

          <div className="bg-white/80 border border-gray-300 rounded-none p-5 flex items-center gap-4 shadow-sm backdrop-blur-sm">
            <Clock className="text-[#20407D]" size={24} />
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Duration Limit</label>
              <p className="text-sm font-black text-gray-800 mt-0.5">{selectedRecruiterAssessment.duration} Minutes</p>
            </div>
          </div>

          <div className="bg-white/80 border border-gray-300 rounded-none p-5 flex items-center gap-4 shadow-sm backdrop-blur-sm">
            <Briefcase className="text-[#20407D]" size={24} />
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Hiring Position</label>
              <p className="text-sm font-black text-gray-800 mt-0.5">{selectedRecruiterAssessment.position}</p>
            </div>
          </div>

          <div className="bg-white/80 border border-gray-300 rounded-none p-5 flex items-center gap-4 shadow-sm backdrop-blur-sm">
            <Users className="text-[#20407D]" size={24} />
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Client / Institution</label>
              <p className="text-sm font-black text-gray-800 mt-0.5">{selectedRecruiterAssessment.recruitmentFor}</p>
            </div>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-6">
          {(Array.isArray(selectedRecruiterAssessment.questions) ? selectedRecruiterAssessment.questions : JSON.parse(selectedRecruiterAssessment.questions || "[]")).map((q: any, idx: number) => (
            <div key={idx} className="bg-white/80 border border-gray-300 rounded-none p-6 relative shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-6 w-6 rounded-none bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-center justify-center font-bold text-[10px]">
                  {idx + 1}
                </span>
                <span className="text-[9px] uppercase tracking-widest font-black text-gray-400">{q.type?.replace("_", " ") || "MULTIPLE CHOICE"}</span>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-black text-gray-900">{q.question}</p>

                {q.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="relative flex items-center">
                        <span className="absolute left-3.5 text-[10px] font-black text-[#20407D]">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span className="w-full bg-gray-50 border border-gray-200 rounded-none pl-9 pr-4 py-2.5 text-xs text-gray-700">
                          {opt}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 p-4 bg-emerald-55 border border-emerald-250 rounded-none space-y-1.5 font-mono">
                  <p className="text-[10px] font-bold text-emerald-800">
                    ✔ CORRECT ANSWER: <span className="font-extrabold text-emerald-900">{q.correctAnswer}</span>
                  </p>
                  {q.explanation && (
                    <p className="text-[10px] text-gray-600 leading-relaxed italic">
                      REASONING: {q.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </main>
</div>

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-white/10 w-full max-w-2xl rounded-3xl p-8 relative overflow-hidden max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl animate-pulse" />
            
            <h3 className="text-xl font-bold mb-6">Modify Educator Profile</h3>

            {modalError && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-sm text-rose-455 animate-in fade-in duration-200">
                <AlertTriangle size={18} className="shrink-0 text-rose-455" />
                <span className="text-rose-200 font-bold">{modalError}</span>
              </div>
            )}
            
            <form onSubmit={handleUpdateTeacher} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={editFormData.userId}
                    onChange={(e) => setEditFormData({ ...editFormData, userId: e.target.value })}
                    className="w-full bg-white/80 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.userName}
                    onChange={(e) => setEditFormData({ ...editFormData, userName: e.target.value })}
                    className="w-full bg-white/80 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">Branch Hub</label>
                  <input
                    type="text"
                    required
                    value={editFormData.branch}
                    onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                    className="w-full bg-white/80 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">Designation</label>
                  <input
                    type="text"
                    required
                    value={editFormData.designation}
                    onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                    className="w-full bg-white/80 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-white/80 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">Mobile No</label>
                  <input
                    type="text"
                    value={editFormData.mobileNo}
                    onChange={(e) => setEditFormData({ ...editFormData, mobileNo: e.target.value })}
                    className="w-full bg-white/80 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full bg-white/80 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Subjects</label>
                  <input
                    type="text"
                    value={editFormData.subjects}
                    onChange={(e) => setEditFormData({ ...editFormData, subjects: e.target.value })}
                    placeholder="Comma separated"
                    className="w-full bg-white/80 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">Qualifications</label>
                  <input
                    type="text"
                    value={editFormData.qualifications}
                    onChange={(e) => setEditFormData({ ...editFormData, qualifications: e.target.value })}
                    className="w-full bg-white/80 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-5 py-2.5 bg-white hover:bg-white border border-gray-300 rounded-xl text-slate-800 hover:text-white transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-blue-800 hover:bg-blue-600 px-5 py-2.5 rounded-xl text-white font-bold transition-all text-sm"
                >
                  {actionLoading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl" />
            
            <h3 className="text-xl font-bold mb-2">Reset Teacher Password</h3>
            <p className="text-xs text-slate-400 mb-6">
              Establish a new portal login password for this teacher.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder-slate-800"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordReset(null);
                    setNewPassword("");
                  }}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || newPassword.length < 6}
                  className="bg-amber-600 hover:bg-amber-500 px-5 py-2.5 rounded-xl font-bold transition-all text-sm text-white disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

     
    </div>
  );
}
