"use client";

import { useState, useEffect, useRef } from "react";
import { type Message, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "./chat-message";
import { ChatMessageLoading } from "./chat-message-loading";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Info, Key, Loader2, Send } from "lucide-react";
import { providerModels } from "@/models";
import { Link } from "react-router";

interface ChatAreaProps {
  apiKeys: Record<string, string>;
  isUserPremium: boolean;
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
  isUserPremium,
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

  const hasAccess = isUserPremium || apiKeys[selectedProvider];

  // Configure the chat
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
      "x-user-premium": isUserPremium ? "true" : "false",
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
<div className="flex h-full w-full flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Key className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Access Required</h2>
          <p className="text-muted-foreground">
            Choose how you want to access AI models from{" "}
            <span className="font-medium text-foreground">
              {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}
            </span>
          </p>
        </div>

        {/* Provider Selection */}
        <div className="space-y-2">
          <label htmlFor="provider-select" className="text-sm font-medium">
            Select AI Provider:
          </label>
          <select
            id="provider-select"
            value={selectedProvider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="openai">OpenAI (ChatGPT)</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="meta">Meta (Llama)</option>
            <option value="google">Google (Gemini)</option>
            <option value="deepseek">DeepSeek</option>
            <option value="mistral">Mistral</option>
          </select>
        </div>

        {/* Options with divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Access Options</span>
          </div>
        </div>

        {/* Option Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* BYOK Option */}
          <div className="flex flex-col space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10">
            <h3 className="font-medium">Use Your Own API Key</h3>
            <p className="flex-1 text-xs text-muted-foreground">
              Provide your own API key from {selectedProvider.charAt(0).toUpperCase() + 
              selectedProvider.slice(1)}. Your key remains securely stored in your browser.
            </p>
            <Button
              onClick={onOpenApiKeyModal}
              className="mt-2 w-full"
            >
              <Key className="mr-2 h-4 w-4" />
              Add API Key
            </Button>
          </div>

          {/* Premium Option */}
          <div className="flex flex-col space-y-2 rounded-lg border border-primary p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium">Premium Access</h3>
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                Recommended
              </span>
            </div>
            <p className="flex-1 text-xs text-muted-foreground">
              Subscribe to our premium plan for seamless access to all AI providers with no need for API keys.
            </p>
            <Button
              onClick={onOpenSubscriptionModal}
              variant="default"
              className="mt-2 w-full"
            >
              Subscribe to Premium
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-muted-foreground">
          Need help? <Link to="/learn-more" className="text-primary hover:underline">Learn more</Link> about 
          API keys and subscription options.
        </p>
      </div>
    </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <h2 className="mb-2 text-2xl font-bold">Start a Conversation</h2>
            <p className="mb-8 max-w-md text-muted-foreground">
              Ask a question or request information from the AI.
            </p>

            {showRecommendations && (
              <div className="grid gap-2 md:grid-cols-2">
                <Button
                  variant="outline"
                  className="justify-start text-left"
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
                  className="justify-start text-left"
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
                  className="justify-start text-left"
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
                  className="justify-start text-left"
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
              className="mt-4"
              onClick={() => setShowRecommendations(!showRecommendations)}
            >
              {showRecommendations ? "Hide suggestions" : "Show suggestions"}
            </Button>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {status === "submitted" && <ChatMessageLoading />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        {error && (
          <div className="mb-2 rounded bg-destructive/10 p-2 text-sm text-destructive">
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
            className="min-h-[60px] w-full resize-none pr-12"
            disabled={status === "submitted"}
          />
          <Button
            type="submit"
            size="icon"
            disabled={status === "submitted" || !input.trim()}
            className="absolute bottom-2 right-2"
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
            <select
              value={selectedProvider}
              onChange={(e) => onProviderChange(e.target.value)}
              className="rounded border bg-background px-2 py-1 text-sm"
              disabled={status === "submitted"}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="meta">Meta</option>
              <option value="google">Google</option>
              <option value="deepseek">DeepSeek</option>
              <option value="mistral">Mistral</option>
            </select>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded border bg-background px-2 py-1 text-sm"
              disabled={
                status === "submitted" || !providerModels[selectedProvider]
              }
            >
              {providerModels[
                selectedProvider as keyof typeof providerModels
              ]?.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-muted-foreground">
            {isUserPremium ? "Premium" : "Using your API key"}
          </div>
        </div>
      </div>
    </div>
  );
}
