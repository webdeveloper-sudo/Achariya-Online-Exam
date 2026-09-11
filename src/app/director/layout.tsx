"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Menu } from "lucide-react";

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [director, setDirector] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("directorToken");
    const savedUser = localStorage.getItem("directorUser");
    if (!savedToken || !savedUser) {
      router.push("/director/login");
      return;
    }
    setDirector(JSON.parse(savedUser));
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("directorToken");
    localStorage.removeItem("directorUser");
    router.push("/");
  };

  // Derive active tab for director sidebar
  let activeTab = "dashboard";
  if (pathname.includes("/director/generate")) {
    activeTab = "generator";
  } else if (pathname.includes("/director/teachers")) {
    activeTab = "teachers";
  } else if (pathname.includes("/director/sessions")) {
    activeTab = "sessions";
  } else if (pathname.includes("/director/assessments")) {
    activeTab = "assessments";
  }

  const handleTabChange = (tab: string) => {
    if (tab === "dashboard") {
      router.push("/director/dashboard");
    } else if (tab === "generator") {
      router.push("/director/generate");
    } else if (tab === "teachers") {
      router.push("/director/teachers");
    } else if (tab === "sessions") {
      router.push("/director/sessions");
    } else if (tab === "assessments") {
      router.push("/director/assessments");
    }
  };

  // Don't show sidebar on login page
  if (pathname === "/director/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen  font-sans flex flex-col md:flex-row relative overflow-hidden bg-transparent text-gray-900" data-portal-layout="true">
      {/* Soft Ambient Glows (matching recruitment theme but optimized for director blue/red) */}
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
        role="director"
        activeTab={activeTab}
        setActiveTab={(tab) => {
          handleTabChange(tab);
          setIsSidebarOpen(false);
        }}
        userName={director?.name || "Director"}
        userEmail={director?.email || "director.la@achariya.org"}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Page content */}
      <div className="flex-1 h-screen py-8 overflow-y-auto relative z-10">
        {children}
      </div>
    </div>
  );
}
