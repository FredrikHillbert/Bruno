import { type Message } from "ai";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AirVent, Loader2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

import {
  Children,
  cloneElement,
  isValidElement,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Copy, Check } from "lucide-react";

interface ChatMessageProps {
  message: Message;
  userImage?: string | null;
}

interface ThinkingBlockProps {
  children: ReactNode;
}

const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ children }) => {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-sky-700/50 bg-sky-900/30 px-2 py-1 text-sm text-sky-300 italic mx-1">
      <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
      <span>{children}</span>
    </span>
  );
};

// --- ChatMessage Component ---
interface ChatMessageProps {
  message: Message;
  userImage?: string | null;
}

const THINK_START_MARKER = "§THINK_START§";
const THINK_END_MARKER = "§THINK_END§";
// Regex to capture the content between markers, including the markers themselves.
// This is used for splitting the string.
const SPLIT_THINK_BLOCK_REGEX = new RegExp(
  `(${THINK_START_MARKER}.*?${THINK_END_MARKER})`,
  "gs" // g for global, s for dotall (so .*? matches newlines)
);

export function ChatMessage({ message, userImage }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Function to copy code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const processedContent = useMemo(() => {
    if (message.role !== "assistant") return message.content;
    let content = message.content;
    // Replace <think>...</think> with markers
    content = content.replace(
      /<think>(.*?)<\/think>/gs,
      `${THINK_START_MARKER}$1${THINK_END_MARKER}`
    );
    return content;
  }, [message.content, message.role]);
  // Recursive function to process children nodes for thinking blocks
  const processNodeChildren = (childNodes: ReactNode[]): ReactNode[] => {
    return childNodes.flatMap((child, index) => {
      if (typeof child === "string") {
        // Only attempt to split if markers are present
        if (
          child.includes(THINK_START_MARKER) &&
          child.includes(THINK_END_MARKER)
        ) {
          const parts = child
            .split(SPLIT_THINK_BLOCK_REGEX)
            .filter((part) => part !== ""); // Filter out empty strings from split

          // If splitting results in multiple parts, or a single part that is a think block
          if (parts.length > 0) {
            return parts.map((part, partIndex) => {
              // Check if the current part is a complete think block
              if (
                part.startsWith(THINK_START_MARKER) &&
                part.endsWith(THINK_END_MARKER)
              ) {
                const thoughtText = part.slice(
                  THINK_START_MARKER.length,
                  -THINK_END_MARKER.length
                );
                return (
                  <ThinkingBlock key={`think-${index}-${partIndex}`}>
                    {thoughtText}
                  </ThinkingBlock>
                );
              }
              return part; // This is a regular text segment
            });
          }
        }
        return child; // Return original string if no complete think blocks found or markers not present
      }

      // If child is a React element, recursively process its children
      if (
        isValidElement(child) &&
        child.props &&
        typeof (child.props as any).children !== "undefined"
      ) {
        // Avoid infinite recursion for components we handle or that don't have processable children
        if (
          child.type === ThinkingBlock ||
          child.type === SyntaxHighlighter ||
          (typeof child.type === "string" &&
            ["code", "a", "table", "thead", "th", "td"].includes(child.type))
        ) {
          // For 'code', 'a', etc., we assume their specific renderers handle their content,
          // or their children are simple enough not to contain our think blocks,
          // or we let their default rendering happen if they don't have custom renderers.
          // If they *could* contain think blocks, we might need to recurse.
          // For now, let's keep it simple and not recurse into these specific HTML-tag-like elements
          // if they are rendered by our custom components.
        } else {
          const grandChildren = Children.toArray((child.props as any).children);
          return cloneElement(child, {
            ...(child.props as any),
            children: processNodeChildren(grandChildren),
          });
        }
      }
      return child; // Return element as is if no children to process or not a targeted type
    });
  };
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
                    const match = /language-(\w+)/.exec(className || "");
                    const code = String(children).replace(/\n$/, "");

                    const childArray = Children.toArray(children);
                    const firstChild = childArray[0] as React.ReactElement;
                    const firstChildAsString = isValidElement(firstChild)
                      ? (firstChild as any).props.children
                      : firstChild;

                    if (firstChildAsString === "▍") {
                      return (
                        <span className="mt-1 animate-pulse cursor-default">
                          ▍
                        </span>
                      );
                    }

                    if (typeof firstChildAsString === "string") {
                      childArray[0] = firstChildAsString.replace("`▍`", "▍");
                    }

                    if (
                      typeof firstChildAsString === "string" &&
                      !firstChildAsString.includes("\n")
                    ) {
                      return (
                        <code
                          className={
                            "bg-gray-600 p-0.5 rounded-md font-extrabold"
                          }
                          {...props}
                        >
                          {childArray}
                        </code>
                      );
                    }

                    // Handle code blocks with proper language detection
                    return (
                      <div className="relative my-4 overflow-hidden rounded-md border border-zinc-700">
                        <div className="flex items-center justify-between bg-zinc-900 px-4 py-1.5 text-xs text-zinc-400">
                          <span>{match ? match[1].toUpperCase() : "CODE"}</span>
                          <button
                            onClick={() => copyToClipboard(code)}
                            className="rounded p-1 hover:bg-zinc-800 transition-colors"
                            aria-label="Copy code"
                          >
                            {copiedCode === code ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          language={match ? match[1] : "text"}
                          style={oneDark}
                          customStyle={{
                            margin: 0,
                            padding: "1rem",
                            background: "#18181b", // zinc-900
                            fontSize: "0.875rem",
                          }}
                          wrapLines={true}
                          wrapLongLines={true}
                          showLineNumbers={true}
                        >
                          {code}
                        </SyntaxHighlighter>
                      </div>
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
                  // Style table elements
                  table: ({ node, ...props }) => (
                    <div className="my-4 overflow-x-auto rounded-md border border-zinc-700">
                      <table
                        className="w-full border-collapse text-sm"
                        {...props}
                      />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead className="bg-zinc-900" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th
                      className="border border-zinc-700 px-4 py-2 text-left font-medium"
                      {...props}
                    />
                  ),
                  td: ({ node, ...props }) => (
                    <td
                      className="border border-zinc-700 px-4 py-2"
                      {...props}
                    />
                  ),
                  // Custom renderer for paragraphs to handle thinking blocks
                  p: ({ node, children, ...props }) => {
                    // Pass the original children array from ReactMarkdown to our processor
                    const finalChildren = processNodeChildren(
                      Children.toArray(children)
                    );
                    return <p {...props}>{finalChildren}</p>;
                  },
                }}
              >
                {processedContent}
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
              ME
            </AvatarFallback>
            {userImage && <AvatarImage src={userImage} alt="User" />}
          </Avatar>
        </div>
      )}
    </div>
  );
}
