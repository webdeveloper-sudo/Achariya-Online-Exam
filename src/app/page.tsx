import Link from "next/link";
import { ShieldAlert, BookOpen, ChevronRight, Briefcase } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen text-gray-900 font-sans flex flex-col justify-between relative overflow-hidden bg-transparent pt-20">
      {/* Brand Navbar identical to Careers Portal */}
      <header className="w-full bg-[#C72323] shadow-lg fixed top-0 left-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-1 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-wider">ACHARIYA</h1>
            <span className="text-[10px] text-white/80 font-bold tracking-widest uppercase border-l border-white/20 pl-3 hidden sm:inline">
             Online Exam Portal
            </span>
          </Link>
          <img 
            src="/images/Achariya-Logo-01-scaled.avif" 
            alt="Achariya Logo" 
            className="w-20 h-auto object-contain py-1"
          />
        </div>
      </header>

      {/* Main Hero & Selection Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 flex flex-col items-center justify-center py-16 relative z-10">
        <div className="text-center max-w-3xl mb-12 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Build Your Future with <span className="text-[#C72323]">ACHARIYA</span>
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Welcome to the Achariya Online Examination and Assessment System. Select your gateway to access your dashboard terminal.
          </p>
        </div>

        {/* Portals Selection Grid */}
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl px-4">
          
          {/* Super Admin Portal Card */}
          <Link href="/admin/login" className="group flex flex-col h-full">
            <div className="bg-white/80 backdrop-blur-md border border-gray-300 p-6 flex flex-col justify-between h-full hover:border-gray-500 hover:shadow-xl transition-all duration-300">
              <div className="space-y-6">
                {/* Standard Brand Logo Icon Box with zero radius */}
                <div className="w-12 h-12 bg-[#C72323] flex items-center justify-center text-white shrink-0">
                  <ShieldAlert size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#20407D] transition-colors">
                    Super Admin Portal
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Access the master control panel to manage teacher onboarding, view platform metrics, adjust global configurations, and manage assessments.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <span className="text-[10px] text-[#20407D] font-bold uppercase tracking-wider">
                  Master Gateway
                </span>
                <span className="inline-flex items-center gap-1 bg-[#20407D] text-white px-3 py-1.5 text-[11px] font-semibold hover:bg-blue-700 transition-colors">
                  Enter Portal <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </Link>

          {/* Teacher Portal Card */}
          <Link href="/teacher/login" className="group flex flex-col h-full">
            <div className="bg-white/80 backdrop-blur-md border border-gray-300 p-6 flex flex-col justify-between h-full hover:border-gray-500 hover:shadow-xl transition-all duration-300">
              <div className="space-y-6">
                {/* Standard Brand Logo Icon Box with zero radius */}
                <div className="w-12 h-12 bg-[#C72323] flex items-center justify-center text-white shrink-0">
                  <BookOpen size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#20407D] transition-colors">
                    Educator Portal
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    First-time activation or daily sign-in for teachers. Access dashboards, configure exam papers, schedule online assessments, and evaluate student responses.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <span className="text-[10px] text-[#20407D] font-bold uppercase tracking-wider">
                  Teacher Terminal
                </span>
                <span className="inline-flex items-center gap-1 bg-[#20407D] text-white px-3 py-1.5 text-[11px] font-semibold hover:bg-blue-700 transition-colors">
                  Enter Portal <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </Link>

          {/* Recruitment Portal Card */}
          <Link href="/recruitment/login" className="group flex flex-col h-full">
            <div className="bg-white/80 backdrop-blur-md border border-gray-300 p-6 flex flex-col justify-between h-full hover:border-gray-500 hover:shadow-xl transition-all duration-300">
              <div className="space-y-6">
                {/* Standard Brand Logo Icon Box with zero radius */}
                <div className="w-12 h-12 bg-[#C72323] flex items-center justify-center text-white shrink-0">
                  <Briefcase size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#20407D] transition-colors">
                    Recruiter Portal
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Access the talent acquisition and recruitment panel. Design AI candidate assessments, monitor live proctor waitrooms, and evaluate applicants.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <span className="text-[10px] text-[#20407D] font-bold uppercase tracking-wider">
                  Recruiter Console
                </span>
                <span className="inline-flex items-center gap-1 bg-[#20407D] text-white px-3 py-1.5 text-[11px] font-semibold hover:bg-blue-700 transition-colors">
                  Enter Portal <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </Link>

        </div>
      </main>

      {/* Footer identical to Careers portal */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center mt-auto border-t border-gray-800 relative z-10">
        <p className="text-white font-semibold mb-2">ACHARIYA Online Exam Portal</p>
        <p className="text-xs">
          © {new Date().getFullYear()} Achariya Group. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
