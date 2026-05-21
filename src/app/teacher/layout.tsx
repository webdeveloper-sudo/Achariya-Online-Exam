"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Brain,
  ClipboardCheck,
  LogOut,
  ShieldCheck,
  Activity,
} from "lucide-react";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [teacher, setTeacher] = useState<any>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("teacherToken");
    const savedUser = localStorage.getItem("teacherUser");
    if (!savedToken || !savedUser) {
      router.push("/teacher/login");
      return;
    }
    setTeacher(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacherUser");
    router.push("/");
  };

  const menuItems = [
    { href: "/teacher/dashboard", label: "Console Overview", icon: LayoutDashboard },
    { href: "/teacher/generate", label: "AI Generator", icon: Brain },
    { href: "/teacher/assessments", label: "My Assessments", icon: ClipboardCheck },
    { href: "/teacher/live-sessions", label: "Conducted Sessions", icon: Activity },
  ];

  // Don't show sidebar on login/activate pages
  const noSidebarRoutes = ["/teacher/login", "/teacher/activate"];
  if (noSidebarRoutes.includes(pathname)) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-[-10%] w-[50%] h-[40%] rounded-full bg-emerald-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[130px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-white/5 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-20">
        <div className="p-6 space-y-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-emerald-500/10">
              A
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-wider">ACHARIYA</h1>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Educator Hub</p>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span className="truncate">Secure SSL Terminal Active</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5 pt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              // active if exact match OR if we're on a subroute (e.g. /teacher/assessments/123)
              const isActive =
                pathname === item.href ||
                (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/5"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-slate-950" : "text-slate-400"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-white/5 bg-slate-900/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 flex items-center justify-center text-slate-300 font-black text-sm uppercase">
              {teacher?.userName ? teacher.userName.slice(0, 2) : "AC"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">{teacher?.userName || "Educator"}</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{teacher?.email || "no-reply@achariya.org"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 text-[11px] font-bold transition-all"
          >
            <LogOut size={13} />
            <span>Exit Session</span>
          </button>
        </div>
      </aside>

      {/* Page content */}
      <div className="flex-1 h-screen overflow-y-auto relative z-10">
        {children}
      </div>
    </div>
  );
}
