import React from "react";
import { LoaderIcon } from "lucide-react";

interface LoaderProps {
  message?: string;
  variant?: "fullPage" | "inline" | "card";
  className?: string;
}

export default function Loader({ message = "Loading details...", variant = "inline", className = "" }: LoaderProps) {
  if (variant === "fullPage") {
    return (
      <div 
        className={`fixed inset-0 bg-transparent backdrop-blur-sm z-[9999] flex flex-col items-center justify-center space-y-4 ${className}`}
        role="status"
        aria-label={message}
      >
        <div className="h-12 w-12 border-4 border-blue-200 border-t-[#20407D] animate-spin" style={{ borderRadius: "50%" }} />
        <span className="font-bold text-sm text-gray-700 animate-pulse uppercase tracking-wider font-sans">{message}</span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div 
        className={`p-12 flex flex-col items-center justify-center space-y-4 bg-transparent  rounded-none  min-h-[200px] ${className}`}
        role="status"
        aria-label={message}
      >
        <div className="h-10 w-10 border-4 border-blue-100 border-t-[#20407D] animate-spin" style={{ borderRadius: "50%" }} />
        <span className="font-bold text-xs text-gray-500 uppercase tracking-widest font-sans">{message}</span>
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center justify-center space-x-2 text-gray-500 p-4 font-sans ${className}`}
      role="status"
      aria-label={message}
    >
      <LoaderIcon className="h-4 w-4 animate-spin text-[#20407D]" />
      <span className="text-xs font-bold uppercase tracking-wider">{message}</span>
    </div>
  );
}
