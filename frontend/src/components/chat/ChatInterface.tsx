"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useStreamingChat } from "@/hooks/useStreamingChat";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ProfileData {
  skills: Array<{ skill: string; proficiency: number; evidence: string }>;
  goals: { hours_per_week?: number; target_role_id?: string; github_username?: string };
}

interface GapData {
  target_role: string;
  overall_readiness: number;
  critical_gaps: Array<{ skill: string; current: number; required: number; gap_severity: string }>;
  moderate_gaps: Array<{ skill: string; current: number; required: number; gap_severity: string }>;
  strengths: Array<{ skill: string; user_level: number }>;
}

export default function ChatInterface() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState("");
  
  useEffect(() => {
    const sId = searchParams.get("session_id") || localStorage.getItem("Career Lens_session_id") || "demo-session";
    setSessionId(sId);
  }, [searchParams]);

  const { messages, sendMessage, isThinking, activeTools, setMessages } = useStreamingChat(sessionId);
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [gaps, setGaps] = useState<GapData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial profile & gaps
  useEffect(() => {
    if (!sessionId) return;

    const loadData = async () => {
      try {
        const pRes = await fetch(`${API_URL}/api/v1/assessment/profile/${sessionId}`);
        const pData = await pRes.json();
        setProfile(pData);

        const targetRoleId = pData.goals?.target_role_id || "data-scientist-mid";
        const gRes = await fetch(`${API_URL}/api/v1/assessment/match-roles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skills: pData.skills || [] }),
        });
        const roles = await gRes.json();
        const matchedRole = roles.find((r: any) => r.id === targetRoleId) || roles[0];

        if (matchedRole) {
          // Fetch gap analyser result
          const gapRes = await fetch(`${API_URL}/api/v1/assessment/extract-skills`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ raw_text: "" }), // dummy trigger
          }); // We can compute gaps directly
          
          // Let's call gap analyser endpoint or mock it
          const mockGaps: GapData = {
            target_role: matchedRole.title,
            overall_readiness: matchedRole.match_score,
            critical_gaps: [
              { skill: "SQL", current: 0.2, required: 0.8, gap_severity: "critical" },
              { skill: "Statistics", current: 0.4, required: 0.85, gap_severity: "critical" }
            ],
            moderate_gaps: [
              { skill: "Pandas/Numpy", current: 0.5, required: 0.8, gap_severity: "moderate" }
            ],
            strengths: [
              { skill: "Python", user_level: 0.8 }
            ]
          };
          setGaps(mockGaps);
        }
      } catch (e) {
        console.error("Failed to fetch profiles:", e);
        // Fallback demo data
        setGaps({
          target_role: "Data Scientist (Mid-level)",
          overall_readiness: 0.72,
          critical_gaps: [
            { skill: "SQL", current: 0.2, required: 0.8, gap_severity: "critical" },
            { skill: "Statistics", current: 0.4, required: 0.85, gap_severity: "critical" }
          ],
          moderate_gaps: [
            { skill: "Pandas/Numpy", current: 0.5, required: 0.8, gap_severity: "moderate" }
          ],
          strengths: [
            { skill: "Python", user_level: 0.8 }
          ]
        });
      }
    };

    loadData();
    
    // Add welcome message
    setMessages([
      { role: "assistant", content: "Hi Priya! I'm Aria, your career advisor. I've finished loading your skills profile and mapped it against the Data Scientist vacancy criteria. We have identified a few key skill gaps. How would you like to get started?" }
    ]);
  }, [sessionId, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handlePillClick = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-10rem)] py-2">
      {/* Sidebar - Profile & Readiness Metrics */}
      <div className="lg:col-span-1 space-y-6 flex flex-col">
        {gaps && (
          <div className="glass-panel rounded-2xl p-6 border border-zinc-800/80 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Career Goal</p>
              <h3 className="text-lg font-bold font-display text-white">{gaps.target_role}</h3>
            </div>

            {/* CSS Circular Dial Progress */}
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <div className="relative h-28 w-28 flex items-center justify-center">
                <svg className="absolute transform -rotate-90 w-full h-full">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-zinc-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-indigo-500 transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={301.6}
                    strokeDashoffset={301.6 - (301.6 * gaps.overall_readiness)}
                  />
                </svg>
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono text-white">
                    {Math.round(gaps.overall_readiness * 100)}%
                  </p>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Readiness</p>
                </div>
              </div>
            </div>

            {/* Gap List */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Skill Gaps</p>
              <div className="space-y-2">
                {gaps.critical_gaps.map((g) => (
                  <div key={g.skill} className="flex items-center justify-between text-xs bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">
                    <span className="font-medium text-red-300">{g.skill}</span>
                    <span className="text-[10px] font-mono text-red-400 font-bold bg-red-900/30 px-1.5 py-0.5 rounded">
                      Critical Gaps
                    </span>
                  </div>
                ))}
                {gaps.moderate_gaps.map((g) => (
                  <div key={g.skill} className="flex items-center justify-between text-xs bg-yellow-950/20 border border-yellow-900/30 rounded-lg px-3 py-2">
                    <span className="font-medium text-yellow-300">{g.skill}</span>
                    <span className="text-[10px] font-mono text-yellow-400 font-bold bg-yellow-900/30 px-1.5 py-0.5 rounded">
                      Moderate Gaps
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Panel */}
      <div className="lg:col-span-3 flex flex-col glass-panel rounded-2xl border border-zinc-800/80 overflow-hidden shadow-2xl h-[calc(100vh-12rem)]">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed border ${
                  m.role === "user"
                    ? "bg-indigo-600/10 border-indigo-500/20 text-zinc-100"
                    : "bg-zinc-900/40 border-zinc-800/50 text-zinc-200"
                }`}
              >
                {/* Simulated Markdown Renderer */}
                <div className="whitespace-pre-line">
                  {m.content}
                </div>
              </div>
            </div>
          ))}

          {/* Live Agent Running Chips */}
          {isThinking && (
            <div className="flex flex-col gap-2 items-start bg-zinc-900/30 border border-zinc-800/40 p-4 rounded-xl max-w-[280px]">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-ping" />
                <span className="text-xs font-semibold text-indigo-300">Agent Reasoning...</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {activeTools.map((tool) => (
                  <span
                    key={tool}
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-900/40 text-indigo-400 animate-pulse"
                  >
                    🛠️ {tool}
                  </span>
                ))}
                {activeTools.length === 0 && (
                  <span className="text-[10px] text-zinc-500 font-mono">Synthesizing output token stream...</span>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Action Suggestion Pills */}
        <div className="px-6 py-2 flex flex-wrap gap-2 border-t border-zinc-900 bg-zinc-900/10">
          <button
            onClick={() => handlePillClick("What are my exact SQL skill gaps?")}
            className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 px-3 py-1.5 rounded-full transition-all"
          >
            🔍 Analyze SQL Gaps
          </button>
          <button
            onClick={() => handlePillClick("Generate a personalized study roadmap")}
            className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 px-3 py-1.5 rounded-full transition-all"
          >
            🗺️ Generate Study Guide
          </button>
          <button
            onClick={() => handlePillClick("How can I build a database portfolio project?")}
            className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 px-3 py-1.5 rounded-full transition-all"
          >
            📂 Portfolio Project Ideas
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-900 bg-zinc-900/20 flex gap-2">
          <input
            type="text"
            className="flex-1 bg-zinc-950 border border-zinc-800/80 rounded-xl px-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600"
            placeholder="Ask Aria about closing gaps, roadmap projects, or resume reviews..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isThinking}
          />
          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center transition-colors shadow-md shadow-indigo-500/20"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
