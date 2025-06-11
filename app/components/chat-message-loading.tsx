import { Bot } from "lucide-react";

export function ChatMessageLoading() {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg p-4 bg-background">
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
        <Bot className="h-5 w-5 text-primary" />
      </div>

      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="text-sm font-medium">AI Assistant</div>

        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary/60"></div>
          <div
            className="h-2 w-2 animate-pulse rounded-full bg-primary/60"
            style={{ animationDelay: "300ms" }}
          ></div>
          <div
            className="h-2 w-2 animate-pulse rounded-full bg-primary/60"
            style={{ animationDelay: "600ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
