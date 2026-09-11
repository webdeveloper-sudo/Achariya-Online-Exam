"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("teacherToken");
    if (token) {
      router.replace("/teacher/dashboard");
    } else {
      router.replace("/teacher/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <p className="text-sm text-gray-500">Redirecting...</p>
    </div>
  );
}
