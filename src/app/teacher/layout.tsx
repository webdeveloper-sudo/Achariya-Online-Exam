"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

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

  // Derive active tab for standard sidebar
  let activeTab = "dashboard";
  if (pathname.includes("/teacher/generate")) {
    activeTab = "generator";
  } else if (pathname.includes("/teacher/assessments")) {
    activeTab = "assessments";
  }

  const handleTabChange = (tab: string) => {
    if (tab === "dashboard") {
      router.push("/teacher/dashboard");
    } else if (tab === "generator") {
      router.push("/teacher/generate");
    } else if (tab === "assessments") {
      router.push("/teacher/assessments");
    }
  };

  // Don't show sidebar on login/activate pages
  const noSidebarRoutes = ["/teacher/login", "/teacher/activate"];
  if (noSidebarRoutes.includes(pathname)) return <>{children}</>;

  return (
    <div className="min-h-screen font-sans flex relative overflow-hidden bg-transparent text-gray-900">
      {/* Shared Global Sidebar */}
      <Sidebar
        role="teacher"
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        userName={teacher?.userName || "Educator"}
        userEmail={teacher?.email || "no-reply@achariya.org"}
        onLogout={handleLogout}
      />

      {/* Page content */}
      <div className="flex-1 h-screen overflow-y-auto relative z-10">
        {children}
      </div>
    </div>
  );
}
