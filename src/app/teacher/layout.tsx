"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Menu } from "lucide-react";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [teacher, setTeacher] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  } else if (pathname.includes("/teacher/live-sessions")) {
    activeTab = "live_sessions";
  }

  const handleTabChange = (tab: string) => {
    if (tab === "dashboard") {
      router.push("/teacher/dashboard");
    } else if (tab === "generator") {
      router.push("/teacher/generate");
    } else if (tab === "assessments") {
      router.push("/teacher/assessments");
    } else if (tab === "live_sessions") {
      router.push("/teacher/live-sessions");
    }
  };

  // Don't show sidebar on login/activate pages
  const noSidebarRoutes = ["/teacher/login", "/teacher/activate"];
  if (noSidebarRoutes.includes(pathname)) return <>{children}</>;

  return (
    <div className="min-h-screen font-sans flex flex-col md:flex-row relative overflow-hidden bg-transparent text-gray-900" data-portal-layout="true">
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
        role="teacher"
        activeTab={activeTab}
        setActiveTab={(tab) => {
          handleTabChange(tab);
          setIsSidebarOpen(false);
        }}
        userName={teacher?.userName || "Educator"}
        userEmail={teacher?.email || "no-reply@achariya.org"}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Page content */}
      <div className="flex-1 container mx-auto py-8 h-screen overflow-y-auto relative z-10">
        {children}
      </div>
    </div>
  );
}
