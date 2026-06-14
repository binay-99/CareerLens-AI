import AssessmentWizard from "@/components/assessment/AssessmentWizard";

export default function AssessmentPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-6">
      <div className="text-center mb-8 max-w-xl">
        <h1 className="text-4xl font-extrabold font-display tracking-tight text-white sm:text-5xl">
          Forge Your Career Path
        </h1>
        <p className="mt-3 text-zinc-400 text-base">
          Analyze your skillset, matching direct vacancies and career scopes, and build a personalized 12-week preparation study guide.
        </p>
      </div>
      
      <AssessmentWizard />
    </div>
  );
}
