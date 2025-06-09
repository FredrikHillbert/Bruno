"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useChat } from "@ai-sdk/react";
import {
  Sparkles,
  BookOpen,
  Code,
  GraduationCap,
  Send,
  Paperclip,
  Key,
  Crown,
  Settings,
} from "lucide-react";
import type { UserPlan } from "@/routes/home";
import { ModelRecommendations } from "@/components/model-recommendations";

interface ChatAreaProps {
  apiKeys: Record<string, string>;
  userPlan: UserPlan;
  onOpenApiKeyModal: () => void;
  onOpenSubscriptionModal: () => void;
  chatId: string | null;
  onChatIdChange: (chatId: string) => void;
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
}

const providerModels = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o", description: "Most capable" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast & efficient" },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      description: "Classic choice",
    },
  ],
  anthropic: [
    {
      id: "claude-3-5-sonnet-20241022",
      name: "Claude 3.5 Sonnet",
      description: "Best overall",
    },
    {
      id: "claude-3-haiku-20240307",
      name: "Claude 3 Haiku",
      description: "Fast & affordable",
    },
  ],
  google: [
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      description: "Large context",
    },
    {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      description: "Fast responses",
    },
  ],
  deepseek: [
    { id: "deepseek-chat", name: "DeepSeek Chat", description: "Best value" },
    {
      id: "deepseek-coder",
      name: "DeepSeek Coder",
      description: "Coding focused",
    },
  ],
};

export function ChatArea({
  apiKeys,
  userPlan,
  onOpenApiKeyModal,
  onOpenSubscriptionModal,
  chatId,
  onChatIdChange,
  selectedProvider,
  onProviderChange,
}: ChatAreaProps) {
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [showRecommendations, setShowRecommendations] = useState(false);

  const hasAccess = userPlan.type === "premium" || apiKeys[selectedProvider];

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      headers: {
        "Content-Type": "multipart/form-data", // <--- ADD THIS LINE

        "x-api-key": apiKeys[selectedProvider] || "",
        "x-user-plan": userPlan.type,
      },
      body: {
        model: selectedModel,
        provider: selectedProvider,
      },
      onFinish: (message) => {
        if (!chatId && userPlan.type === "premium") {
          const newChatId = Date.now().toString();
          onChatIdChange(newChatId);

          // Save chat to history (only for premium users)
          const chatHistory = JSON.parse(
            localStorage.getItem("chat-history") || "[]"
          );
          const newChat = {
            id: newChatId,
            title: input.slice(0, 50) + (input.length > 50 ? "..." : ""),
            timestamp: new Date().toISOString(),
          };
          chatHistory.unshift(newChat);
          localStorage.setItem(
            "chat-history",
            JSON.stringify(chatHistory.slice(0, 50))
          );
        }
      },
    });

  const sampleQuestions = [
    "How does AI work?",
    "Write a Python function to sort a list",
    "Explain quantum computing simply",
    "Help me write a professional email",
  ];

  const categories = [
    {
      name: "Create",
      icon: Sparkles,
      color: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    },
    {
      name: "Explore",
      icon: BookOpen,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    {
      name: "Code",
      icon: Code,
      color: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    {
      name: "Learn",
      icon: GraduationCap,
      color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    },
  ];

  const handleQuestionClick = (question: string) => {
    handleInputChange({ target: { value: question } } as any);
  };

  const handleModelSelect = (provider: string, model: string) => {
    onProviderChange(provider);
    setSelectedModel(model);
    setShowRecommendations(false);
  };

  if (!hasAccess) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-6">
            {userPlan.type === "free" ? (
              <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            ) : (
              <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            )}
          </div>
          <h2 className="text-xl font-semibold mb-2">Get Started</h2>
          <p className="text-muted-foreground mb-6">
            Choose how you'd like to access AI models
          </p>
          <div className="space-y-3">
            <Button onClick={onOpenSubscriptionModal} className="w-full">
              <Crown className="h-4 w-4 mr-2" />
              Subscribe for $5/month
            </Button>
            <Button
              onClick={onOpenApiKeyModal}
              variant="outline"
              className="w-full"
            >
              <Key className="h-4 w-4 mr-2" />
              Bring Your Own Key
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showRecommendations) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <ModelRecommendations onSelectModel={handleModelSelect} />
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={() => setShowRecommendations(false)}
            >
              Back to Chat
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-6">
        {messages.length === 0 ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-6">How can I help you?</h1>

              <div className="flex flex-wrap gap-3 justify-center mb-8">
                {categories.map((category) => (
                  <Badge
                    key={category.name}
                    variant="outline"
                    className={`px-4 py-2 cursor-pointer hover:bg-opacity-20 ${category.color}`}
                  >
                    <category.icon className="h-4 w-4 mr-2" />
                    {category.name}
                  </Badge>
                ))}
              </div>

              <div className="space-y-3 mb-8">
                {sampleQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="block w-full text-left p-4 h-auto hover:bg-muted/50"
                    onClick={() => handleQuestionClick(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>

              <Button
                onClick={() => setShowRecommendations(true)}
                variant="outline"
                className="mb-4"
              >
                <Settings className="h-4 w-4 mr-2" />
                Choose the Right Model
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-current rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-current rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message here..."
                className="min-h-[60px] pr-12 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute bottom-2 right-2"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <select
                  value={selectedProvider}
                  onChange={(e) => onProviderChange(e.target.value)}
                  className="bg-background border rounded px-2 py-1"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-background border rounded px-2 py-1"
                >
                  {providerModels[
                    selectedProvider as keyof typeof providerModels
                  ]?.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.description}
                    </option>
                  ))}
                </select>
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {userPlan.type === "free" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onOpenApiKeyModal}
                    className="text-xs"
                  >
                    <Key className="h-3 w-3 mr-1" />
                    API Keys
                  </Button>
                )}
                {userPlan.type === "premium" && (
                  <Badge variant="outline" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
