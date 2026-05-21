import {
  LayoutDashboard,
  Users,
  Brain,
  ClipboardCheck,
  LogOut,
  ShieldCheck,
  Zap,
  BookOpen,
  Activity
} from "lucide-react";

interface SidebarProps {
  role: "admin" | "teacher";
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

export default function Sidebar({
  role,
  activeTab,
  setActiveTab,
  userName,
  userEmail,
  onLogout
}: SidebarProps) {
  const adminMenuItems = [
    { id: "teachers", label: "Educators Registry", icon: Users },
    { id: "assessments", label: "All Assessments", icon: ClipboardCheck },
    { id: "live_sessions", label: "Conducted Sessions", icon: Activity }
  ];

  const teacherMenuItems = [
    { id: "dashboard", label: "Console Overview", icon: LayoutDashboard },
    { id: "generator", label: "AI Generator", icon: Brain },
    { id: "assessments", label: "My Assessments", icon: ClipboardCheck }
  ];

  const menuItems = role === "admin" ? adminMenuItems : teacherMenuItems;

  return (
    <aside className="w-64 bg-slate-950 border-r border-white/5 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      {/* Upper Brand Section */}
      <div className="p-6 space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-emerald-500/10">
            A
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-wider">ACHARIYA</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
              {role === "admin" ? "Admin Gateway" : "Educator Hub"}
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
          <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
          <span className="truncate">Secure SSL Terminal Active</span>
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1.5 pt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || 
                             (item.id === "teachers" && ["list", "create", "upload"].includes(activeTab)) ||
                             (item.id === "live_sessions" && activeTab === "view_live_session");
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/5"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} className={isActive ? "text-slate-950" : "text-slate-400"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User profile footer card */}
      <div className="p-4 border-t border-white/5 bg-slate-900/20 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 flex items-center justify-center text-slate-300 font-black text-sm uppercase">
            {userName ? userName.slice(0, 2) : "AC"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-200 truncate">{userName || "Educator"}</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{userEmail || "no-reply@achariya.org"}</p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 text-[11px] font-bold transition-all"
        >
          <LogOut size={13} />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
}
