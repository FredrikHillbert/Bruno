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
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Budget friendly" },
  ],
  meta: [
    { id: "meta-llama/Meta-Llama-3.1-70B-Instruct", name: "Llama 3.1 70B", description: "Most capable" },
    { id: "meta-llama/Meta-Llama-3.1-8B-Instruct", name: "Llama 3.1 8B", description: "Fast & efficient" },
    { id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama Maverick 17B", description: "Latest model" },
  ],
  anthropic: [
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus", description: "Most capable" },
    { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet", description: "Balanced" },
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", description: "Fast & affordable" },
  ],
};

// Helper function to get model name from id
export function getModelNameFromId(modelId: string): string {
  for (const provider in providerModels) {
    const model = providerModels[provider].find(m => m.id === modelId);
    if (model) return model.name;
  }
  return modelId; // Return the ID if no matching model is found
}

// Helper function to get model by ID
export function getModelById(modelId: string): ModelOption | undefined {
  for (const provider in providerModels) {
    const model = providerModels[provider].find(m => m.id === modelId);
    if (model) return model;
  }
  return undefined;
}

// Helper function to get provider from model ID
export function getProviderFromModelId(modelId: string): string | undefined {
  for (const provider in providerModels) {
    if (providerModels[provider].some(m => m.id === modelId)) {
      return provider;
    }
  }
  return undefined;
}