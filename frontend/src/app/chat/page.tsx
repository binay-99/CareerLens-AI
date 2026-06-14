import ChatInterface from "@/components/chat/ChatInterface";
import { Suspense } from "react";

export default function ChatPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight text-white">
          Aria Advisor Chat
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Discuss how to structure your studies, design showcase projects, or optimize resume formatting.
        </p>
      </div>

      <Suspense fallback={<div className="text-zinc-500 font-mono text-xs">Initializing advisor session...</div>}>
        <ChatInterface />
      </Suspense>
    </div>
  );
}
