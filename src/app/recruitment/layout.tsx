"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [recruiter, setRecruiter] = useState<any>(null);

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
    <div className="min-h-screen font-sans flex relative overflow-hidden bg-transparent text-gray-900">
      {/* Shared Global Sidebar */}
      <Sidebar
        role="recruiter"
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        userName={recruiter?.name || "Recruiter"}
        userEmail={recruiter?.email || "recruitment@achariya.org"}
        onLogout={handleLogout}
      />

      {/* Page content */}
      <div className="flex-1 h-screen overflow-y-auto relative z-10">
        {children}
      </div>
    </div>
  );
}

