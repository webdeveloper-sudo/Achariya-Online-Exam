import {
  LayoutDashboard,
  Users,
  Brain,
  ClipboardCheck,
  LogOut,
  ShieldCheck,
  Activity,
  History
} from "lucide-react";

interface SidebarProps {
  role: "admin" | "teacher" | "recruiter" | "director";
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName: string;
  userEmail: string;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  role,
  activeTab,
  setActiveTab,
  userName,
  userEmail,
  onLogout,
  isOpen = false,
  onClose
}: SidebarProps) {
  const adminMenuItems = [
    { id: "teachers", label: "Educators Registry", icon: Users },
    { id: "assessments", label: "All Assessments", icon: ClipboardCheck },
    { id: "live_sessions", label: "Conducted Sessions", icon: Activity }
  ];

  const recruiterAdminMenuItems = [
    { id: "recruiter_candidates", label: "Candidate Registry", icon: Users },
    { id: "recruiter_sessions", label: "Recruiter Conducted Sessions", icon: Activity },
    { id: "recruiter_assessments", label: "Recruiters Assessments", icon: ClipboardCheck }
  ];

  const teacherMenuItems = [
    { id: "dashboard", label: "Console Overview", icon: LayoutDashboard },
    { id: "generator", label: "AI Generator", icon: Brain },
    { id: "assessments", label: "My Assessments", icon: ClipboardCheck },
    { id: "live_sessions", label: "Conducted Sessions", icon: Activity }
  ];

  const recruiterMenuItems = [
    { id: "generator", label: "AI Generator", icon: Brain },
    { id: "dashboard", label: "Console Overview", icon: LayoutDashboard },
    { id: "candidates", label: "Candidate Registry", icon: Users },
    { id: "sessions", label: "Sessions Conducted", icon: History },
    { id: "assessments", label: "Assessments", icon: ClipboardCheck }
  ];

  const directorMenuItems = [
    { id: "generator", label: "AI Generator", icon: Brain },
    { id: "dashboard", label: "Console Overview", icon: LayoutDashboard },
    { id: "teachers", label: "Teacher Registry", icon: Users },
    { id: "sessions", label: "Sessions Conducted", icon: History },
    { id: "assessments", label: "Assessments", icon: ClipboardCheck }
  ];

  let menuItems = adminMenuItems;
  if (role === "teacher") {
    menuItems = teacherMenuItems;
  } else if (role === "recruiter") {
    menuItems = recruiterMenuItems;
  } else if (role === "director") {
    menuItems = directorMenuItems;
  }

  let roleLabel = "Admin Gateway";
  if (role === "teacher") {
    roleLabel = "Educator Hub";
  } else if (role === "recruiter") {
    roleLabel = "Recruiter Console";
  } else if (role === "director") {
    roleLabel = "Director Console";
  }

  return (
    <>
      {/* Mobile Sidebar backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/45 z-45 md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        className={`w-72 bg-white/90 backdrop-blur-md border-r border-gray-300 flex flex-col justify-between h-screen shrink-0 select-none transition-transform duration-300 ease-in-out z-50 fixed inset-y-0 left-0 md:sticky md:top-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Upper Brand Section */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div className="flex items-center gap-3">
            {/* Logo box: sharp flat edges (no rounded corners) */}
            <div className="h-10 w-10 bg-[#C72323] flex items-center justify-center font-bold text-lg text-white shadow-sm">
              A
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 tracking-wider">ACHARIYA</h1>
              <p className="text-[10px] text-[#20407D] font-bold uppercase tracking-widest mt-0.5">
                {roleLabel}
              </p>
            </div>
          </div>

          {/* Security Badge - flat no-radius style */}
          <div className="flex items-center gap-2 text-[10px] text-gray-700 bg-gray-100 px-3 py-2 border border-gray-200">
            <ShieldCheck size={14} className="text-[#C72323] shrink-0" />
            <span className="truncate font-semibold">Secure SSL Terminal Active</span>
          </div>

          {/* Menu Navigation */}
          <nav className="space-y-6 pt-2">
            {role === "admin" ? (
              <>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 px-4 mb-2">Teacher Activities</p>
                  {adminMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id || 
                                     (item.id === "teachers" && ["list", "create", "upload"].includes(activeTab)) ||
                                     (item.id === "live_sessions" && activeTab === "view_live_session") ||
                                     (item.id === "assessments" && activeTab === "view_assessment");
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          if (onClose) onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-all ${
                          isActive
                            ? "bg-[#20407D] text-white"
                            : "text-gray-700 hover:text-[#20407D] hover:bg-gray-100"
                        }`}
                      >
                        <Icon size={16} className={isActive ? "text-white" : "text-gray-500"} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 px-4 mb-2">Recruiter Activities</p>
                  {recruiterAdminMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id || 
                                     (item.id === "recruiter_candidates" && activeTab === "view_recruiter_candidate") ||
                                     (item.id === "recruiter_sessions" && activeTab === "view_recruiter_session") ||
                                     (item.id === "recruiter_assessments" && activeTab === "view_recruiter_assessment");
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          if (onClose) onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-all ${
                          isActive
                            ? "bg-[#20407D] text-white"
                            : "text-gray-700 hover:text-[#20407D] hover:bg-gray-100"
                        }`}
                      >
                        <Icon size={16} className={isActive ? "text-white" : "text-gray-500"} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || 
                                   (item.id === "teachers" && (["list", "create", "upload"].includes(activeTab) || activeTab === "teacher_detail")) ||
                                   (item.id === "live_sessions" && activeTab === "view_live_session") ||
                                   (item.id === "candidates" && activeTab === "candidate_detail") ||
                                   (item.id === "assessments" && activeTab === "view_assessment");
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (onClose) onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-all ${
                        isActive
                          ? "bg-[#20407D] text-white"
                          : "text-gray-700 hover:text-[#20407D] hover:bg-gray-100"
                      }`}
                    >
                      <Icon size={16} className={isActive ? "text-white" : "text-gray-500"} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </nav>
        </div>

        {/* User profile footer card - flat no-radius style */}
        <div className="p-4 border-t border-gray-300 bg-gray-50 space-y-4">
          <div className="flex items-center gap-3">
            {/* Flat Avatar */}
            <div className="h-9 w-9 bg-[#20407D] text-white flex items-center justify-center font-black text-sm uppercase">
              {userName ? userName.slice(0, 2) : "AC"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-800 truncate">{userName || "Educator"}</p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">{userEmail || "no-reply@achariya.org"}</p>
            </div>
          </div>

          {/* Logout button - flat no-radius style */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 border border-red-200 hover:bg-[#C72323] hover:text-white text-[#C72323] text-[11px] font-bold transition-all cursor-pointer"
          >
            <LogOut size={13} />
            <span>Exit Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
