import { type Message } from "ai";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AirVent } from "lucide-react";

interface ChatMessageProps {
  message: Message;
  userImage?: string | null;
}

export function ChatMessage({ message, userImage }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Only show AI avatar for assistant messages */}
      {!isUser && (
        <div className="mr-2 flex-shrink-0">
          <Avatar className="h-8 w-8 border border-zinc-800">
            <AvatarFallback className="bg-zinc-800 text-zinc-400">
              <AirVent className="h-4 w-4" />
            </AvatarFallback>
            <AvatarImage src="" alt="AI" />
          </Avatar>
        </div>
      )}

      {/* Message content */}
      <div
        className={`flex max-w-[80%] flex-col ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-xl px-4 py-2 ${
            isUser ? "bg-green-700 text-white" : "bg-zinc-800 text-white"
          } ${isUser ? "rounded-br-sm" : "rounded-bl-sm"}`}
        >
          {message.role === "assistant" ? (
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Format code blocks with proper syntax highlighting
                  code({ node, inline, className, children, ...props }: any) {
                    return (
                      <code
                        className={`${className} rounded bg-zinc-700 px-1 py-0.5 text-sm`}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  // Make links open in a new tab
                  a: ({ node, ...props }) => (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                      {...props}
                    />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p>{message.content}</p>
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`mt-1 text-xs text-zinc-500 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {message.createdAt
            ? new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
        </div>
      </div>

      {/* Only show user avatar for user messages */}
      {isUser && (
        <div className="ml-2 flex-shrink-0">
          <Avatar className="h-8 w-8 border border-zinc-800">
            <AvatarFallback className="bg-green-900 text-green-200">
              {userImage ? "" : "ME"}
            </AvatarFallback>
            {userImage && <AvatarImage src={userImage} alt="User" />}
          </Avatar>
        </div>
      )}
    </div>
  );
}
