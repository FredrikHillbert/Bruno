import { useState, useEffect, useRef, useMemo } from "react";
import { type Message } from "ai";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "./chat-message";
import { ChatMessageLoading } from "./chat-message-loading";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Info, Key, Loader2, Send } from "lucide-react";
import { providerModels } from "@/models";
import { Link } from "react-router";
import type { User } from "@/routes/layout";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";

interface ChatAreaProps {
  apiKeys: Record<string, string>;
  user: User | null; // User object with subscription status
  onOpenApiKeyModal: () => void;
  onOpenSubscriptionModal: () => void;
  chatId: string | null;
  initialMessages?: Message[]; // Add support for initialMessages
  onChatUpdate: (
    messages: Message[],
    title: string,
    provider: string,
    model: string
  ) => void;
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  selectedModel?: string; // Add support for selectedModel
}

export function ChatArea({
  apiKeys,
  user,
  onOpenApiKeyModal,
  onOpenSubscriptionModal,
  chatId,
  initialMessages = [],
  onChatUpdate,
  selectedProvider,
  onProviderChange,
  selectedModel: initialSelectedModel,
}: ChatAreaProps) {
  // Initialize selectedModel with the provided prop or default to the first model for the selected provider
  const [selectedModel, setSelectedModel] = useState(() => {
    if (initialSelectedModel) return initialSelectedModel;

    const models =
      providerModels[selectedProvider as keyof typeof providerModels] || [];
    return models.length > 0 ? models[0].id : "gpt-4o";
  });

  const [showRecommendations, setShowRecommendations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining?: number;
    reset?: string;
    isLoading: boolean;
  }>({
    isLoading: false,
  });

  const hasAccess = useMemo(() => {
    // User has subscription - can access all models
    if (user?.isSubscribed) return true;

    // User has API key for the selected provider - can access that provider
    if (apiKeys[selectedProvider]) return true;

    // Authenticated users can access free models
    if (
      user &&
      ["meta", "google", "deepseek", "mistral"].includes(selectedProvider)
    )
      return true;

    // Otherwise, no access
    return false;
  }, [user, selectedProvider, apiKeys]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: chatId || undefined,
    body: {
      model: selectedModel,
      provider: selectedProvider,
      threadId: chatId,
    },
    headers: {
      "x-api-key": apiKeys[selectedProvider] || "",
    },
    onFinish: (message) => {
      const userMessage: Message = {
        role: "user",
        content: input.trim(),
        createdAt: new Date(),
        id: Date.now().toString(),
      };

      // When a message finishes streaming, update the chat
      const allMessages = [...messages, userMessage, message];

      updateChatHistory(allMessages);
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  const updateChatHistory = (allMessages: Message[]) => {
    // Create a title from the first user message if available
    let title = "New Chat";
    const firstUserMessage = allMessages.find((m) => m.role === "user");
    if (firstUserMessage) {
      title = firstUserMessage.content.substring(0, 30);
      if (firstUserMessage.content.length > 30) title += "...";
    }

    onChatUpdate(allMessages, title, selectedProvider, selectedModel);
  };

  // Set initial messages when they change (e.g., when switching chats)
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (error && error.status === 429) {
      // This is a rate limit error
      const resetTime = error.reset ? new Date(error.reset) : new Date();
      resetTime.setHours(0, 0, 0, 0);
      resetTime.setDate(resetTime.getDate() + 1);

      const resetTimeString = resetTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-medium">{error.message}</span>
          {error.cooldownSeconds ? (
            <span className="text-sm">
              Try again in {error.cooldownSeconds} seconds
            </span>
          ) : (
            <span className="text-sm">Limit resets at {resetTimeString}</span>
          )}
        </div>
      );

      setRateLimitInfo({
        remaining: 0,
        reset: resetTimeString,
        isLoading: false,
      });
    }
  }, [error]);

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    handleSubmit(e);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Handle textarea height adjustment
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);

    // Auto-resize the textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Handle key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  // Render API key or subscription prompt if needed
  if (!hasAccess) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-4 md:p-8 bg-zinc-900">
        <div className="w-full max-w-2xl space-y-6 rounded-xl border border-zinc-800 bg-black p-6 shadow-md">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-900/30">
              <Key className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Access Required
            </h2>

            {user ? (
              // User is logged in but trying to access a paid model
              <p className="text-zinc-400">
                You need additional access to use models from{" "}
                <span className="font-medium text-white">
                  {selectedProvider.charAt(0).toUpperCase() +
                    selectedProvider.slice(1)}
                </span>
                .{" "}
                <Link
                  to="#"
                  onClick={() => onProviderChange("meta")}
                  className="text-green-500 hover:underline"
                >
                  Switch to Llama models
                </Link>{" "}
                for free access.
              </p>
            ) : (
              // User is not logged in
              <p className="text-zinc-400">
                Choose how you want to access AI models from{" "}
                <span className="font-medium text-white">
                  {selectedProvider.charAt(0).toUpperCase() +
                    selectedProvider.slice(1)}
                </span>
              </p>
            )}
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="provider-select"
                className="text-sm font-medium text-zinc-400"
              >
                Select AI Provider:
              </label>

              {/* Add badges to show which providers are free */}
              <div className="flex gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-800/30 text-green-400 border border-green-800/50">
                  Llama: Free with account
                </span>
              </div>
            </div>

            <Select onValueChange={onProviderChange} value={selectedProvider}>
              <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 text-white">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                <SelectGroup>
                  <SelectItem
                    value="openai"
                    className="flex items-center justify-between"
                  >
                    <span>OpenAI (ChatGPT)</span>
                  </SelectItem>
                  <SelectItem value="anthropic">
                    <span>Anthropic (Claude)</span>
                  </SelectItem>
                  <SelectItem
                    value="meta"
                    className="flex items-center justify-between"
                  >
                    <span>Meta (Llama)</span>
                    {user && (
                      <span className="text-xs ml-2 text-green-500">Free</span>
                    )}
                  </SelectItem>
                  <SelectItem value="google">Google (Gemini)</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="mistral">Mistral</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Options with divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-zinc-500">
                Access Options
              </span>
            </div>
          </div>

          {/* Option Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* BYOK Option */}
            <div className="flex flex-col space-y-2 rounded-lg border border-red-900/30 bg-red-950/20 p-4 transition-colors hover:bg-red-950/30">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-white">
                  Use Your Own API Keys
                </h3>
                <span className="rounded-full bg-green-800 px-2 py-0.5 text-xs text-green-100">
                  No Limits
                </span>
              </div>
              <p className="flex-1 text-xs text-zinc-400">
                Provide your own API key from{" "}
                {selectedProvider.charAt(0).toUpperCase() +
                  selectedProvider.slice(1)}
                . Your key remains securely stored in your browser.
              </p>
              <Button
                onClick={onOpenApiKeyModal}
                className="mt-2 w-full bg-red-900 hover:bg-red-800 text-white border-none"
              >
                <Key className="mr-2 h-4 w-4" />
                Add API Key
              </Button>
            </div>

            {/* Premium Option */}
            <div className="flex flex-col space-y-2 rounded-lg border border-green-800 bg-green-950/20 p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-white">Premium Access</h3>
                <span className="rounded-full bg-green-800 px-2 py-0.5 text-xs text-green-100">
                  All Models
                </span>
              </div>
              <p className="flex-1 text-xs text-zinc-400">
                Subscribe to our premium plan for seamless access to all AI
                providers with no need for API keys.
              </p>
              <Button
                onClick={onOpenSubscriptionModal}
                variant="default"
                className="mt-2 w-full bg-gradient-to-r from-green-800 to-green-700 hover:from-green-700 hover:to-green-600 text-white border-none"
              >
                Subscribe to Premium
              </Button>
            </div>

            {/* Conditional "Create Account" option - only show if user is not logged in */}
            {!user && (
              <div className="flex flex-col space-y-2 col-span-2 rounded-lg border border-green-800 bg-green-950/20 p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-white">
                    Create a free account
                  </h3>
                  <span className="rounded-full bg-green-800 px-2 py-0.5 text-xs text-green-100">
                    Free Access to Llama
                  </span>
                </div>
                <p className="flex-1 text-xs text-zinc-400">
                  Create a free account to save your chat history and get access
                  to Meta's Llama models for free. No credit card required.
                </p>
                <Link
                  to={"/sign-up"}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive mt-2 w-full bg-gradient-to-r from-green-800 to-green-700 hover:from-green-700 hover:to-green-600 text-white border-none"
                >
                  Create Free Account
                </Link>
              </div>
            )}
          </div>

          {/* Help Text */}
          <p className="text-center text-xs text-zinc-500">
            Need help?{" "}
            <Link to="/learn-more" className="text-green-500 hover:underline">
              Learn more
            </Link>{" "}
            about API keys and subscription options.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-zinc-900">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <h2 className="mb-2 text-2xl font-bold text-white">
              Start a Conversation
            </h2>
            <p className="mb-8 max-w-md text-zinc-400">
              Ask a question or request information from the AI.
            </p>

            {showRecommendations && (
              <div className="grid gap-2 md:grid-cols-2">
                <Button
                  variant="outline"
                  className="justify-start text-left border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  onClick={() => {
                    if (textareaRef.current) {
                      textareaRef.current.value =
                        "Explain quantum computing in simple terms";
                      textareaRef.current.dispatchEvent(
                        new Event("input", { bubbles: true })
                      );
                    }
                  }}
                >
                  Explain quantum computing in simple terms
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  onClick={() => {
                    if (textareaRef.current) {
                      textareaRef.current.value =
                        "Write a poem about artificial intelligence";
                      textareaRef.current.dispatchEvent(
                        new Event("input", { bubbles: true })
                      );
                    }
                  }}
                >
                  Write a poem about artificial intelligence
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  onClick={() => {
                    if (textareaRef.current) {
                      textareaRef.current.value =
                        "How do I create a React component?";
                      textareaRef.current.dispatchEvent(
                        new Event("input", { bubbles: true })
                      );
                    }
                  }}
                >
                  How do I create a React component?
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  onClick={() => {
                    if (textareaRef.current) {
                      textareaRef.current.value =
                        "Generate a JavaScript function to sort an array";
                      textareaRef.current.dispatchEvent(
                        new Event("input", { bubbles: true })
                      );
                    }
                  }}
                >
                  Generate a JavaScript function to sort an array
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              className="mt-4 text-zinc-400 hover:text-white hover:bg-zinc-800"
              onClick={() => setShowRecommendations(!showRecommendations)}
            >
              {showRecommendations ? "Hide suggestions" : "Show suggestions"}
            </Button>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                userImage={user?.image}
              />
            ))}
            {status === "submitted" && <ChatMessageLoading />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-800 bg-black p-4">
        {error && (
          <div className="mb-2 rounded bg-red-950/30 p-2 text-sm text-red-400">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Error:{" "}
              {error.message || "Something went wrong. Please try again."}
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} ref={formRef} className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[60px] w-full resize-none pr-12 bg-zinc-900 border-zinc-700 placeholder:text-zinc-500 text-white focus-visible:ring-green-800"
            disabled={status === "submitted"}
          />
          <Button
            type="submit"
            size="icon"
            disabled={status === "submitted" || !input.trim()}
            className="absolute bottom-2 right-2 bg-green-800 hover:bg-green-700 text-white"
          >
            {status === "submitted" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Model Selection */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Select onValueChange={onProviderChange} value={selectedProvider}>
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700 text-white">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                <SelectGroup>
                  <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="meta">
                    {" "}
                    <span>Meta (Llama)</span>
                    {user && (
                      <span className="text-xs ml-2 text-green-500">Free</span>
                    )}
                  </SelectItem>
                  <SelectItem value="google">
                    {" "}
                    <span>Google (Gemini)</span>
                    {user && (
                      <span className="text-xs ml-2 text-green-500">Free</span>
                    )}
                  </SelectItem>
                  <SelectItem value="deepseek">
                    <span>DeepSeek</span>
                    {user && (
                      <span className="text-xs ml-2 text-green-500">Free</span>
                    )}
                  </SelectItem>
                  <SelectItem value="mistral">
                    <span>Mistral</span>
                    {user && (
                      <span className="text-xs ml-2 text-green-500">Free</span>
                    )}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
              disabled={
                status === "submitted" || !providerModels[selectedProvider]
              }
            >
              <SelectTrigger className="w-[250px] bg-zinc-900 border-zinc-700 text-white">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                <SelectGroup>
                  {providerModels[
                    selectedProvider as keyof typeof providerModels
                  ]?.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} - {model.description}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-zinc-500">
            {user?.isSubscribed ? (
              <span className="flex items-center text-green-500">
                <div className="mr-1 h-2 w-2 rounded-full bg-green-500"></div>
                Premium
              </span>
            ) : user && ["meta", "google", "deepseek", "mistral"].includes(selectedProvider) ? (
              <span className="flex items-center text-blue-400">
                <div className="mr-1 h-2 w-2 rounded-full bg-blue-400 animate-pulse"></div>
                Free Access
              </span>
            ) : (
              <span className="flex items-center text-red-500">
                <div className="mr-1 h-2 w-2 rounded-full bg-red-500"></div>
                Using your API key
              </span>
            )}
          </div>
          {/* Rate limit info */}
          {user &&
            !rateLimitInfo.isLoading &&
            rateLimitInfo.remaining !== undefined && (
              <div className="text-xs text-white">
                {rateLimitInfo.remaining > 0 ? (
                  <span className="text-white">
                    {rateLimitInfo.remaining} requests remaining today
                  </span>
                ) : (
                  <span>
                    Daily limit reached. Resets at {rateLimitInfo.reset}
                  </span>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
