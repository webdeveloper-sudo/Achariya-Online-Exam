"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Users, ClipboardCheck, LogOut, ShieldCheck } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem("adminToken");
    const u = localStorage.getItem("adminUser");
    if (!t || !u) { router.push("/admin/login"); return; }
    setAdminUser(JSON.parse(u));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") return <>{children}</>;

  const menuItems = [
    { href: "/admin/dashboard", label: "Educators Registry", icon: Users },
    { href: "/admin/assessments", label: "All Assessments", icon: ClipboardCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex relative overflow-hidden">
      <div className="absolute top-0 left-[-10%] w-[50%] h-[40%] rounded-full bg-indigo-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[130px] pointer-events-none" />

      {/* Sidebar */}
      {/* <aside className="w-64 bg-slate-950 border-r border-white/5 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-20">
        <div className="p-6 space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center font-bold text-lg text-white shadow-lg">A</div>
            <div>
              <h1 className="text-sm font-black text-white tracking-wider">ACHARIYA</h1>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Admin Gateway</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span className="truncate">Secure SSL Terminal Active</span>
          </div>

          <nav className="space-y-1.5 pt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive ? "bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/10 shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-slate-950" : "text-slate-400"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/5 bg-slate-900/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 flex items-center justify-center text-slate-300 font-black text-sm">SA</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">Super Admin</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{adminUser?.email || "admin@achariya.org"}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 text-[11px] font-bold transition-all"
          >
            <LogOut size={13} /> Exit Session
          </button>
        </div>
      </aside> */}

      <div className="flex-1 h-screen overflow-y-auto relative z-10">
        {children}
      </div>
    </div>
  );
}
