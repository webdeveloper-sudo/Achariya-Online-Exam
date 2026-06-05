"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("directorToken");
    if (token) {
      router.replace("/director/dashboard");
    } else {
      router.replace("/director/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <p className="text-sm text-gray-500 font-bold">Redirecting...</p>
    </div>
  );
}
