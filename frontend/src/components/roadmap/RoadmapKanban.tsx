"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface Task {
  title: string;
  hours: number;
  resource: string | null;
  completed?: boolean;
}

interface Week {
  week_number: number;
  theme: string;
  tasks: Task[];
  milestone: string;
}

interface RoadmapData {
  target_role: string;
  overall_readiness: number;
  weeks: Week[];
}

export default function RoadmapKanban() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState("");
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sId = searchParams.get("session_id") || localStorage.getItem("Career Lens_session_id") || "demo-session";
    setSessionId(sId);
  }, [searchParams]);

  // Fetch roadmap
  useEffect(() => {
    if (!sessionId) return;
    
    const fetchRoadmap = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/roadmap/get/${sessionId}`);
        const data = await res.json();
        
        if (data && data.weeks && data.weeks.length > 0) {
          // Initialize checkbox states if missing
          const weeksWithCompleted = data.weeks.map((w: Week) => ({
            ...w,
            tasks: w.tasks.map(t => ({ ...t, completed: t.completed || false }))
          }));
          setRoadmap({ ...data, weeks: weeksWithCompleted });
        } else {
          // Fallback to trigger generation
          const roleId = localStorage.getItem("Career Lens_role_id") || "data-scientist-mid";
          const genRes = await fetch(`http://localhost:8000/api/v1/roadmap/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, target_role_id: roleId, hours_per_week: 15 }),
          });
          const genData = await genRes.json();
          const weeksWithCompleted = genData.weeks.map((w: Week) => ({
            ...w,
            tasks: w.tasks.map(t => ({ ...t, completed: false }))
          }));
          setRoadmap({ ...genData, weeks: weeksWithCompleted });
        }
      } catch (e) {
        console.error("Failed to load roadmap:", e);
        // Fallback demo data
        setRoadmap(getMockRoadmapData());
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoadmap();
  }, [sessionId]);

  const toggleTask = (weekIdx: number, taskIdx: number) => {
  if (!roadmap) return;

  setRoadmap((prev) => {
    if (!prev) return prev;

    const next = { ...prev };

    next.weeks = [...prev.weeks];
    next.weeks[weekIdx] = { ...prev.weeks[weekIdx] };
    next.weeks[weekIdx].tasks = [...prev.weeks[weekIdx].tasks];

    next.weeks[weekIdx].tasks[taskIdx] = {
      ...prev.weeks[weekIdx].tasks[taskIdx],
      completed: !prev.weeks[weekIdx].tasks[taskIdx].completed,
    };

    return next;
  });
};

  const getMockRoadmapData = (): RoadmapData => {
    return {
      target_role: "Data Scientist (Mid-level)",
      overall_readiness: 0.72,
      weeks: Array.from({ length: 12 }, (_, i) => ({
        week_number: i + 1,
        theme: i < 2 ? "Foundation Setup & SQL syntax basics" : i < 8 ? "Core statistics & dataframe indexing" : i < 10 ? "Showcase Capstone building" : "Interview prep",
        tasks: [
          { title: "Review introductory query commands", hours: 4, resource: "https://roadmap.sh/sql", completed: false },
          { title: "Complete local schema practice project", hours: 6, resource: null, completed: false }
        ],
        milestone: "Write custom joins and create normalized schema setup."
      }))
    };
  };

  // Calculate overall tasks statistics
  const getProgressStats = () => {
    if (!roadmap) return { total: 0, completed: 0, percent: 0 };
    let total = 0;
    let completed = 0;
    
    roadmap.weeks.forEach(w => {
      w.tasks.forEach(t => {
        total++;
        if (t.completed) completed++;
      });
    });
    
    return {
      total,
      completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  if (loading) {
    return <div className="text-zinc-500 font-mono text-xs animate-pulse">Assembling study planner cards...</div>;
  }

  if (!roadmap) return null;

  const stats = getProgressStats();
    const completedWeeks = roadmap.weeks.filter(
    week => week.tasks.length > 0 &&
    week.tasks.every(task => task.completed)
  ).length;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="glass-panel rounded-2xl p-6 border border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Preparation For</p>
          <h2 className="text-xl font-bold font-display text-white">{roadmap.target_role}</h2>
        </div>
        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between text-xs text-zinc-400 font-semibold">
    <span>Overall Roadmap Progress</span>

    <div className="flex gap-4 font-mono text-indigo-400">
            <span>
                {stats.completed} / {stats.total} Tasks Completed ({stats.percent}%)
            </span>

            <span>
                {completedWeeks} / {roadmap.weeks.length} Weeks Completed
            </span>
        </div>
    </div>
          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/40">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Kanban Container */}
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x pr-4">
          {roadmap.weeks.map((week, wIdx) => {
            const weekProgress = week.tasks.filter(t => t.completed).length;
            const isWeekDone = weekProgress === week.tasks.length && week.tasks.length > 0;
            
            return (
              <div
                key={week.week_number}
                className={`flex-none w-[320px] snap-align-start rounded-2xl border transition-all flex flex-col justify-between ${
                  isWeekDone
                    ? "bg-indigo-950/10 border-indigo-500/35 shadow-lg shadow-indigo-500/5"
                    : "bg-zinc-900/30 border-zinc-800/80 hover:border-zinc-700/80"
                }`}
              >
                {/* Week Header */}
                <div className="p-5 border-b border-zinc-900">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono tracking-widest uppercase text-indigo-400">
                      WEEK {week.week_number}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-850 px-2 py-0.5 rounded-full">
                      {weekProgress}/{week.tasks.length} tasks
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2 leading-snug line-clamp-2 h-10">
                    {week.theme}
                  </h4>
                </div>

                {/* Tasks List */}
                <div className="p-5 flex-1 space-y-3 min-h-[180px]">
                  {week.tasks.map((task, tIdx) => (
                    <div
                      key={tIdx}
                      onClick={() => toggleTask(wIdx, tIdx)}
                      className={`flex gap-3 items-start cursor-pointer p-3 rounded-xl border transition-all ${
                        task.completed
                          ? "bg-zinc-900/20 border-zinc-800/40 opacity-60"
                          : "bg-zinc-950/40 border-zinc-900 hover:border-zinc-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.completed || false}
                        readOnly
                        className="mt-1 h-3.5 w-3.5 rounded border-zinc-800 bg-zinc-950 text-indigo-500 accent-indigo-500 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <p className={`text-xs leading-normal font-medium ${
                          task.completed ? "line-through text-zinc-500" : "text-zinc-300"
                        }`}>
                          {task.title}
                        </p>
                        {task.resource && (
                          <a
                            href={task.resource}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // don't check box on link click
                            className="inline-flex items-center gap-1 text-[9px] text-indigo-400 hover:underline font-semibold"
                          >
                            🔗 Resource Link
                          </a>
                        )}
                        <span className="block text-[9px] text-zinc-600 font-semibold font-mono">
                          ⏱️ {task.hours} hours
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Week Milestone Footer */}
                <div className="p-5 border-t border-zinc-900 bg-zinc-900/10 rounded-b-2xl">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Milestone Target</p>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-normal italic">
                    "{week.milestone}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
