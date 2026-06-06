"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Lock,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowLeft,
  X,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Phone,
  Briefcase,
  User,
  School
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

export default function DirectorTeachersOnboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [directorUser, setDirectorUser] = useState<any>(null);

  // Teacher Onboarding States
  const [activeTab, setActiveTab] = useState<"list" | "create" | "upload">("list");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    const savedToken = localStorage.getItem("directorToken");
    const savedUser = localStorage.getItem("directorUser");

    if (!savedToken || !savedUser) {
      router.push("/director/login");
      return;
    }

    setToken(savedToken);
    setDirectorUser(JSON.parse(savedUser));
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

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
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
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Toast Alerts */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 border rounded-none backdrop-blur-xl shadow-2xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-bottom-5 duration-300 max-w-md ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <CheckCircle size={20} className="shrink-0 text-emerald-600" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-5">
        <Link
          href="/director/teachers"
          className="p-2.5 bg-white border border-gray-300 rounded-none hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-3xl font-black text-gray-900">Onboard Educators Console</h2>
          <p className="text-sm text-gray-500 mt-1">
            Register academic teachers individually or perform bulk Excel onboarding into the evaluation database.
          </p>
        </div>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white/85 border border-gray-200 p-6 relative overflow-hidden shadow-sm rounded-none">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-405">
              Total Teachers
            </span>
            <Users size={18} className="text-blue-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">{totalCount}</p>
        </div>

        <div className="bg-white/85 border border-gray-200 p-6 relative overflow-hidden shadow-sm rounded-none">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-405">
              Active Staff
            </span>
            <CheckCircle size={18} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600">{activeCount}</p>
        </div>

        <div className="bg-white/85 border border-gray-200 p-6 relative overflow-hidden shadow-sm rounded-none">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-405">
              Activated
            </span>
            <Users size={18} className="text-blue-600" />
          </div>
          <p className="text-3xl font-black text-blue-600">{activatedCount}</p>
        </div>

        <div className="bg-white/85 border border-gray-200 p-6 relative overflow-hidden shadow-sm rounded-none">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-405">
              Pending Activation
            </span>
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <p className="text-3xl font-black text-amber-600">{pendingCount}</p>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab("list")}
          className={`pb-4 text-sm font-bold tracking-wide transition-all border-b-2 rounded-none cursor-pointer ${
            activeTab === "list"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Teacher Registry
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`pb-4 text-sm font-bold tracking-wide transition-all border-b-2 rounded-none cursor-pointer ${
            activeTab === "create"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Manually Onboard Teacher
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`pb-4 text-sm font-bold tracking-wide transition-all border-b-2 rounded-none cursor-pointer ${
            activeTab === "upload"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Bulk Onboard (Excel)
        </button>
      </div>

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
                className="w-full bg-white border border-gray-300 rounded-none pl-12 pr-4 py-2.5 text-xs focus:border-blue-600 outline-none transition-all placeholder-gray-400 text-gray-900 shadow-sm"
                placeholder="Search by ID, Name, Branch, or Designation..."
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-none text-gray-900 px-4 py-2.5 text-xs focus:border-blue-600 outline-none w-full sm:w-auto shadow-sm"
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
                className="p-2.5 bg-white border border-gray-300 rounded-none hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors shrink-0 cursor-pointer shadow-sm"
                title="Reload Registry"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* List Table */}
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-500 bg-white border border-gray-200 rounded-none">
              <RefreshCw size={36} className="animate-spin text-blue-600" />
              <span className="text-xs font-bold text-gray-400">Loading educator registry...</span>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="h-64 border border-dashed border-gray-300 rounded-none flex flex-col items-center justify-center gap-2 text-gray-500 bg-white">
              <Users size={40} className="text-gray-300" />
              <p className="font-bold text-sm text-gray-700">No teachers found</p>
              <p className="text-xs text-gray-400">Onboard some teachers using the console tabs.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-none overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-550 font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-6 py-4">Employee ID</th>
                      <th className="px-6 py-4">Name / Designation</th>
                      <th className="px-6 py-4">Branch Hub</th>
                      <th className="px-6 py-4">Subjects</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {filteredTeachers.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/30 transition-colors border-b border-gray-100 text-gray-900">
                        <td className="px-6 py-4 font-mono font-bold text-blue-600">
                          {t.userId}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-gray-900">{t.userName}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{t.designation}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-bold">
                          {t.branch}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {t.subjects.slice(0, 3).map((sub, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-semibold bg-gray-50 border border-gray-200 rounded-none px-2 py-0.5"
                              >
                                {sub}
                              </span>
                            ))}
                            {t.subjects.length > 3 && (
                              <span className="text-[10px] text-blue-600 font-bold ml-1">
                                +{t.subjects.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {t.activated ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Active Portal
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
                                Pending Activation
                              </span>
                            )}
                            <span className="text-gray-300">•</span>
                            <span className="text-[10px] text-gray-400 font-bold">{t.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
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
                              className="p-2 border border-gray-200 hover:border-blue-600 rounded-none text-gray-400 hover:text-blue-600 transition-all cursor-pointer"
                              title="Edit Teacher"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              onClick={() => setShowPasswordReset(t.id)}
                              className="p-2 border border-gray-200 hover:border-amber-600 rounded-none text-gray-400 hover:text-amber-500 transition-all cursor-pointer"
                              title="Reset Password"
                            >
                              <Lock size={13} />
                            </button>

                            <button
                              onClick={() => handleDeleteTeacher(t.id)}
                              disabled={deletingTeacherId !== null}
                              className="p-2 border border-gray-200 hover:border-red-600 rounded-none text-gray-400 hover:text-red-650 transition-all disabled:opacity-50 cursor-pointer"
                              title="Delete Account"
                            >
                              {deletingTeacherId === t.id ? (
                                <RefreshCw size={13} className="animate-spin text-red-500" />
                              ) : (
                                <Trash2 size={13} />
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
        <div className="bg-white border border-gray-200 rounded-none p-8 shadow-sm">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-gray-900">Register Individual Educator</h3>
              <p className="text-xs text-gray-500 mt-1">
                Onboard a new teacher directly into the assessment database.
              </p>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-6">
              {/* Load Single Sample */}
              <label className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-none hover:border-blue-600/30 transition-colors shadow-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  onChange={(e) => handleLoadSingleSampleData(e.target.checked)}
                  className="h-4 w-4 rounded-none border-gray-300 text-blue-650 focus:ring-blue-600 cursor-pointer mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-bold text-gray-800">
                    Pre-fill Single Teacher Sample Data
                  </span>
                  <p className="text-gray-400 mt-0.5">
                    Pre-fill all manual onboarding inputs with a single sample profile to test database creation.
                  </p>
                </div>
              </label>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Employee ID / User ID *
                  </label>
                  <input
                    type="text" required
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    placeholder="e.g. TCH001"
                    className="w-full bg-white border border-gray-300 rounded-none px-4 py-2.5 text-xs focus:border-blue-600 outline-none transition-all placeholder-gray-400 text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Full Name *
                  </label>
                  <input
                    type="text" required
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-white border border-gray-300 rounded-none px-4 py-2.5 text-xs focus:border-blue-600 outline-none transition-all placeholder-gray-400 text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Joining Date *
                  </label>
                  <input
                    type="date" required
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-4 py-2 text-xs focus:border-blue-600 outline-none transition-all text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Branch Hub *
                  </label>
                  <input
                    type="text" required
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="e.g. Pondicherry Main Campus"
                    className="w-full bg-white border border-gray-300 rounded-none px-4 py-2.5 text-xs focus:border-blue-600 outline-none transition-all placeholder-gray-400 text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Designation *
                  </label>
                  <input
                    type="text" required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Senior Math Lecturer"
                    className="w-full bg-white border border-gray-300 rounded-none px-4 py-2.5 text-xs focus:border-blue-600 outline-none transition-all placeholder-gray-400 text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. sarah@achariya.org"
                    className="w-full bg-white border border-gray-300 rounded-none px-4 py-2.5 text-xs focus:border-blue-600 outline-none transition-all placeholder-gray-400 text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Contact Mobile (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.mobileNo}
                    onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-white border border-gray-300 rounded-none px-4 py-2.5 text-xs focus:border-blue-600 outline-none transition-all placeholder-gray-400 text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Subjects Assigned (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.subjects}
                    onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                    placeholder="e.g. Mathematics, Physics"
                    className="w-full bg-white border border-gray-300 rounded-none px-4 py-2.5 text-xs focus:border-blue-600 outline-none transition-all placeholder-gray-400 text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Qualifications
                  </label>
                  <input
                    type="text"
                    value={formData.qualifications}
                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                    placeholder="e.g. M.Sc. Mathematics, B.Ed."
                    className="w-full bg-white border border-gray-300 rounded-none px-4 py-2.5 text-xs focus:border-blue-600 outline-none transition-all placeholder-gray-400 text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Grades In-charge (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.gradesInCharge}
                    onChange={(e) => setFormData({ ...formData, gradesInCharge: e.target.value })}
                    placeholder="e.g. Grade 11, Grade 12"
                    className="w-full bg-white border border-gray-300 rounded-none px-4 py-2.5 text-xs focus:border-blue-600 outline-none transition-all placeholder-gray-400 text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Professional Experience
                  </label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="e.g. 8 years teaching high school mathematics"
                    className="w-full bg-white border border-gray-300 rounded-none px-4 py-2.5 text-xs focus:border-blue-600 outline-none transition-all placeholder-gray-400 text-gray-900 font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit" disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white px-6 py-3 rounded-none font-bold disabled:opacity-50 text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {actionLoading ? "Registering..." : (
                    <>
                      <UserPlus size={14} /> Register & Onboard
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
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Upload Area */}
          <div className="bg-white border border-gray-200 rounded-none p-8 shadow-sm">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-gray-900">Bulk Educator Onboarding</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Upload an Excel (.xlsx, .xls) or CSV template file to onboard multiple teachers.
                </p>
              </div>

              {/* Upload Drop area */}
              <div className="border-2 border-dashed border-gray-300 hover:border-blue-600/35 rounded-none p-8 flex flex-col items-center justify-center gap-4 bg-gray-50/20 transition-colors group cursor-pointer relative shadow-sm">
                <input
                  type="file" accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="h-14 w-14 rounded-none bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                  <UploadCloud size={24} />
                </div>
                <div className="text-center">
                  {uploadFile ? (
                    <p className="font-bold text-xs text-blue-600">{uploadFile.name}</p>
                  ) : (
                    <>
                      <p className="font-bold text-xs text-gray-700">Click or drag spreadsheet here</p>
                      <p className="text-[10px] text-gray-400 mt-1">Accepts Excel sheets or CSV files</p>
                    </>
                  )}
                </div>
              </div>

              {/* Sample loader checkbox */}
              <label className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-none hover:border-blue-600/30 transition-colors shadow-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  onChange={(e) => handleLoadSampleData(e.target.checked)}
                  className="h-4 w-4 rounded-none border-gray-300 text-blue-650 focus:ring-blue-600 cursor-pointer mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-bold text-gray-800">
                    Pre-populate with Sample Teacher Dataset
                  </span>
                  <p className="text-gray-400 mt-0.5">
                    Pre-populate the preview grid with 3 high-quality sample educator profiles to test bulk onboarding.
                  </p>
                </div>
              </label>

              {/* Info Note */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-none text-xs text-gray-500 leading-relaxed flex gap-3 shadow-sm">
                <FileSpreadsheet size={16} className="text-blue-650 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 mb-1">Expected Template Structure:</p>
                  <p>
                    Ensure columns exist for: <span className="font-mono text-blue-605 font-bold">User ID</span> (Employee ID), <span className="font-mono text-blue-605 font-bold">Full Name</span>, <span className="font-mono text-blue-605 font-bold">Joining Date</span>, <span className="font-mono text-blue-605 font-bold">Branch</span>, and <span className="font-mono text-blue-605 font-bold">Designation</span>. Fields like Subjects, Qualifications, Grades, and Experience are optional.
                  </p>
                </div>
              </div>

              {uploadFile && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleParseExcel} disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-none font-bold transition-all disabled:opacity-50 text-xs flex items-center gap-2 cursor-pointer shadow-sm border border-blue-600"
                  >
                    {actionLoading ? "Parsing spreadsheet..." : "Parse & Preview Dataset"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upload preview editable Grid */}
          {uploadPreviewOpen && parsedTeachers.length > 0 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-black text-gray-900">Interactive Dataset Preview</h4>
                  <p className="text-xs text-gray-500">
                    Double-check or modify parsed fields directly below before bulk importing.
                  </p>
                </div>

                <button
                  onClick={handleImportParsed} disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-none font-bold shadow-sm transition-all text-xs flex items-center gap-2 border border-emerald-600 cursor-pointer"
                >
                  <CheckCircle size={14} /> Import {parsedTeachers.length} Teachers
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-none overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[350px] custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">Employee ID</th>
                        <th className="px-4 py-3">Full Name</th>
                        <th className="px-4 py-3">Branch Hub</th>
                        <th className="px-4 py-3">Designation</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Subjects</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {parsedTeachers.map((t, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/30 transition-colors border-b border-gray-100">
                          <td className="px-4 py-2 font-mono">
                            <input
                              type="text"
                              value={t.userId}
                              onChange={(e) => handlePreviewCellChange(idx, "userId", e.target.value)}
                              className="bg-transparent border border-transparent focus:border-blue-600 rounded-none px-2 py-1 text-xs font-mono w-28 focus:bg-white text-gray-900 outline-none"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={t.userName}
                              onChange={(e) => handlePreviewCellChange(idx, "userName", e.target.value)}
                              className="bg-transparent border border-transparent focus:border-blue-600 rounded-none px-2 py-1 text-xs font-bold w-40 focus:bg-white text-gray-900 outline-none"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={t.branch}
                              onChange={(e) => handlePreviewCellChange(idx, "branch", e.target.value)}
                              className="bg-transparent border border-transparent focus:border-blue-600 rounded-none px-2 py-1 text-xs w-44 focus:bg-white text-gray-900 outline-none"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={t.designation}
                              onChange={(e) => handlePreviewCellChange(idx, "designation", e.target.value)}
                              className="bg-transparent border border-transparent focus:border-blue-600 rounded-none px-2 py-1 text-xs w-40 focus:bg-white text-gray-900 outline-none"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="email"
                              value={t.email}
                              onChange={(e) => handlePreviewCellChange(idx, "email", e.target.value)}
                              className="bg-transparent border border-transparent focus:border-blue-600 rounded-none px-2 py-1 text-xs w-44 focus:bg-white text-gray-900 outline-none"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={Array.isArray(t.subjects) ? t.subjects.join(", ") : t.subjects}
                              onChange={(e) => handlePreviewCellChange(idx, "subjects", e.target.value)}
                              className="bg-transparent border border-transparent focus:border-blue-600 rounded-none px-2 py-1 text-xs w-44 focus:bg-white text-gray-800 outline-none"
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

      {/* MODAL: Edit Teacher */}
      {editingTeacher && editFormData && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full border border-gray-300 p-6 space-y-6 shadow-2xl rounded-none relative">
            <button
              onClick={() => setEditingTeacher(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-base font-black text-gray-900">Update Educator Profile</h3>
              <p className="text-xs text-gray-550">Make adjustments to the selected profile information.</p>
            </div>

            <form onSubmit={handleUpdateTeacher} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Employee ID</label>
                  <input
                    type="text" required
                    value={editFormData.userId}
                    onChange={(e) => setEditFormData({ ...editFormData, userId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-1.5 text-xs font-mono text-gray-600 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Full Name</label>
                  <input
                    type="text" required
                    value={editFormData.userName}
                    onChange={(e) => setEditFormData({ ...editFormData, userName: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-900 focus:border-blue-600 outline-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Branch Hub</label>
                  <input
                    type="text" required
                    value={editFormData.branch}
                    onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-900 focus:border-blue-600 outline-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Designation</label>
                  <input
                    type="text" required
                    value={editFormData.designation}
                    onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-900 focus:border-blue-600 outline-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={editFormData.email || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-900 focus:border-blue-600 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Contact Mobile</label>
                  <input
                    type="text"
                    value={editFormData.mobileNo || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, mobileNo: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-900 focus:border-blue-600 outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Subjects (Comma separated)</label>
                  <input
                    type="text"
                    value={editFormData.subjects}
                    onChange={(e) => setEditFormData({ ...editFormData, subjects: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-800 focus:border-blue-600 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Qualifications</label>
                  <input
                    type="text"
                    value={editFormData.qualifications || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, qualifications: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-900 focus:border-blue-600 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Status State</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs text-gray-900 focus:border-blue-600 outline-none font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              {modalError && (
                <p className="text-xs text-red-600 font-bold">{modalError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button" onClick={() => setEditingTeacher(null)}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 text-xs cursor-pointer rounded-none"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 text-xs cursor-pointer disabled:opacity-50 rounded-none flex items-center gap-1 border border-blue-600"
                >
                  {actionLoading && <RefreshCw size={11} className="animate-spin" />}
                  Save Profile changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reset Password */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full border border-gray-300 p-6 space-y-5 shadow-2xl rounded-none relative">
            <button
              onClick={() => { setShowPasswordReset(null); setNewPassword(""); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-base font-black text-gray-900">Reset Educator Password</h3>
              <p className="text-xs text-gray-550">Define a new password credential for this teacher profile.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">New Password Credentials</label>
                <input
                  type="password" required minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-2 text-xs font-bold text-gray-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-250">
                <button
                  type="button" onClick={() => { setShowPasswordReset(null); setNewPassword(""); }}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 text-xs cursor-pointer rounded-none"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 text-xs cursor-pointer disabled:opacity-50 rounded-none flex items-center gap-1 border border-blue-600"
                >
                  {actionLoading && <RefreshCw size={11} className="animate-spin" />}
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
