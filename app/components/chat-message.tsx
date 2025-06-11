import { type Message } from "ai";
import { UserCircle, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-3 rounded-lg p-4",
        isUser ? "bg-accent/50" : "bg-background"
      )}
    >
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
        {isUser ? (
          <UserCircle className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5 text-primary" />
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="text-sm font-medium">
          {isUser ? "You" : "AI Assistant"}
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
}
