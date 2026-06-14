import { useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useStreamingChat(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    // Add user message to state
    const userMessage: Message = { role: "user", content };
    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);
    setActiveTools([]);

    try {
      const response = await fetch(`${API_URL}/api/v1/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable.");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      
      // Initialize assistant message
      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          
          try {
            const event = JSON.parse(line.slice(6));
            
            if (event.type === "token") {
              // Append token to the last assistant message
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === "assistant") {
                  last.content += event.content;
                }
                return next;
              });
            } else if (event.type === "tool_call") {
              const toolName = event.tool;
              setActiveTools(prev => {
                if (prev.includes(toolName)) return prev;
                return [...prev, toolName];
              });
            } else if (event.type === "error") {
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === "assistant") {
                  last.content += `\n\n*(Error: ${event.content})*`;
                }
                return next;
              });
            } else if (event.type === "done") {
              setIsThinking(false);
              setActiveTools([]);
            }
          } catch (e) {
            console.error("Error parsing stream chunk:", e);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch stream:", error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error connecting to the career advisor agent. Please check if the server is running." }
      ]);
      setIsThinking(false);
      setActiveTools([]);
    }
  }, [sessionId]);

  return { messages, sendMessage, isThinking, activeTools, setMessages };
}
