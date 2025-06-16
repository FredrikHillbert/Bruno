// Define the provider models centrally for consistency

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export const providerModels: Record<string, ModelOption[]> = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o", description: "Most capable" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Fast & balanced" },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      description: "Budget friendly",
    },
  ],
  meta: [
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
  deepseek: [
    {
      id: "deepseek-r1-distill-llama-70b",
      name: "Deepseek R1",
      description: "Cost effective",
    },
  ],
  google: [
    {
      id: "gemma2-9b-it	",
      name: "Gemini 2-9B",
      description: "Efficiency and summarization",
    },
  ],
  anthropic: [
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
  openrouter: [
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
      id: "meta-llama/llama-3.3-70b-instruct",
      name: "Llama 3.1 (70B)",
      description: "Meta's largest open model",
    },
    {
      id: "google/gemini-flash-1.5",
      name: "Gemini 1.5 Flash",
      description: "Google's advanced multimodal model",
    },
    {
      id: "qwen/qwen3-30b-a3b:free",
      name: "Qwen 3.0 (30B)",
      description: "Qwen's latest model with advanced capabilities",
    },
    {
      id: "custom-model-input",
      name: "Custom Model ID...",
      description: "Enter any OpenRouter-supported model ID",
    },
  ],
};

// Helper function to get model name from id
export function getModelNameFromId(modelId: string): string {
  for (const provider in providerModels) {
    const model = providerModels[provider].find((m) => m.id === modelId);
    if (model) return model.name;
  }
  return modelId; // Return the ID if no matching model is found
}

// Helper function to get model by ID
export function getModelById(modelId: string): ModelOption | undefined {
  for (const provider in providerModels) {
    const model = providerModels[provider].find((m) => m.id === modelId);
    if (model) return model;
  }
  return undefined;
}

// Helper function to get provider from model ID
export function getProviderFromModelId(modelId: string): string | undefined {
  for (const provider in providerModels) {
    if (providerModels[provider].some((m) => m.id === modelId)) {
      return provider;
    }
  }
  return undefined;
}
