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
  SelectLabel,
  SelectSeparator,
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
  const [customModelId, setCustomModelId] = useState("");
  const [showCustomModelInput, setShowCustomModelInput] = useState(false);

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

  const getDisplayModelName = (modelId: string): string => {
    // If it's a standard model from our list, return its friendly name
    if (selectedProvider === "openrouter") {
      const modelOption = providerModels.openrouter.find(
        (m) => m.id === modelId
      );
      if (modelOption) return modelOption.name;

      // If it's a custom model ID, format it nicely
      if (modelId.includes("/")) {
        const [provider, model] = modelId.split("/");
        return `${
          provider.charAt(0).toUpperCase() + provider.slice(1)
        }: ${model}`;
      }
    }

    // For other providers, just return the raw model ID
    return modelId;
  };

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
    if (error && error.cause === 429) {
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
  if (!hasAccess) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-4 md:p-8 bg-zinc-900">
        <div className="w-full max-w-xl space-y-6 rounded-xl border border-zinc-800 bg-black p-6 shadow-md">
          {/* Simplified Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-900/30">
              <Key className="h-8 w-8 text-green-500" />
            </div>

            {user ? (
              // For logged-in users
              <>
                <h2 className="mb-2 text-xl font-bold text-white">
                  Choose How to Access AI Models
                </h2>
                <p className="text-zinc-400 mb-4">
                  You're signed in! You have two options to access models from{" "}
                  <span className="font-medium text-white">
                    {selectedProvider.charAt(0).toUpperCase() +
                      selectedProvider.slice(1)}
                  </span>
                  :
                </p>
              </>
            ) : (
              // For guests
              <>
                <h2 className="mb-2 text-xl font-bold text-white">
                  Create a Free Account or Add Your API Key
                </h2>
                <p className="text-zinc-400 mb-4">
                  Get started with BRUNO in seconds:
                </p>
              </>
            )}
          </div>

          {/* Main Options */}
          <div className="grid gap-4">
            {/* Free Models Option - For logged-in users */}
            {user && (
              <div className="flex flex-col space-y-3 rounded-lg border border-green-800 bg-green-950/20 p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-white">Use Free Models</h3>
                  <span className="rounded-full bg-green-800 px-2 py-0.5 text-xs text-green-100">
                    Recommended
                  </span>
                </div>
                <p className="flex-1 text-sm text-zinc-400">
                  You have free access to multiple AI models, including Llama,
                  Gemini, DeepSeek, and Mistral.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => onProviderChange("meta")}
                    className="bg-green-800 hover:bg-green-700 text-white"
                  >
                    Use Llama
                  </Button>
                  <Button
                    onClick={() => onProviderChange("google")}
                    variant="outline"
                    className="border-green-800 text-green-400 hover:bg-green-900/30"
                  >
                    Use Gemini
                  </Button>
                  <Button
                    onClick={() => onProviderChange("mistral")}
                    variant="outline"
                    className="border-green-800 text-green-400 hover:bg-green-900/30"
                  >
                    Use Mistral
                  </Button>
                </div>
              </div>
            )}

            {/* API Key Option */}
            <div
              className={`flex flex-col space-y-3 rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 ${
                !user ? "mb-2" : ""
              }`}
            >
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-white">Use Your Own API Key</h3>
                {!user && (
                  <span className="rounded-full bg-blue-800/70 px-2 py-0.5 text-xs text-blue-100">
                    No account needed
                  </span>
                )}
              </div>
              <p className="flex-1 text-sm text-zinc-400">
                Add your own API key from OpenRouter to access 200+ models from
                all providers with a single key.
              </p>

              <div className="text-xs bg-zinc-800/50 p-2 rounded border border-zinc-700 text-zinc-300">
                OpenRouter gives you pay-as-you-go access to models from OpenAI,
                Anthropic, Google, Meta and others with just one API key.
              </div>

              <Button
                onClick={onOpenApiKeyModal}
                className="bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                <Key className="mr-2 h-4 w-4" />
                Add API Key
              </Button>
            </div>

            {/* Create Account Option - Only for non-logged in users */}
            {!user && (
              <div className="flex flex-col space-y-3 rounded-lg border border-green-800 bg-green-950/20 p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-white">
                    Create a Free Account
                  </h3>
                  <span className="rounded-full bg-green-800 px-2 py-0.5 text-xs text-green-100">
                    Recommended
                  </span>
                </div>
                <p className="flex-1 text-sm text-zinc-400">
                  Sign up for a free account to access multiple free models and
                  save your chat history.
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Link
                    to="/sign-up"
                    className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all bg-gradient-to-r from-green-800 to-green-700 hover:from-green-700 hover:to-green-600 text-white"
                  >
                    Create Free Account
                  </Link>
                  <Link
                    to="/sign-in"
                    className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all bg-transparent border border-green-800 text-green-400 hover:bg-green-950/30"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Help Link */}
          <p className="text-center text-xs text-zinc-500 mt-4">
            <Link to="/learn-more" className="text-green-500 hover:underline">
              Learn more
            </Link>{" "}
            about API keys and free models.
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
              {error.cause === 400 && (
                <span className="ml-2 text-xs text-zinc-500">
                  Please check your API key and model selection.
                </span>
              )}
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
              <SelectTrigger className="h-9 bg-zinc-900 border-zinc-700 text-white">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                <SelectGroup>
                  {user && (
                    <SelectLabel className="px-2 text-xs text-zinc-500">
                      Free Models
                    </SelectLabel>
                  )}
                  {user && (
                    <>
                      <SelectItem value="meta">
                        Meta (Llama){" "}
                        <span className="ml-2 text-xs text-green-500">
                          Free
                        </span>
                      </SelectItem>
                      <SelectItem value="google">
                        Google (Gemini){" "}
                        <span className="ml-2 text-xs text-green-500">
                          Free
                        </span>
                      </SelectItem>
                      <SelectItem value="deepseek">
                        DeepSeek{" "}
                        <span className="ml-2 text-xs text-green-500">
                          Free
                        </span>
                      </SelectItem>
                      <SelectItem value="mistral">
                        Mistral{" "}
                        <span className="ml-2 text-xs text-green-500">
                          Free
                        </span>
                      </SelectItem>
                      <SelectSeparator className="bg-zinc-700" />
                      <SelectLabel className="px-2 text-xs text-zinc-500">
                        API Key Required
                      </SelectLabel>
                    </>
                  )}
                  <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="meta">Meta (llama)</SelectItem>
                  <SelectItem value="google">Google (Gemini)</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>

                  <SelectItem value="openrouter">
                    OpenRouter (Multi-Model)
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={selectedModel}
              onValueChange={(value) => {
                if (value === "custom-model-input") {
                  setShowCustomModelInput(true);
                } else {
                  setShowCustomModelInput(false);
                  setSelectedModel(value);
                }
              }}
              disabled={
                status === "submitted" || !providerModels[selectedProvider]
              }
            >
              <SelectTrigger className="h-9 bg-zinc-900 border-zinc-700 text-white">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-zinc-900 border-zinc-700 text-white">
                {providerModels[
                  selectedProvider as keyof typeof providerModels
                ]?.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
                {selectedProvider === "openrouter" && (
                  <>
                    <SelectSeparator className="bg-zinc-700" />
                    <SelectItem
                      value="custom-model-input"
                      className="text-green-500"
                    >
                      Use custom model ID...
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            {/* Custom model input - simplified */}
            {showCustomModelInput && selectedProvider === "openrouter" && (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="provider/model-id"
                  value={customModelId}
                  onChange={(e) => setCustomModelId(e.target.value)}
                  className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                />
                <Button
                  onClick={() => {
                    if (customModelId.trim()) {
                      setSelectedModel(customModelId.trim());
                      setShowCustomModelInput(false);
                    }
                  }}
                  size="sm"
                  className="h-9 bg-green-800 hover:bg-green-700 text-white"
                >
                  Use
                </Button>
              </div>
            )}
          </div>

          {/* Status indicator - simplified */}
          <div className="flex gap-4 items-center">
            {/* Model status */}
            <div className="text-xs">
              {user?.isSubscribed ? (
                <span className="flex items-center text-green-500">
                  <div className="mr-1 h-2 w-2 rounded-full bg-green-500"></div>
                  Premium
                </span>
              ) : user &&
                ["meta", "google", "deepseek", "mistral"].includes(
                  selectedProvider
                ) ? (
                <span className="flex items-center text-blue-400">
                  <div className="mr-1 h-2 w-2 rounded-full bg-blue-400"></div>
                  Free Access
                </span>
              ) : (
                <span className="flex items-center text-amber-500">
                  <div className="mr-1 h-2 w-2 rounded-full bg-amber-500"></div>
                  API Key
                </span>
              )}
            </div>

            {/* Rate limit info - simplified */}
            {user &&
              !rateLimitInfo.isLoading &&
              rateLimitInfo.remaining !== undefined &&
              rateLimitInfo.remaining > 0 && (
                <div className="text-xs text-zinc-400">
                  {rateLimitInfo.remaining} remaining
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
