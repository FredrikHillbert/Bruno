import { useState, useEffect, useRef, useMemo } from "react";
import { type Message } from "ai";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "./chat-message";
import { ChatMessageLoading } from "./chat-message-loading";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Clock, Info, Key, Loader2, Send } from "lucide-react";
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
import { Badge } from "./ui/badge";
import { RateLimitCountdown } from "./rate-limit-countdown";

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
    return models.length > 0 ? models[0].id : "";
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

  useEffect(() => {
    const models =
      providerModels[selectedProvider as keyof typeof providerModels] || [];
    if (
      models.length > 0 &&
      (!selectedModel || !models.some((m) => m.id === selectedModel))
    ) {
      setSelectedModel(models[0].id);
    }
  }, [selectedProvider, selectedModel]);
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
      console.error("Chat error:", error.message);

      try {
        // Try to parse the error message as JSON
        let errorObj;
        if (typeof error.message === "string" && error.message.includes("{")) {
          // Extract the JSON part if it's embedded in a string
          const jsonMatch = error.message.match(/\{.*\}/);
          if (jsonMatch) {
            errorObj = JSON.parse(jsonMatch[0]);
          } else {
            // Try parsing the whole message
            errorObj = JSON.parse(error.message);
          }

          // Handle rate limit errors specifically
          if (errorObj.cooldownSeconds) {
            // For rate limit errors, show a more friendly message with countdown
            const minutes = Math.floor(errorObj.cooldownSeconds / 60);
            const seconds = errorObj.cooldownSeconds % 60;
            const timeDisplay =
              minutes > 0
                ? `${minutes} minute${
                    minutes > 1 ? "s" : ""
                  } and ${seconds} second${seconds !== 1 ? "s" : ""}`
                : `${seconds} second${seconds !== 1 ? "s" : ""}`;

            toast.error(
              <div className="flex flex-col gap-1">
                <span className="font-medium">Rate limit reached</span>
                <span className="text-sm">
                  Please wait {timeDisplay} before trying again
                </span>
              </div>,
              {
                duration: 6000,
                icon: (
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                ),
              }
            );

            // Set rate limit info to show in the UI
            setRateLimitInfo({
              remaining: 0,
              reset: new Date(
                Date.now() + errorObj.cooldownSeconds * 1000
              ).toISOString(),
              isLoading: false,
            });
          } else {
            // For other JSON errors, display the error message
            toast.error(errorObj.error || "Something went wrong");
          }
        } else {
          // For non-JSON errors, just show the message
          toast.error(error.message || "Something went wrong");
        }
      } catch (parseError) {
        // If JSON parsing fails, show the original error
        toast.error(error.message || "Something went wrong");
      }
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
    // Get free providers that the user can access
    const availableFreeProviders = user
      ? ["meta", "google", "mistral", "deepseek"]
      : [];

    // Get providers with API keys
    const providersWithKeys = Object.keys(apiKeys).filter(
      (key) => apiKeys[key] && apiKeys[key].trim() !== ""
    );

    // Get a list of all providers the user can access
    const accessibleProviders = [
      ...new Set([...availableFreeProviders, ...providersWithKeys]),
    ];

    // Determine if there are alternatives to show
    const hasAlternatives = accessibleProviders.length > 0;

    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-4 md:p-8 bruno-bg">
        <div className="w-full max-w-xl space-y-6 rounded-xl bruno-border bruno-card p-6 shadow-md">
          {/* Header with Alert */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[color:oklch(var(--bruno-red)/0.1)] dark:bg-[color:oklch(var(--bruno-red)/0.15)]">
              <Key className="h-8 w-8 text-[color:oklch(var(--bruno-red))]" />
            </div>

            <h2 className="mb-2 text-xl font-bold bruno-text-primary">
              {hasAlternatives
                ? `Access to ${
                    selectedProvider.charAt(0).toUpperCase() +
                    selectedProvider.slice(1)
                  } Required`
                : "Access to AI Models"}
            </h2>

            {hasAlternatives && (
              <div className="mb-4 p-2 rounded-lg bg-red-900/20 border border-red-700/30">
                <p className="text-sm text-zinc-300">
                  You don't currently have access to{" "}
                  <span className="font-medium text-white">
                    {selectedProvider.charAt(0).toUpperCase() +
                      selectedProvider.slice(1)}
                  </span>
                  . Choose another provider or add your API key.
                </p>
              </div>
            )}

            {user ? (
              <p className="bruno-text-secondary mb-4">
                You're signed in! You have these options to access models:
              </p>
            ) : (
              <p className="bruno-text-secondary mb-4">
                Get started with BrunoChat in seconds:
              </p>
            )}
          </div>

          {/* Main Options */}
          <div className="grid gap-4">
            {/* Alternative Providers Section - Only show if there are alternatives */}
            {hasAlternatives && (
              <div className="flex flex-col space-y-3 rounded-lg border border-green-700/30 bg-green-900/10 p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-white">
                    Available Providers
                  </h3>
                  <span className="rounded-full bg-green-700 px-2 py-0.5 text-xs text-white">
                    Recommended
                  </span>
                </div>
                <p className="flex-1 text-sm text-zinc-400">
                  Switch to one of these providers that you already have access
                  to:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableFreeProviders.includes("meta") && (
                    <Button
                      onClick={() => onProviderChange("meta")}
                      className="bg-green-700 hover:bg-green-600 text-white"
                    >
                      Use Llama
                    </Button>
                  )}
                  {availableFreeProviders.includes("google") && (
                    <Button
                      onClick={() => onProviderChange("google")}
                      variant="outline"
                      className="border-green-700/50 text-green-500 hover:bg-green-900/30"
                    >
                      Use Gemini
                    </Button>
                  )}
                  {availableFreeProviders.includes("mistral") && (
                    <Button
                      onClick={() => onProviderChange("mistral")}
                      variant="outline"
                      className="border-green-700/50 text-green-500 hover:bg-green-900/30"
                    >
                      Use Mistral
                    </Button>
                  )}
                  {providersWithKeys.includes("openrouter") && (
                    <Button
                      onClick={() => onProviderChange("openrouter")}
                      className="bg-green-700 hover:bg-green-600 text-white"
                    >
                      Use OpenRouter
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Free Models Option - For logged-in users */}
            {user && !availableFreeProviders.includes(selectedProvider) && (
              <div className="flex flex-col space-y-3 rounded-lg border-green-700/30 bg-green-900/10 p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium bruno-text-primary">
                    Use Free Models
                  </h3>
                  <span className="rounded-full bg-[color:oklch(var(--bruno-green))] px-2 py-0.5 text-xs text-[color:oklch(var(--primary-foreground))]">
                    Recommended
                  </span>
                </div>
                <p className="flex-1 text-sm bruno-text-secondary">
                  You have free access to multiple AI models, including Llama,
                  Gemini, DeepSeek, and Mistral.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => onProviderChange("meta")}
                    className="bruno-button-green"
                  >
                    Use Llama
                  </Button>
                  <Button
                    onClick={() => onProviderChange("google")}
                    variant="outline"
                    className="border-[color:oklch(var(--bruno-green)/0.5)] text-[color:oklch(var(--bruno-green))] hover:bg-[color:oklch(var(--bruno-green)/0.1)]"
                  >
                    Use Gemini
                  </Button>
                  <Button
                    onClick={() => onProviderChange("mistral")}
                    variant="outline"
                    className="border-[color:oklch(var(--bruno-green)/0.5)] text-[color:oklch(var(--bruno-green))] hover:bg-[color:oklch(var(--bruno-green)/0.1)]"
                  >
                    Use Mistral
                  </Button>
                </div>
              </div>
            )}

            {/* API Key Option */}
            <div className="flex flex-col space-y-3 rounded-lg bruno-border bg-[color:oklch(var(--muted)/0.5)] p-4">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium bruno-text-primary">
                  Use Your Own API Key
                </h3>
                {!user && (
                  <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs text-[color:oklch(var(--secondary-foreground))]">
                    No account needed
                  </span>
                )}
              </div>
              <p className="flex-1 text-sm bruno-text-secondary">
                Add your own API key from OpenRouter to access 200+ models from
                all providers with a single key.
              </p>

              <div className="text-xs bg-[color:oklch(var(--muted)/0.7)] p-2 rounded bruno-border bruno-text-secondary">
                OpenRouter gives you pay-as-you-go access to models from OpenAI,
                Anthropic, Google, Meta and others with just one API key.
              </div>

              <Button onClick={onOpenApiKeyModal} className="text-white">
                <Key className="mr-2 h-4 w-4" />
                Add API Key
              </Button>
            </div>

            {/* Create Account Option - Only for non-logged in users */}
            {!user && (
              <div className="flex flex-col space-y-3 rounded-lg border border-green-700/30 bg-green-900/10 p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium bruno-text-primary">
                    Create a Free Account
                  </h3>
                </div>
                <p className="flex-1 text-sm bruno-text-secondary">
                  Sign up for a free account to access multiple free models and
                  save your chat history.
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Link
                    to="/sign-up"
                    className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all bg-gradient-to-r from-green-400 to-green-700"
                  >
                    Create Free Account
                  </Link>
                  <Link
                    to="/sign-in"
                    className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all bg-green-500 "
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Help Link */}
          <p className="text-center text-xs mt-4">
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

        {/* Provider Selection */}
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

                  <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="meta">
                    Meta (llama) {user && <Badge>Free</Badge>}
                  </SelectItem>
                  <SelectItem value="google">Google (Gemini)</SelectItem>
                  <SelectItem value="deepseek">
                    DeepSeek {user && <Badge>Free</Badge>}
                  </SelectItem>

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
                <span
                  className="flex items-center cursor-pointer text-amber-500"
                  onClick={onOpenApiKeyModal}
                >
                  <div className="mr-1 h-2 w-2 rounded-full bg-amber-500"></div>
                  API Key
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
