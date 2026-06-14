import PortfolioFeedback from "@/components/portfolio/PortfolioFeedback";
import { Suspense } from "react";

export default function PortfolioPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight text-white">
          Portfolio & Codebase Assessment
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Upload your resume PDF and analyze your GitHub repositories to get line-level recommendations to improve your candidacy.
        </p>
      </div>

      <Suspense fallback={<div className="text-zinc-500 font-mono text-xs">Loading portfolio analyzer...</div>}>
        <PortfolioFeedback />
      </Suspense>
    </div>
  );
}
