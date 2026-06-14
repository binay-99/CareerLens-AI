"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Skill {
  skill: string;
  proficiency: number;
  evidence: string;
}

interface RoleMatch {
  id: string;
  title: string;
  family: string;
  match_score: number;
  fit_rationale: string;
  avg_salary_range: { min: number; max: number; currency: string };
}

export default function AssessmentWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState("session-priya-" + Math.floor(Math.random() * 10000));

  // Step 1: Bio
  const [bio, setBio] = useState(
    "I have a maths degree and taught myself Python last year. I built a Flask app for tracking my reading and a small data viz project using matplotlib. I want to move into tech but don't know where to start."
  );

  // Step 2: Extracted Skills
  const [skills, setSkills] = useState<Skill[]>([]);

  // Step 3: Portfolio
  const [github, setGithub] = useState("priyasharma-dev");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Step 4: Constraints & Role Selection
  const [hours, setHours] = useState(15);
  const [roles, setRoles] = useState<RoleMatch[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  // Step 5: Agent Pipeline Trace Log
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);

  // Extract skills from Bio
  const handleExtractSkills = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/assessment/extract-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: bio }),
      });
      const data = await res.json();
      setSkills(data);
      setStep(2);
    } catch (e) {
      console.error(e);
      // Mock fallback
      setSkills([
        { skill: "Python", proficiency: 0.6, evidence: "Self-taught Python (6 months)" },
        { skill: "Flask", proficiency: 0.5, evidence: "Built a Flask app for reading tracking" },
        { skill: "Matplotlib", proficiency: 0.5, evidence: "Data viz project using matplotlib" },
        { skill: "Statistics", proficiency: 0.7, evidence: "BSc Mathematics degree background" },
      ]);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // Perform Role Match Vector Query
  const handleMatchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/assessment/match-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills }),
      });
      const data = await res.json();
      setRoles(data);
      if (data.length > 0) {
        setSelectedRoleId(data[0].id);
      }
      setStep(4);
    } catch (e) {
      console.error(e);
      // Mock fallback
      const mockRoles = [
        { id: "data-scientist-mid", title: "Data Scientist (Mid-level)", family: "Data Science", match_score: 0.82, fit_rationale: "Matches Math degree and Python profile", avg_salary_range: { min: 75000, max: 120000, currency: "GBP" } },
        { id: "swe-backend-mid", title: "Backend Software Engineer (Mid-level)", family: "Engineering", match_score: 0.78, fit_rationale: "Matches Python and Flask projects", avg_salary_range: { min: 70000, max: 110000, currency: "GBP" } },
        { id: "qa-engineer-mid", title: "QA Automation Engineer (Mid-level)", family: "Engineering", match_score: 0.65, fit_rationale: "Basic Python and structured scripting match", avg_salary_range: { min: 50000, max: 80000, currency: "GBP" } }
      ];
      setRoles(mockRoles);
      setSelectedRoleId(mockRoles[0].id);
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (index: number, val: number) => {
    setSkills(prev => {
      const next = [...prev];
      next[index].proficiency = val;
      return next;
    });
  };

  const addCustomSkill = () => {
    setSkills(prev => [...prev, { skill: "New Skill", proficiency: 0.5, evidence: "Self-assessed" }]);
  };

  // Execute Pipeline Integration
  const runAgentPipeline = async () => {
    setStep(5);
    const logs = [
      "🔍 Loading normalized taxonomy...",
      "🧬 Compiling user skills embedding matrix...",
      "📊 Fetching roles and running cosine similarity search...",
      "🧠 Aligning gap scores against target role requirements...",
      "📍 Generating customized 12-week study plan guides...",
      "💾 Storing session context caches..."
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setPipelineLogs(prev => [...prev, logs[i]]);
    }

    // Call save endpoint
    try {
      await fetch("http://localhost:8000/api/v1/assessment/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          skills,
          goals: {
            hours_per_week: hours,
            target_role_id: selectedRoleId,
            github_username: github
          }
        }),
      });

      // Warm up roadmap
      await fetch("http://localhost:8000/api/v1/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          target_role_id: selectedRoleId,
          hours_per_week: hours
        })
      });

      // Navigate to chat
      localStorage.setItem("Career Lens_session_id", sessionId);
      localStorage.setItem("Career Lens_role_id", selectedRoleId);
      localStorage.setItem("Career Lens_github", github);
      router.push(`/chat?session_id=${sessionId}`);
    } catch (e) {
      console.error(e);
      // fallback save local
      localStorage.setItem("Career Lens_session_id", sessionId);
      localStorage.setItem("Career Lens_role_id", selectedRoleId);
      localStorage.setItem("Career Lens_github", github);
      router.push(`/chat?session_id=${sessionId}`);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-4">
      {/* Visual Step Indicator Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-initial">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold font-mono border transition-all ${
                step >= s
                  ? "bg-indigo-600 border-indigo-500 text-white shadow shadow-indigo-500/20"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500"
              }`}
            >
              {s}
            </div>
            {s < 5 && (
              <div
                className={`h-0.5 flex-1 mx-2 transition-all ${
                  step > s ? "bg-indigo-600" : "bg-zinc-800"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Contents */}
      <div className="glass-panel rounded-2xl p-8 border border-zinc-800/80 shadow-2xl">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-display text-white">Tell us about yourself</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Describe your educational background, projects, self-taught technologies, or work history.
              </p>
            </div>

            <textarea
              rows={6}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-zinc-200 focus:outline-none focus:border-indigo-500 text-sm leading-relaxed"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />

            <button
              onClick={handleExtractSkills}
              disabled={loading || !bio.trim()}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Extracting skills profile...
                </>
              ) : (
                "Extract Skills →"
              )}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-display text-white">Review Extracted Skills</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Aria extracted these skills from your bio. Adjust the proficiencies (0.0 to 1.0) or add missing ones.
              </p>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {skills.map((s, idx) => (
                <div key={idx} className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      className="bg-transparent font-semibold text-white focus:outline-none focus:border-indigo-500 text-sm border-b border-transparent hover:border-zinc-700"
                      value={s.skill}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSkills(prev => {
                          const next = [...prev];
                          next[idx].skill = val;
                          return next;
                        });
                      }}
                    />
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      {Math.round(s.proficiency * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    value={s.proficiency}
                    onChange={(e) => handleSliderChange(idx, parseFloat(e.target.value))}
                  />
                  <p className="text-[11px] text-zinc-500 italic">Evidence: {s.evidence}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={addCustomSkill}
                className="flex-1 h-12 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors text-zinc-300 font-medium rounded-xl text-sm"
              >
                + Add Custom Skill
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                Continue to Portfolio →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-display text-white">Portfolio Integration</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Link your GitHub projects and upload your resume to help Aria analyze your code repositories and professional background.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">GitHub Username</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-zinc-500 text-sm font-mono select-none">github.com/</span>
                  <input
                    type="text"
                    className="w-full bg-zinc-900/50 border border-zinc-850 focus:border-indigo-500 rounded-xl h-12 pl-28 pr-4 text-sm text-zinc-200 focus:outline-none font-mono transition-colors"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="username"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Resume PDF Upload (Optional)</label>
                <div className="relative border border-dashed border-zinc-800 hover:border-zinc-700/80 transition-all rounded-xl h-28 flex flex-col items-center justify-center bg-zinc-950/20 cursor-pointer p-4 group">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setResumeFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-200">📂</span>
                  <span className="text-xs text-zinc-300 mt-2 font-medium group-hover:text-zinc-200 transition-colors">
                    {resumeFile ? resumeFile.name : "Drag & drop or click to upload resume (PDF)"}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1">Only PDF format is supported</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 h-12 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 transition-colors text-zinc-350 font-medium rounded-xl text-sm"
              >
                ← Back
              </button>
              <button
                onClick={handleMatchRoles}
                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Finding Matches...
                  </>
                ) : (
                  "Find Career Matches →"
                )}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-display text-white">Select Target Career & Goals</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Choose one of the best matched roles to focus your personalized study roadmap.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Best Role Matches</label>
              <div className="space-y-3">
                {roles.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                      selectedRoleId === r.id
                        ? "bg-indigo-500/10 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.05)]"
                        : "bg-zinc-900/30 border-zinc-800/80 hover:border-zinc-700/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white text-sm">{r.title}</p>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-indigo-300">
                        Match: {Math.round(r.match_score * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">{r.fit_rationale}</p>
                    <p className="text-[11px] text-zinc-500 mt-1 font-semibold">
                      Avg Salary: {r.avg_salary_range.min.toLocaleString()} - {r.avg_salary_range.max.toLocaleString()} {r.avg_salary_range.currency}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Weekly Study Commitment</label>
                <div className="flex items-center gap-4 bg-zinc-950/20 border border-zinc-850 rounded-xl p-4">
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="5"
                    className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    value={hours}
                    onChange={(e) => setHours(parseInt(e.target.value))}
                  />
                  <span className="text-sm font-semibold font-mono text-indigo-400 w-20 text-right">
                    {hours} hrs/wk
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 h-12 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 transition-colors text-zinc-350 font-medium rounded-xl text-sm"
              >
                ← Back
              </button>
              <button
                onClick={runAgentPipeline}
                className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-550 transition-all text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                Analyze & Generate Roadmap 🚀
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 text-center py-6">
            <div className="relative mx-auto h-16 w-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <span className="text-xl">⚙️</span>
            </div>

            <div>
              <h2 className="text-xl font-bold font-display text-white">Running Career Agent Orchestration</h2>
              <p className="text-zinc-400 text-xs mt-1">Aria is assembling your career matcher profiles...</p>
            </div>

            <div className="bg-zinc-950 rounded-xl p-4 text-left font-mono text-xs text-zinc-400 space-y-2 border border-zinc-900 max-h-[200px] overflow-y-auto">
              {pipelineLogs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2 text-indigo-300/95">
                  <span className="text-[10px] text-zinc-600">{`[${new Date().toLocaleTimeString()}]`}</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
