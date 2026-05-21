"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
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
  AlertCircle
} from "lucide-react";

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
    <div className="min-h-screen bg-slate-950 text-white font-sans flex relative overflow-hidden">
      {/* Background atmospheric elements */}
      <div className="absolute top-0 left-[-10%] w-[50%] h-[40%] rounded-full bg-indigo-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[130px] pointer-events-none" />

      {/* Shared Global Sidebar */}
      <Sidebar
        role="admin"
        activeTab={activeSidebarTab}
        setActiveTab={(tab) => {
          setActiveSidebarTab(tab);
          if (tab === "teachers") {
            setActiveTab("list");
          }
        }}
        userName="Super Admin"
        userEmail={adminUser?.email || "admin@achariya.org"}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col justify-between h-screen overflow-y-auto relative z-10 p-8">
        <main className="flex-1 space-y-8 pb-12">
          {/* Toast Alerts */}
          {message && (
            <div
              className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-bottom-5 duration-300 max-w-md ${
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              <CheckCircle size={20} className="shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {/* VIEW A: ORIGINAL EDUCATOR MANAGEMENT VIEW */}
          {activeSidebarTab === "teachers" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
              <div>
                <h2 className="text-3xl font-black">Super Admin Console</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Onboard academic educators, view active listings, and audit system-wide permissions.
                </p>
              </div>

              {/* Overview Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Total Teachers
                    </span>
                    <Users size={20} className="text-indigo-400" />
                  </div>
                  <p className="text-3xl font-black">{totalCount}</p>
                </div>

                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Active Staff
                    </span>
                    <CheckCircle size={20} className="text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black text-emerald-400">{activeCount}</p>
                </div>

                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 rounded-full blur-xl" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Activated
                    </span>
                    <Users size={20} className="text-violet-400" />
                  </div>
                  <p className="text-3xl font-black text-violet-400">{activatedCount}</p>
                </div>

                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Pending Activation
                    </span>
                    <AlertTriangle size={20} className="text-amber-400" />
                  </div>
                  <p className="text-3xl font-black text-amber-400">{pendingCount}</p>
                </div>
              </div>

        {/* Tabs Control */}
        <div className="flex border-b border-white/5 gap-6">
          <button
            onClick={() => setActiveTab("list")}
            className={`pb-4 text-sm font-bold tracking-wide transition-all border-b-2 ${
              activeTab === "list"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Teacher Registry
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`pb-4 text-sm font-bold tracking-wide transition-all border-b-2 ${
              activeTab === "create"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Manually Onboard Teacher
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`pb-4 text-sm font-bold tracking-wide transition-all border-b-2 ${
              activeTab === "upload"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-white"
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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition-all placeholder-slate-500"
                  placeholder="Search by ID, Name, Branch, or Designation..."
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-white/5 rounded-2xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none w-full sm:w-auto"
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
                  className="p-2.5 bg-slate-900 border border-white/5 hover:bg-slate-800 rounded-2xl transition-colors shrink-0"
                  title="Reload Registry"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* List Loader / Table */}
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
                <RefreshCw size={36} className="animate-spin text-indigo-400" />
                <span>Loading educator registry...</span>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="h-64 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-900/10">
                <Users size={40} className="text-slate-600" />
                <p className="font-bold">No teachers found</p>
                <p className="text-xs">Onboard some teachers using the onboard tabs.</p>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-white/5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Employee ID</th>
                        <th className="px-6 py-4">Name / Designation</th>
                        <th className="px-6 py-4">Branch Hub</th>
                        <th className="px-6 py-4">Subjects</th>
                        <th className="px-6 py-4">Activation Status</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredTeachers.map((t) => (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-indigo-400">
                            {t.userId}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-white">{t.userName}</p>
                              <p className="text-xs text-slate-400">{t.designation}</p>
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
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
            
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-xl font-bold">Register Individual Educator</h3>
                <p className="text-sm text-slate-400">
                  Onboard a new teacher directly into the assessment database.
                </p>
              </div>

              <form onSubmit={handleCreateTeacher} className="space-y-6">
                {/* Single Teacher Form Sample Loader Checkbox */}
                <div className="flex items-center gap-3 p-4 bg-slate-950/80 border border-white/5 rounded-2xl hover:border-indigo-500/20 transition-colors">
                  <input
                    type="checkbox"
                    id="loadSingleSampleCheckbox"
                    onChange={(e) => handleLoadSingleSampleData(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 text-indigo-600 bg-slate-900 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer"
                  />
                  <div className="text-xs">
                    <label htmlFor="loadSingleSampleCheckbox" className="font-bold text-slate-200 cursor-pointer select-none">
                      Load Sample Teacher Profile Data
                    </label>
                    <p className="text-slate-500 mt-0.5">
                      Pre-fill all manual onboarding inputs with a single sample profile to test form validation and database creation immediately.
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Employee ID / User ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      placeholder="e.g. TCH001"
                      className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Joining Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Branch Hub <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="e.g. Pondicherry Main Campus"
                      className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Designation <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Senior Math Lecturer"
                      className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Email Address <span className="text-slate-500">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. sarah@achariya.org"
                      className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Contact Mobile <span className="text-slate-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.mobileNo}
                      onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Subjects Assigned <span className="text-slate-500">(Comma separated)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.subjects}
                      onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                      placeholder="e.g. Mathematics, Physics"
                      className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Qualifications
                    </label>
                    <input
                      type="text"
                      value={formData.qualifications}
                      onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                      placeholder="e.g. M.Sc. Mathematics, B.Ed."
                      className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Grades In-charge <span className="text-slate-500">(Comma separated)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.gradesInCharge}
                      onChange={(e) => setFormData({ ...formData, gradesInCharge: e.target.value })}
                      placeholder="e.g. Grade 11, Grade 12"
                      className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder-slate-700"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Professional Experience
                    </label>
                    <input
                      type="text"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      placeholder="e.g. 8 years teaching high school mathematics"
                      className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder-slate-700"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 disabled:opacity-50 text-sm transition-all flex items-center gap-2"
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
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />

              <div className="max-w-2xl space-y-6">
                <div>
                  <h3 className="text-xl font-bold">Bulk Educator Onboarding</h3>
                  <p className="text-sm text-slate-400">
                    Upload an Excel (.xlsx, .xls) or CSV template file to onboard multiple teachers.
                  </p>
                </div>

                {/* Upload drag drop */}
                <div className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-slate-950/30 transition-colors group cursor-pointer relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <UploadCloud size={28} />
                  </div>
                  <div className="text-center">
                    {uploadFile ? (
                      <p className="font-bold text-indigo-300">{uploadFile.name}</p>
                    ) : (
                      <>
                        <p className="font-bold text-slate-300">Click or drag spreadsheet here</p>
                        <p className="text-xs text-slate-500 mt-1">Accepts Excel sheets or CSV files</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Sample Data Loader */}
                <div className="flex items-center gap-3 p-4 bg-slate-950/80 border border-white/5 rounded-2xl hover:border-indigo-500/20 transition-colors">
                  <input
                    type="checkbox"
                    id="loadSampleCheckbox"
                    onChange={(e) => handleLoadSampleData(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 text-indigo-600 bg-slate-900 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer"
                  />
                  <div className="text-xs">
                    <label htmlFor="loadSampleCheckbox" className="font-bold text-slate-200 cursor-pointer select-none">
                      Load Sample Teacher Dataset
                    </label>
                    <p className="text-slate-500 mt-0.5">
                      Pre-populate the preview grid with 3 high-quality sample educator profiles to test bulk onboarding immediately.
                    </p>
                  </div>
                </div>

                {/* Info Note */}
                <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl text-xs text-slate-400 leading-relaxed flex gap-3">
                  <FileSpreadsheet size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white mb-1">Expected Template Structure:</p>
                    <p>
                      Ensure columns exist for: <span className="font-mono text-indigo-300">User ID</span> (Employee ID), <span className="font-mono text-indigo-300">Full Name</span>, <span className="font-mono text-indigo-300">Joining Date</span>, <span className="font-mono text-indigo-300">Branch</span>, and <span className="font-mono text-indigo-300">Designation</span>. You can also include fields like Subjects, Qualifications, Grades, and Experience.
                    </p>
                  </div>
                </div>

                {uploadFile && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleParseExcel}
                      disabled={actionLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 text-sm flex items-center gap-2"
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
                    <h4 className="text-lg font-bold">Interactive Dataset Preview</h4>
                    <p className="text-xs text-slate-400">
                      Double-check or modify parsed fields directly below before bulk importing.
                    </p>
                  </div>

                  <button
                    onClick={handleImportParsed}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/10 transition-all text-sm flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Import {parsedTeachers.length} Teachers
                  </button>
                </div>

                <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-950 text-xs text-slate-400 uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="px-4 py-3">Employee ID</th>
                          <th className="px-4 py-3">Full Name</th>
                          <th className="px-4 py-3">Branch Hub</th>
                          <th className="px-4 py-3">Designation</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Subjects</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {parsedTeachers.map((t, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.01]">
                            <td className="px-4 py-2 font-mono">
                              <input
                                type="text"
                                value={t.userId}
                                onChange={(e) => handlePreviewCellChange(idx, "userId", e.target.value)}
                                className="bg-transparent border border-transparent focus:border-indigo-500 rounded px-2 py-1 text-sm font-mono w-28 focus:bg-slate-950 text-white outline-none"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={t.userName}
                                onChange={(e) => handlePreviewCellChange(idx, "userName", e.target.value)}
                                className="bg-transparent border border-transparent focus:border-indigo-500 rounded px-2 py-1 text-sm w-44 font-bold focus:bg-slate-950 text-white outline-none"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={t.branch}
                                onChange={(e) => handlePreviewCellChange(idx, "branch", e.target.value)}
                                className="bg-transparent border border-transparent focus:border-indigo-500 rounded px-2 py-1 text-sm w-44 focus:bg-slate-950 text-white outline-none"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={t.designation}
                                onChange={(e) => handlePreviewCellChange(idx, "designation", e.target.value)}
                                className="bg-transparent border border-transparent focus:border-indigo-500 rounded px-2 py-1 text-sm w-40 focus:bg-slate-950 text-white outline-none"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="email"
                                value={t.email}
                                onChange={(e) => handlePreviewCellChange(idx, "email", e.target.value)}
                                className="bg-transparent border border-transparent focus:border-indigo-500 rounded px-2 py-1 text-sm w-44 focus:bg-slate-950 text-white outline-none"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={Array.isArray(t.subjects) ? t.subjects.join(", ") : t.subjects}
                                onChange={(e) => handlePreviewCellChange(idx, "subjects", e.target.value)}
                                className="bg-transparent border border-transparent focus:border-indigo-500 rounded px-2 py-1 text-xs w-44 focus:bg-slate-950 text-slate-300 outline-none"
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
          <h2 className="text-3xl font-black">All Platform Assessments</h2>
          <p className="text-sm text-slate-400 mt-1">
            Monitor and audit every single assessment question bank generated across all school branches.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          {assessmentsLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw size={36} className="animate-spin text-indigo-400" />
              <span>Loading platform assessments...</span>
            </div>
          ) : assessments.length === 0 ? (
            <div className="h-64 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-900/10">
              <Compass size={40} className="text-slate-600" />
              <p className="font-bold">No assessments generated yet</p>
              <p className="text-xs">Assessments generated by activated teachers will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
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
                <tbody className="divide-y divide-white/5">
                  {assessments.map((a) => {
                    const qs = Array.isArray(a.questions) ? a.questions : JSON.parse(a.questions || "[]");
                    return (
                      <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-white block text-sm max-w-[200px] truncate">{a.title}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">{qs.length} questions compiled</span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-medium">{a.subject}</td>
                        <td className="px-6 py-4 text-slate-400">{a.lesson}</td>
                        <td className="px-6 py-4 text-slate-400 font-mono">{a.duration} mins</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-indigo-400 block">{a.createdByTeacherName || "System"}</span>
                          <span className="text-[9px] text-slate-500 block">{a.createdByEmail}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            a.isPublic ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-800 text-slate-400 border border-white/5"
                          }`}>
                            {a.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                            {a.isPublic ? "Public" : "Private"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedAssessment(a);
                              setActiveSidebarTab("view_assessment");
                            }}
                            className="bg-white/5 hover:bg-indigo-650 hover:text-indigo-400 px-3.5 py-1.5 rounded-lg border border-white/5 transition-all text-[11px] font-bold text-slate-400"
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
        <div className="flex justify-between items-center pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSidebarTab("assessments")}
              className="p-2.5 bg-slate-900 border border-white/5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black">{selectedAssessment.title}</h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedAssessment.isPublic ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-800 text-slate-400 border border-white/5"
                }`}>
                  {selectedAssessment.isPublic ? "Public" : "Private"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Generated by {selectedAssessment.createdByTeacherName} ({selectedAssessment.createdByEmail}) on {new Date(selectedAssessment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Meta details card list */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <BookOpen className="text-indigo-400" size={24} />
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Subject Category</label>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{selectedAssessment.subject}</p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <Clock className="text-indigo-400" size={24} />
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Duration Limit</label>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{selectedAssessment.duration} Minutes</p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <Compass className="text-indigo-400" size={24} />
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Lesson Chapter</label>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{selectedAssessment.lesson}</p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <Users className="text-indigo-400" size={24} />
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500">School Branch</label>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{selectedAssessment.createdBy?.branch || "Main Campus"}</p>
            </div>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-6">
          {(Array.isArray(selectedAssessment.questions) ? selectedAssessment.questions : JSON.parse(selectedAssessment.questions || "[]")).map((q: any, idx: number) => (
            <div key={idx} className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-6 w-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                  {idx + 1}
                </span>
                <span className="text-[9px] uppercase tracking-widest font-black text-slate-500">{q.type.replace("_", " ")}</span>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-100">{q.question}</p>

                {q.type === "multiple_choice" && q.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="relative flex items-center">
                        <span className="absolute left-3.5 text-[10px] font-black text-indigo-455">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span className="w-full bg-slate-950/65 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-300">
                          {opt}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-1.5 font-mono">
                  <p className="text-[10px] font-bold text-emerald-400">
                    ✔ CORRECT SOLUTION: <span className="font-extrabold text-white">{q.correctAnswer}</span>
                  </p>
                  {q.explanation && (
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">
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
            <h2 className="text-3xl font-black">Platform Live Sessions</h2>
            <p className="text-sm text-slate-400 mt-1">
              Monitor real-time and completed assessments conducted by all educators across the institution.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={adminSessionSearchQuery}
                onChange={(e) => setAdminSessionSearchQuery(e.target.value)}
                placeholder="Search by title, subject, host, token..."
                className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:border-indigo-500 outline-none transition-all placeholder-slate-500"
              />
            </div>
            <button
              onClick={() => fetchAdminSessions(token)}
              className="p-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw size={14} className={adminSessionsLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Live Session stats bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <Activity className="text-indigo-400" size={24} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Conducted Rooms</p>
              <p className="text-2xl font-black mt-1">{adminSessionsLoading ? "—" : adminSessions.length}</p>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <Users className="text-emerald-400" size={24} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Rooms</p>
              <p className="text-2xl font-black mt-1 text-emerald-400">
                {adminSessionsLoading ? "—" : adminSessions.filter(s => s.status === "ACTIVE").length}
              </p>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <Trophy className="text-violet-400" size={24} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completed Audits</p>
              <p className="text-2xl font-black mt-1 text-violet-400">
                {adminSessionsLoading ? "—" : adminSessions.filter(s => s.status === "COMPLETED").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          {adminSessionsLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw size={36} className="animate-spin text-indigo-400" />
              <span>Loading completed live sessions...</span>
            </div>
          ) : adminSessions.length === 0 ? (
            <div className="h-64 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-900/10">
              <Calendar size={40} className="text-slate-700" />
              <p className="font-bold">No live assessment rooms conducted yet</p>
              <p className="text-xs">Live rooms run by teachers will appear in this log.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
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
                <tbody className="divide-y divide-white/5">
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
                        <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-white block text-sm max-w-[200px] truncate">{s.assessment.title}</span>
                            <span className="text-[10px] text-indigo-400 font-mono mt-0.5 block">{s.token}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            <span>{s.assessment.subject}</span>
                            <span className="text-[10px] text-slate-500 block">{s.assessment.lesson}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-300 block">{s.host.userName}</span>
                            <span className="text-[10px] text-slate-500 block">{s.host.branch}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-300 font-bold font-mono">{s.stats.participantCount} Students</td>
                          <td className="px-6 py-4">
                            {s.status === "COMPLETED" ? (
                              <span className="font-extrabold text-violet-400 font-mono text-sm">{s.stats.avgScore} <span className="text-[10px] text-slate-500 font-bold">/ {totalQ}</span></span>
                            ) : (
                              <span className="text-slate-500 font-mono">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              s.status === "ACTIVE" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse" :
                              "bg-slate-800 text-slate-400 border border-white/5"
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                fetchAdminSessionDetails(s.id);
                                setActiveSidebarTab("view_live_session");
                              }}
                              className="bg-white/5 hover:bg-emerald-600 hover:text-white px-3.5 py-1.5 rounded-lg border border-white/5 transition-all text-[11px] font-bold text-slate-400"
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
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw size={36} className="animate-spin text-indigo-400" />
            <span>Compiling master session analytics...</span>
          </div>
        ) : !selectedSession ? (
          <div className="h-64 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-900/10">
            <AlertCircle size={40} className="text-slate-600" />
            <p className="font-bold">Failed to load detailed report</p>
            <button
              onClick={() => setActiveSidebarTab("live_sessions")}
              className="bg-white/5 px-4 py-2 border border-white/5 rounded-xl text-slate-300 hover:text-white"
            >
              Back to List
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header / Meta */}
            <div className="flex justify-between items-center pb-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSidebarTab("live_sessions")}
                  className="p-2.5 bg-slate-900 border border-white/5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black">{selectedSession.assessment.title}</h2>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedSession.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse"
                    }`}>
                      {selectedSession.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Subject: {selectedSession.assessment.subject} · Unit: {selectedSession.assessment.lesson} · Key code: <span className="font-mono text-indigo-400 font-bold">{selectedSession.token}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Educator Profile Card */}
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-lg text-indigo-400">T</div>
                <div>
                  <h4 className="font-black text-slate-200 text-sm">Host Educator: {selectedSession.host.userName}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedSession.host.designation} · {selectedSession.host.email}</p>
                </div>
              </div>
              <div className="text-right md:border-l md:border-white/5 md:pl-6">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Assigned School Hub</p>
                <p className="text-sm font-black text-slate-300 mt-0.5">{selectedSession.host.branch}</p>
              </div>
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center gap-3 text-indigo-400 mb-3">
                  <Users size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Student Turnout</span>
                </div>
                <p className="text-3xl font-black">{selectedSession.stats.participantCount}</p>
                <p className="text-[10px] text-slate-500 mt-1">Total joined</p>
              </div>

              <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center gap-3 text-violet-400 mb-3">
                  <BarChart2 size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Class Average</span>
                </div>
                <p className="text-3xl font-black text-violet-400">{selectedSession.stats.avgScore} <span className="text-xs text-slate-500 font-bold">/ {selectedSession.assessment.totalQuestions}</span></p>
                <p className="text-[10px] text-slate-500 mt-1">Overall correctness accuracy</p>
              </div>

              <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center gap-3 text-emerald-400 mb-3">
                  <Trophy size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Peak Top Score</span>
                </div>
                <p className="text-3xl font-black text-emerald-400">{selectedSession.stats.highScore} <span className="text-xs text-slate-500 font-bold">/ {selectedSession.assessment.totalQuestions}</span></p>
                <p className="text-[10px] text-slate-500 mt-1">Leaderboard winner peak</p>
              </div>

              <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center gap-3 text-rose-400 mb-3">
                  <ShieldAlert size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Lowest Score</span>
                </div>
                <p className="text-3xl font-black text-rose-400">{selectedSession.stats.lowScore} <span className="text-xs text-slate-500 font-bold">/ {selectedSession.assessment.totalQuestions}</span></p>
                <p className="text-[10px] text-slate-500 mt-1">Benchmark minimum marks</p>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="px-6 py-4 text-center w-16">Rank</th>
                      <th className="px-6 py-4">Student Details</th>
                      <th className="px-6 py-4">Grade & Section</th>
                      <th className="px-6 py-4">Duration Taken</th>
                      <th className="px-6 py-4">Integrity (Tab Switches)</th>
                      <th className="px-6 py-4">Marks Earned</th>
                      <th className="px-6 py-4 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
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
                          <tr className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4 text-center">
                              {idx === 0 ? (
                                <span className="inline-flex h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black items-center justify-center text-[10px]">1st</span>
                              ) : idx === 1 ? (
                                <span className="inline-flex h-6 w-6 rounded-full bg-slate-300/10 border border-slate-300/30 text-slate-300 font-black items-center justify-center text-[10px]">2nd</span>
                              ) : idx === 2 ? (
                                <span className="inline-flex h-6 w-6 rounded-full bg-amber-700/10 border border-amber-700/30 text-amber-600 font-black items-center justify-center text-[10px]">3rd</span>
                              ) : (
                                <span className="text-slate-500 font-bold">{idx + 1}</span>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <div>
                                <p className="font-bold text-white text-sm">{p.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {p.studentId}</p>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-300 bg-white/5 px-2.5 py-1 border border-white/5 rounded-xl">
                                {p.grade} - {p.section}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-slate-300 font-mono">
                              {formatSecs(p.timeTakenSeconds)}
                            </td>

                            <td className="px-6 py-4">
                              {p.tabSwitches > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full animate-pulse">
                                  <ShieldAlert size={10} />
                                  {p.tabSwitches} Warning{p.tabSwitches > 1 ? "s" : ""}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                  <Shield size={10} />
                                  Verified Secured
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <div className="w-32 space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-300">{p.score !== null ? `${p.score} / ${totalQ}` : "Incomplete"}</span>
                                  <span className="text-slate-500">{scorePercentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                                  <div className={`h-full ${barColor} rounded-full`} style={{ width: `${scorePercentage}%` }} />
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => setExpandedStudentId(isExpanded ? null : p.id)}
                                className="p-1.5 bg-white/5 border border-white/5 hover:border-emerald-500/20 rounded-lg hover:bg-emerald-500/5 text-slate-400 hover:text-emerald-400 transition-all flex items-center gap-1 font-bold text-[10px] mx-auto"
                              >
                                <span>Inspect</span>
                                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-slate-950/40">
                              <td colSpan={7} className="px-8 py-6 border-t border-b border-white/5">
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-black text-xs uppercase tracking-wider text-slate-400">Response Sheet Audit: {p.name}</h5>
                                    <span className="text-[10px] text-slate-500 font-mono">Time of Submission: {p.completedAt ? new Date(p.completedAt).toLocaleString() : "Never Completed"}</span>
                                  </div>

                                  {answersArray.length === 0 ? (
                                    <p className="text-xs text-slate-600 italic">No answered submissions recorded for this student.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {answersArray.map((ans: any, aIdx: number) => (
                                        <div key={aIdx} className={`p-4 border rounded-2xl flex items-start gap-3 ${
                                          ans.isCorrect
                                            ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-300"
                                            : "bg-rose-500/5 border-rose-500/10 text-rose-300"
                                        }`}>
                                          <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                            ans.isCorrect
                                              ? "bg-emerald-500/10 text-emerald-400"
                                              : "bg-rose-500/10 text-rose-400"
                                          }`}>
                                            {ans.isCorrect ? <Check size={10} /> : <X size={10} />}
                                          </span>
                                          <div className="text-xs space-y-1">
                                            <p className="font-bold text-white">Q{ans.questionIndex + 1}: {ans.questionText || `Question ${ans.questionIndex + 1}`}</p>
                                            <p className="text-[11px] text-slate-400 mt-1">
                                              Student Selection: <span className="font-extrabold text-slate-200">{ans.studentAnswer || "N/A"}</span>
                                            </p>
                                            {!ans.isCorrect && (
                                              <p className="text-[11px] text-emerald-400">
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
  </main>
</div>

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-3xl p-8 relative overflow-hidden max-h-[90vh] overflow-y-auto shadow-2xl">
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
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={editFormData.userId}
                    onChange={(e) => setEditFormData({ ...editFormData, userId: e.target.value })}
                    className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.userName}
                    onChange={(e) => setEditFormData({ ...editFormData, userName: e.target.value })}
                    className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Branch Hub</label>
                  <input
                    type="text"
                    required
                    value={editFormData.branch}
                    onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                    className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Designation</label>
                  <input
                    type="text"
                    required
                    value={editFormData.designation}
                    onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                    className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mobile No</label>
                  <input
                    type="text"
                    value={editFormData.mobileNo}
                    onChange={(e) => setEditFormData({ ...editFormData, mobileNo: e.target.value })}
                    className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
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
                    className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Qualifications</label>
                  <input
                    type="text"
                    value={editFormData.qualifications}
                    onChange={(e) => setEditFormData({ ...editFormData, qualifications: e.target.value })}
                    className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl font-bold transition-all text-sm"
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

      {/* Footer */}
      <footer className="bg-slate-950 py-6 border-t border-white/5 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Achariya Educational Group. Administrative Hub.</p>
          <div className="flex items-center gap-4">
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-slate-500">All Master Systems Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
