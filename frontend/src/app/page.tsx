import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-10 text-center py-10 px-4">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[80px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[70px] -z-10" />

      {/* Hero Header */}
      <div className="space-y-4 max-w-2xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
          🏆 Build a Winning Portfolio
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight text-white leading-tight">
          Find your career focus, <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Bridge your skill gaps.
          </span>
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
          Career Lens combines advanced vector similarity career matching with custom LangChain agents to map out exactly what you need to study and build.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          href="/assessment"
          className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/20 w-48 sm:w-auto"
        >
          Start Onboarding Wizard
        </Link>
        <Link
          href="/chat"
          className="h-12 px-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-sm font-semibold rounded-xl flex items-center justify-center transition-colors w-48 sm:w-auto"
        >
          Consult Aria Agent
        </Link>
      </div>

      {/* Trust Grid / Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full pt-10">
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800/40 text-left space-y-2">
          <span className="text-2xl">⚡</span>
          <h3 className="font-bold text-sm text-white">Semantic Vacancy Matching</h3>
          <p className="text-xs text-zinc-500 leading-normal">
            Vector similarity matches your profile description directly against hundreds of professional roles.
          </p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800/40 text-left space-y-2">
          <span className="text-2xl">🗺️</span>
          <h3 className="font-bold text-sm text-white">12-Week Custom Roadmap</h3>
          <p className="text-xs text-zinc-500 leading-normal">
            Get actionable, week-by-week study targets, milestone checks, and real training course links.
          </p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800/40 text-left space-y-2">
          <span className="text-2xl">📂</span>
          <h3 className="font-bold text-sm text-white">Resume & Code Audit</h3>
          <p className="text-xs text-zinc-500 leading-normal">
            Extract text from PDF resumes and analyze GitHub repositories for direct improvements.
          </p>
        </div>
      </div>
    </div>
  );
}
