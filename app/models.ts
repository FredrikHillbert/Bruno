
import { type ReactNode } from "react";
import { Brain, BookOpen, Calculator, Code, Sparkles, Zap } from "lucide-react";


export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  isFree: boolean;
  needsApiKey: boolean;
  icon: React.ElementType;
  color: string;
  models: ModelOption[];
}

// Define providers first
export const providers: ProviderInfo[] = [
  {
    id: "meta",
    name: "Meta (Llama)",
    description: "Free, open-source models with good all-round performance",
    isFree: true,
    needsApiKey: false,
    icon: Code,
    color: "bg-blue-700 hover:bg-blue-600",
    models: [
      {
        id: "llama3-70b-8192",
        name: "Llama 3.1 70B",
        description: "Most capable",
      },
      {
        id: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B",
        description: "Fast & efficient",
      },
      {
        id: "meta-llama/llama-4-maverick-17b-128e-instruct",
        name: "Llama Maverick 17B",
        description: "Latest model",
      },
    ],
  },
  {
    id: "google",
    name: "Google (Gemini)",
    description: "Free models good at research and coding tasks",
    isFree: true,
    needsApiKey: false,
    icon: BookOpen ,
    color: "bg-green-700 hover:bg-green-600",
    models: [
      {
        id: "gemma2-9b-it",
        name: "Gemini 2-9B",
        description: "Efficiency and summarization",
      },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "Free models optimized for reasoning and problem-solving",
    isFree: true,
    needsApiKey: false,
    icon: Brain,
    color: "bg-amber-700 hover:bg-amber-600",
    models: [
      {
        id: "deepseek-r1-distill-llama-70b",
        name: "Deepseek R1",
        description: "Cost effective",
      },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access to 200+ models from all providers with one API key",
    isFree: false,
    needsApiKey: true,
    icon: Zap,
    color: "bg-pink-700 hover:bg-pink-600",
    models: [
      {
        id: "openai/gpt-4o",
        name: "GPT-4o",
        description: "OpenAI's latest multimodal model",
      },
      {
        id: "anthropic/claude-3-opus",
        name: "Claude 3 Opus",
        description: "Anthropic's most powerful model",
      },
      {
        id: "anthropic/claude-3-sonnet",
        name: "Claude 3 Sonnet",
        description: "Balanced performance and cost",
      },
      {
        id: "anthropic/claude-3-haiku",
        name: "Claude 3 Haiku",
        description: "Fast and efficient",
      },
      {
        id: "meta-llama/llama-3.3-70b-instruct",
        name: "Llama 3.3 70B",
        description: "Meta's largest open model",
      },
      {
        id: "meta-llama/llama-3.1-8b-instruct",
        name: "Llama 3.1 8B",
        description: "Efficient open source model",
      },
      {
        id: "google/gemini-flash-1.5",
        name: "Gemini 1.5 Flash",
        description: "Google's fast multimodal model",
      },
      {
        id: "mistral/mistral-small",
        name: "Mistral Small",
        description: "Compact but capable model",
      },
      {
        id: "perplexity/sonar-small-online",
        name: "Sonar (Perplexity)",
        description: "Real-time internet access",
      },
      {
        id: "qwen/qwen3-30b-a3b",
        name: "Qwen 3.0 (30B)",
        description: "High performance Chinese-English model",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    description: "High-quality models with excellent creative writing abilities",
    isFree: false,
    needsApiKey: true,
    icon: Sparkles,
    color: "bg-purple-700 hover:bg-purple-600",
    models: [
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        description: "Most capable",
      },
      {
        id: "claude-3-sonnet-20240229",
        name: "Claude 3 Sonnet",
        description: "Balanced",
      },
      {
        id: "claude-3-haiku-20240307",
        name: "Claude 3 Haiku",
        description: "Fast & affordable",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI (ChatGPT)",
    description: "Versatile models with strong performance across most tasks",
    isFree: false,
    needsApiKey: true,
    icon: Calculator,
    color: "bg-red-700 hover:bg-red-600",
    models: [
      { id: "gpt-4o", name: "GPT-4o", description: "Most capable" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Fast & balanced" },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        description: "Budget friendly",
      },
    ],
  },
];

// For backward compatibility
export const providerModels: Record<string, ModelOption[]> = {};

// Initialize providerModels from the providers array
providers.forEach(provider => {
  providerModels[provider.id] = provider.models;
});

// Helper function to get model name from id
export function getModelNameFromId(modelId: string): string {
  for (const provider of providers) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model) return model.name;
  }
  return modelId; // Return the ID if no matching model is found
}

// Helper function to get model by ID
export function getModelById(modelId: string): ModelOption | undefined {
  for (const provider of providers) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model) return model;
  }
  return undefined;
}

// Helper function to get provider from model ID
export function getProviderFromModelId(modelId: string): string | undefined {
  for (const provider of providers) {
    if (provider.models.some((m) => m.id === modelId)) {
      return provider.id;
    }
  }
  return undefined;
}

// Helper to get provider info by ID
export function getProviderById(providerId: string): ProviderInfo | undefined {
  return providers.find(p => p.id === providerId);
}

// Group OpenRouter models by category for better organization
export const openRouterModelCategories = {
  topTier: ["openai/gpt-4o", "anthropic/claude-3-opus", "anthropic/claude-3-sonnet", "meta-llama/llama-3.3-70b-instruct"],
  fastEfficient: ["anthropic/claude-3-haiku", "google/gemini-flash-1.5", "mistral/mistral-small"],
  specialized: ["perplexity/sonar-small-online", "qwen/qwen3-30b-a3b", "meta-llama/llama-3.1-8b-instruct"]
};