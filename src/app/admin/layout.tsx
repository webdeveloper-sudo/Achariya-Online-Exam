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
    <div className="min-h-screen font-sans flex relative overflow-hidden bg-transparent text-gray-900">
      <div className="flex-1 h-screen overflow-y-auto relative z-10">
        {children}
      </div>
    </div>
  );
}
