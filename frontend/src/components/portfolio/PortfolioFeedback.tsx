"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface FeedbackItem {
  project: string;
  strength: string;
  missing: string;
  suggestion: string;
}

interface LongProject {
  name: string;
  description: string;
}

interface FeedbackData {
  evidence_quality: FeedbackItem[];
  storytelling: string;
  gaps_in_presentation: string[];
  quick_wins: string[];
  longer_projects: LongProject[];
}

export default function PortfolioFeedback() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState("");
  const [targetRoleId, setTargetRoleId] = useState("data-scientist-mid");
  const [githubUsername, setGithubUsername] = useState("");
  
  useEffect(() => {
    setSessionId(searchParams.get("session_id") || localStorage.getItem("Career Lens_session_id") || "demo-session");
    setTargetRoleId(localStorage.getItem("Career Lens_role_id") || "data-scientist-mid");
    setGithubUsername(localStorage.getItem("Career Lens_github") || "priyasharma-dev");
  }, [searchParams]);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [githubSummary, setGithubSummary] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setFeedback(null);
    setGithubSummary(null);
    
    try {
      // 1. Analyze GitHub Username if provided
      if (githubUsername.trim()) {
        try {
          const ghRes = await fetch("http://localhost:8000/api/v1/portfolio/analyze-github", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: githubUsername }),
          });
          if (ghRes.ok) {
            const ghData = await ghRes.ok ? await ghRes.json() : null;
            setGithubSummary(ghData);
          }
        } catch (e) {
          console.error("Error analyzing GitHub:", e);
        }
      }
      
      // 2. Fetch Portfolio Feedback Recommendations
      const feedbackRes = await fetch("http://localhost:8000/api/v1/portfolio/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          target_role_id: targetRoleId,
          portfolio_text: pdfFile ? `Resume PDF: ${pdfFile.name}` : "Bio submission",
          github_username: githubUsername
        }),
      });
      
      const feedbackData = await feedbackRes.json();
      setFeedback(feedbackData);
      
    } catch (e) {
      console.error(e);
      // Mock fallback
      setFeedback({
        evidence_quality: [
          { project: "React Task Tracker", strength: "Functional interactive layout.", missing: "No database connectivity.", suggestion: "Integrate mock localStorage or IndexedDB." },
          { project: "Math Algorithms repo", strength: "Clear mathematical implementations.", missing: "Lacks API interfaces.", suggestion: "Wrap logic in FastAPI endpoints." }
        ],
        storytelling: "Strong theoretical focus, but lacks production engineering descriptions.",
        gaps_in_presentation: ["SQL schemas mentioned but not visible in repos."],
        quick_wins: ["Add schema files to README", "Include dependency specifications"],
        longer_projects: [
          { name: "Distributed API Engine", description: "Write an API managing parallel processing schedules." }
        ]
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone & Inputs Panel */}
      <div className="glass-panel rounded-2xl p-6 border border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Resume PDF Upload</label>
          <div className="relative border border-dashed border-zinc-800 rounded-xl h-12 flex items-center justify-between px-3 bg-zinc-950/20">
            <span className="text-xs text-zinc-500 truncate w-[75%]">
              {pdfFile ? pdfFile.name : "Select resume file..."}
            </span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              Browse
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">GitHub Username</label>
          <input
            type="text"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 px-4 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="github-username"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="h-12 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/20"
        >
          {analyzing ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Analyzing portfolio...
            </>
          ) : (
            "Analyze Portfolio & Codebase 📊"
          )}
        </button>
      </div>

      {/* Split Feedback Layout */}
      {feedback && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Profile Summaries & Repository Data */}
          <div className="space-y-6">
            {githubSummary && (
              <div className="glass-panel rounded-2xl p-6 border border-zinc-800/80 space-y-4">
                <h3 className="text-lg font-bold font-display text-white">GitHub Codebase Summary</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-900 space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Primary Competencies</p>
                    <p className="text-xs font-bold text-indigo-300">
                      {githubSummary.primary_skills?.join(", ") || "Python, JS"}
                    </p>
                  </div>
                  <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-900 space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Work Habits</p>
                    <p className="text-xs text-zinc-300 truncate">
                      {githubSummary.work_style_notes || "Continuous practice"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Skill Assessments</p>
                  <div className="grid grid-cols-3 gap-2">
                    {githubSummary.skill_levels && Object.entries(githubSummary.skill_levels).map(([skill, lvl]) => (
                      <div key={skill} className="bg-zinc-900/40 border border-zinc-800/40 rounded-lg p-2.5 text-center">
                        <p className="text-xs font-bold text-white truncate">{skill}</p>
                        <p className={`text-[9px] font-bold font-mono mt-1 ${
                          lvl === "advanced" ? "text-green-400" : lvl === "intermediate" ? "text-yellow-400" : "text-blue-400"
                        }`}>{String(lvl).toUpperCase()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="glass-panel rounded-2xl p-6 border border-zinc-800/80 space-y-4">
              <h3 className="text-lg font-bold font-display text-white">Storytelling & Narrative Fit</h3>
              <p className="text-xs leading-relaxed text-zinc-300 bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl italic">
                "{feedback.storytelling}"
              </p>
              
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Evidence Presentation Gaps</p>
                <ul className="space-y-1.5 list-disc pl-5 text-xs text-zinc-400">
                  {feedback.gaps_in_presentation.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Panel: Actionable Feedback Annotations */}
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-zinc-800/80 space-y-4">
              <h3 className="text-lg font-bold font-display text-white">Actionable Code improvements</h3>
              
              <div className="space-y-4">
                {feedback.evidence_quality.map((item, idx) => (
                  <div key={idx} className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">Project</span>
                      {item.project}
                    </p>
                    <p className="text-[11px] text-zinc-400"><strong className="text-green-400">Strength:</strong> {item.strength}</p>
                    <p className="text-[11px] text-zinc-400"><strong className="text-red-400">Missing:</strong> {item.missing}</p>
                    <p className="text-[11px] text-zinc-300"><strong className="text-indigo-400">Action:</strong> {item.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Wins & Long Projects */}
            <div className="glass-panel rounded-2xl p-6 border border-zinc-800/80 space-y-5">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">⚡ Quick Wins <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-green-500/10 text-green-400">1 hour changes</span></h4>
                <ul className="space-y-1.5">
                  {feedback.quick_wins.map((win, idx) => (
                    <li key={idx} className="text-xs text-zinc-300 flex items-center gap-2">
                      <span className="text-green-500">✓</span> {win}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 pt-3 border-t border-zinc-900">
                <h4 className="text-sm font-bold text-white">🛠️ Recommended Portfolio Project additions</h4>
                {feedback.longer_projects.map((proj, idx) => (
                  <div key={idx} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4 space-y-1">
                    <p className="text-xs font-bold text-indigo-300">{proj.name}</p>
                    <p className="text-[11px] leading-relaxed text-zinc-400">{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
