"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem("adminToken");
    const u = localStorage.getItem("adminUser");
    if (!t || !u) {
      router.push("/admin/login");
      return;
    }
    setAdminUser(JSON.parse(u));
  }, []);

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <>
    <div className="min-h-screen font-sans flex relative overflow-hidden bg-transparent text-gray-900">
      <div className="flex-1  h-screen overflow-y-auto relative z-10">
        {children}
      </div>
      
    </div>
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
    </>
  );
}
