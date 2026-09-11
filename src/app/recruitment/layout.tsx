"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Menu } from "lucide-react";

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [recruiter, setRecruiter] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("recruiterToken");
    const savedUser = localStorage.getItem("recruiterUser");
    if (!savedToken || !savedUser) {
      router.push("/recruitment/login");
      return;
    }
    setRecruiter(JSON.parse(savedUser));
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("recruiterToken");
    localStorage.removeItem("recruiterUser");
    router.push("/");
  };

  // Derive active tab for standard recruiter sidebar
  let activeTab = "dashboard";
  if (pathname.includes("/recruitment/generate")) {
    activeTab = "generator";
  } else if (pathname.includes("/recruitment/candidates")) {
    activeTab = "candidates";
  } else if (pathname.includes("/recruitment/sessions")) {
    activeTab = "sessions";
  } else if (pathname.includes("/recruitment/assessments")) {
    activeTab = "assessments";
  }

  const handleTabChange = (tab: string) => {
    if (tab === "dashboard") {
      router.push("/recruitment/dashboard");
    } else if (tab === "generator") {
      router.push("/recruitment/generate");
    } else if (tab === "candidates") {
      router.push("/recruitment/candidates");
    } else if (tab === "sessions") {
      router.push("/recruitment/sessions");
    } else if (tab === "assessments") {
      router.push("/recruitment/assessments");
    }
  };

  // Don't show sidebar on login page
  if (pathname === "/recruitment/login") {
    return <>{children}</>;
  }

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
        role="recruiter"
        activeTab={activeTab}
        setActiveTab={(tab) => {
          handleTabChange(tab);
          setIsSidebarOpen(false);
        }}
        userName={recruiter?.name || "Recruiter"}
        userEmail={recruiter?.email || "recruitment@achariya.org"}
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

