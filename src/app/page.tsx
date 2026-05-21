import Link from "next/link";
import { ShieldAlert, BookOpen, ChevronRight, Award, GraduationCap, Server } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px] pointer-events-none" />

      {/*  */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">
            A
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              ACHARIYA
            </h1>
            <p className="text-[10px] text-emerald-400 font-medium tracking-widest uppercase">
              Assessment Portal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          <Server size={12} className="text-emerald-400 animate-pulse" />
          <span>Database Connected (Neon)</span>
        </div>
      </header>

      {/* Hero  */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 flex flex-col items-center justify-center py-16 relative z-10">
        <div className="text-center max-w-3xl mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
            <Award size={14} />
            <span>Next-Generation Evaluation Engine</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
            Empowering Educators,<br />
            Standardizing Excellence.
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Welcome to the Achariya Online Examination and Assessment System. Choose your gateway to access your dashboard.
          </p>
        </div>

        {/* Portals Selection Grid */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
          {/* Super Admin Portal Card */}
          <Link href="/admin/login" className="group">
            <div className="h-full bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group shadow-2xl hover:shadow-indigo-500/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
              
              <div className="space-y-6">
                <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <ShieldAlert size={28} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                    Super Admin Portal
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Access the master control panel to manage teacher onboarding, view platform metrics, adjust global configurations, and manage assessments.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                  Master Control Gateway
                </span>
                <div className="h-8 w-8 rounded-full bg-white/5 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center text-slate-400 transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </Link>

          {/* Teacher Portal Card */}
          <Link href="/teacher/login" className="group">
            <div className="h-full bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group shadow-2xl hover:shadow-emerald-500/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />

              <div className="space-y-6">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <BookOpen size={28} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Educator Portal
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    First-time activation or daily sign-in for teachers. Access dashboards, configure exam papers, schedule online assessments, and evaluate student responses.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                  Teacher Terminal
                </span>
                <div className="h-8 w-8 rounded-full bg-white/5 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center text-slate-400 transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 text-center text-xs text-slate-500 border-t border-white/5 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 Achariya Educational Group. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors">Security Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Technical Support</a>
        </div>
      </footer>
    </div>
  );
}
