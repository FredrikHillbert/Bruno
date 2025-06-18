import { useState, useEffect, useRef, useMemo, createElement } from "react";
import { type Message } from "ai";
import { useChat } from "@ai-sdk/react";
import { ChatMessageLoading } from "./chat-message-loading";
import { Button } from "./ui/button";
import { Info, Loader2, Lock, Zap } from "lucide-react";
import { providerModels } from "@/models";
import type { User } from "@/routes/layout";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { Brain, Wand2 } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import NoAccessSection from "./no-access-section";
import {
  providers,
  getModelNameFromId,
  getProviderById,
  openRouterModelCategories,
} from "@/models";
import { Link } from "react-router";

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
  chatId,
  initialMessages = [],
  onChatUpdate,
  selectedProvider,
  onProviderChange,
  selectedModel: initialSelectedModel,
}: ChatAreaProps) {
  const [selectedModel, setSelectedModel] = useState(() => {
    if (initialSelectedModel) return initialSelectedModel;

    // Get the provider info
    const provider = getProviderById(selectedProvider);
    if (provider && provider.models.length > 0) {
      return provider.models[0].id;
    }
    return "";
  });

  const [showRecommendations, setShowRecommendations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [customModelId, setCustomModelId] = useState<string>("");

  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectorMode, setSelectorMode] = useState<"provider" | "model">(
    "provider"
  );
  const [selectedProviderTemp, setSelectedProviderTemp] =
    useState(selectedProvider);

  // Provider access checker
  const hasProviderAccess = (providerId: string) => {
    const provider = getProviderById(providerId);
    if (!provider) return false;

    // User has subscription - can access all providers
    if (user?.isSubscribed) return true;

    // User has API key for this provider
    if (apiKeys[providerId]) return true;

    // Free providers are accessible to authenticated users
    if (user && provider.isFree) return true;

    return false;
  };

  const getFriendlyModelName = (modelId: string) => {
    // Use the helper function from models.ts
    return getModelNameFromId(modelId);
  };

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

  // // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Set initial messages when they change (e.g., when switching chats)
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

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

  if (!hasAccess) {
    return (
      <NoAccessSection
        onOpenApiKeyModal={onOpenApiKeyModal}
        onProviderChange={onProviderChange}
      />
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
            <MessageList messages={messages} userImage={user?.image} />
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

        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          status={status}
        />
        {/* Provider Selection */}
        <div className="mt-2 flex flex-row justify-between gap-2">
          {/* Provider Selection Button */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="h-9 border-zinc-700 text-white bg-zinc-800 hover:bg-zinc-700 flex items-center gap-2"
              onClick={() => {
                setShowModelSelector(true);
                setSelectorMode("provider");
              }}
            >
              {getProviderById(selectedProvider) && (
                <div className="h-4 w-4 mr-1">
                  {createElement(getProviderById(selectedProvider)!.icon, {
                    size: 16,
                  })}
                </div>
              )}

              <span className="font-medium">
                {getProviderById(selectedProvider)?.name || "Select Provider"}
              </span>
              <span className="text-zinc-400">/</span>
              <span>{getFriendlyModelName(selectedModel)}</span>
              <ArrowRight className="h-4 w-4 ml-1 text-zinc-500" />
            </Button>
          </div>
          <div className=" flex justify-end bg-black text-xs text-zinc-500">
            <div className="flex items-center justify-end gap-3">
              <Link
                to="/about"
                className="text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <Info className="h-3 w-3" />
                <span>About Bruno</span>
              </Link>
              <span>•</span>
              <a
                href="https://github.com/FredrikHillbert/Bruno"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </a>
              <span>•</span>
              <a
                href="https://x.com/CodeBuddyBenny"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Twitter</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* Provider/Model Selector Dialog */}
      <Dialog open={showModelSelector} onOpenChange={setShowModelSelector}>
        <DialogContent className="sm:max-w-lg md:max-w-xl bg-zinc-900 text-white border-zinc-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {selectorMode === "provider" ? (
                <>
                  <Zap className="h-5 w-5 text-blue-400" />
                  Select AI Provider
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5 text-green-400" />
                  Select{" "}
                  {getProviderById(selectedProviderTemp)?.name.split(" ")[0] ||
                    selectedProviderTemp}{" "}
                  Model
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Provider Selection */}
            {selectorMode === "provider" && (
              <div className="grid grid-cols-1 gap-2">
                {/* Free Providers - Show to everyone, but disabled for non-authenticated */}
                <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                  Free AI Providers For Authenticated Users
                </h3>
                <div className="space-y-1.5 mb-4">
                  {providers
                    .filter((p) => p.isFree)
                    .map((provider) => (
                      <Button
                        key={provider.id}
                        variant="outline"
                        className={`w-full justify-between border-zinc-700 text-left p-3 h-auto 
                        ${
                          hasProviderAccess(provider.id)
                            ? "hover:bg-zinc-800"
                            : "opacity-50"
                        }`}
                        onClick={() => {
                          if (hasProviderAccess(provider.id)) {
                            setSelectedProviderTemp(provider.id);
                            setSelectorMode("model");
                          } else if (!user) {
                            // Show login prompt for unauthenticated users
                            toast.error(
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                  Login required
                                </span>
                                <span className="text-sm">
                                  Create a free account to access these models
                                </span>
                              </div>
                            );
                          }
                        }}
                        disabled={!hasProviderAccess(provider.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              provider.color.split(" ")[0]
                            }`}
                          >
                            {createElement(
                              getProviderById(selectedProvider)!.icon,
                              { size: 16 }
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white flex items-center">
                              {provider.name}
                              <Badge className="ml-2 bg-green-800 text-green-300 text-[10px]">
                                Free
                              </Badge>
                            </div>
                            <div className="text-xs text-zinc-400 mt-1">
                              {provider.description}
                            </div>
                          </div>
                        </div>
                        {hasProviderAccess(provider.id) ? (
                          <ArrowRight className="h-4 w-4 text-zinc-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-zinc-500" />
                        )}
                      </Button>
                    ))}
                </div>

                {/* API Key Providers */}
                <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                  API Key Required
                </h3>
                <div className="space-y-1.5">
                  {providers
                    .filter((p) => !p.isFree)
                    .map((provider) => (
                      <Button
                        key={provider.id}
                        variant="outline"
                        className={`w-full justify-between border-zinc-700 text-left p-3 h-auto 
                        ${
                          hasProviderAccess(provider.id)
                            ? "hover:bg-zinc-800"
                            : "opacity-70 hover:bg-zinc-800/50"
                        }`}
                        onClick={() => {
                          if (hasProviderAccess(provider.id)) {
                            setSelectedProviderTemp(provider.id);
                            setSelectorMode("model");
                          } else {
                            // Show prompt to add API key for authenticated users
                            toast.error(
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                  {provider.name} requires an API key
                                </span>
                                <span className="text-sm">
                                  Add your key to access these models
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 text-xs bg-zinc-800 border-zinc-700 text-white"
                                  onClick={() => {
                                    setShowModelSelector(false);
                                    onOpenApiKeyModal();
                                  }}
                                >
                                  Add API Key
                                </Button>
                              </div>
                            );
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              provider.color.split(" ")[0]
                            }`}
                          >
                            {createElement(
                              getProviderById(selectedProvider)!.icon,
                              { size: 16 }
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white flex items-center">
                              {provider.name}
                              {hasProviderAccess(provider.id) ? (
                                <Badge className="ml-2 bg-blue-800 text-blue-300 text-[10px]">
                                  API Key Added
                                </Badge>
                              ) : (
                                <Badge className="ml-2 bg-amber-800 text-amber-300 text-[10px]">
                                  API Key Required
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 mt-1">
                              {provider.description}
                            </div>
                          </div>
                        </div>

                        {hasProviderAccess(provider.id) ? (
                          <ArrowRight className="h-4 w-4 text-zinc-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-zinc-500" />
                        )}
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {/* Model Selection for OpenRouter */}
            {selectorMode === "model" &&
              selectedProviderTemp === "openrouter" && (
                <div className="grid grid-cols-1 gap-2">
                  {/* Top-tier models */}
                  <div className="mb-4">
                    <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                      Top-Tier Models
                    </h3>
                    <div className="space-y-1.5">
                      {getProviderById("openrouter")
                        ?.models.filter((model) =>
                          openRouterModelCategories.topTier.includes(model.id)
                        )
                        .map((model) => (
                          <Button
                            key={model.id}
                            variant="outline"
                            className="w-full justify-between border-zinc-700 text-left p-3 h-auto hover:bg-zinc-800"
                            onClick={() => {
                              onProviderChange(selectedProviderTemp);
                              setSelectedModel(model.id);
                              setShowModelSelector(false);
                              toast.success(`Switched to ${model.name}`);
                            }}
                          >
                            <div>
                              <div className="font-medium text-white">
                                {model.name}
                              </div>
                              <div className="text-xs text-zinc-400">
                                {model.description}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-zinc-500" />
                          </Button>
                        ))}
                    </div>
                  </div>

                  {/* Fast & Efficient */}
                  <div className="mb-4">
                    <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                      Fast & Efficient Models
                    </h3>
                    <div className="space-y-1.5">
                      {getProviderById("openrouter")
                        ?.models.filter((model) =>
                          openRouterModelCategories.fastEfficient.includes(
                            model.id
                          )
                        )
                        .map((model) => (
                          <Button
                            key={model.id}
                            variant="outline"
                            className="w-full justify-between border-zinc-700 text-left p-3 h-auto hover:bg-zinc-800"
                            onClick={() => {
                              onProviderChange(selectedProviderTemp);
                              setSelectedModel(model.id);
                              setShowModelSelector(false);
                              toast.success(`Switched to ${model.name}`);
                            }}
                          >
                            <div>
                              <div className="font-medium text-white">
                                {model.name}
                              </div>
                              <div className="text-xs text-zinc-400">
                                {model.description}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-zinc-500" />
                          </Button>
                        ))}
                    </div>
                  </div>

                  {/* Specialized Models */}
                  <div className="mb-4">
                    <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                      Specialized Models
                    </h3>
                    <div className="space-y-1.5">
                      {getProviderById("openrouter")
                        ?.models.filter((model) =>
                          openRouterModelCategories.specialized.includes(
                            model.id
                          )
                        )
                        .map((model) => (
                          <Button
                            key={model.id}
                            variant="outline"
                            className="w-full justify-between border-zinc-700 text-left p-3 h-auto hover:bg-zinc-800"
                            onClick={() => {
                              onProviderChange(selectedProviderTemp);
                              setSelectedModel(model.id);
                              setShowModelSelector(false);
                              toast.success(`Switched to ${model.name}`);
                            }}
                          >
                            <div>
                              <div className="font-medium text-white">
                                {model.name}
                              </div>
                              <div className="text-xs text-zinc-400">
                                {model.description}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-zinc-500" />
                          </Button>
                        ))}
                    </div>
                  </div>

                  {/* Custom Model Input */}
                  <div className="mt-6 pt-4 border-t border-zinc-800">
                    <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                      Custom Model ID
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="provider/model-id (e.g., anthropic/claude-3-sonnet)"
                        value={customModelId || ""}
                        onChange={(e) => setCustomModelId(e.target.value)}
                        className="flex-1 h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                      />
                      <Button
                        onClick={() => {
                          if (customModelId?.trim()) {
                            onProviderChange(selectedProviderTemp);
                            setSelectedModel(customModelId.trim());
                            setShowModelSelector(false);
                            toast.success(
                              `Using custom model: ${customModelId}`
                            );
                          }
                        }}
                        disabled={!customModelId?.trim()}
                        className="bg-pink-800 hover:bg-pink-700 text-white"
                      >
                        Use
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Enter any OpenRouter model ID (e.g.,
                      "anthropic/claude-3-sonnet")
                    </p>
                  </div>
                </div>
              )}

            {/* Model Selection for Regular Providers */}
            {selectorMode === "model" &&
              selectedProviderTemp !== "openrouter" && (
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1.5">
                    {getProviderById(selectedProviderTemp)?.models.map(
                      (model) => (
                        <Button
                          key={model.id}
                          variant="outline"
                          className="w-full justify-between border-zinc-700 text-left p-3 h-auto hover:bg-zinc-800"
                          onClick={() => {
                            onProviderChange(selectedProviderTemp);
                            setSelectedModel(model.id);
                            setShowModelSelector(false);
                            toast.success(`Switched to ${model.name}`);
                          }}
                        >
                          <div>
                            <div className="font-medium text-white">
                              {model.name}
                            </div>
                            <div className="text-xs text-zinc-400">
                              {model.description}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-zinc-500" />
                        </Button>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>

          <div className="flex justify-between mt-4">
            {selectorMode === "model" && (
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-400"
                onClick={() => setSelectorMode("provider")}
              >
                Back to Providers
              </Button>
            )}

            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-400 ml-auto"
              onClick={() => setShowModelSelector(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
