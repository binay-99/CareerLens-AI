import RoadmapKanban from "@/components/roadmap/RoadmapKanban";
import { Suspense } from "react";

export default function RoadmapPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight text-white">
          Study Preparation Roadmap
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          A personalized 12-week study plan with structured milestones, practice exercises, and course links to bridge your skill gaps.
        </p>
      </div>

      <Suspense fallback={<div className="text-zinc-500 font-mono text-xs">Loading preparation board...</div>}>
        <RoadmapKanban />
      </Suspense>
    </div>
  );
}
