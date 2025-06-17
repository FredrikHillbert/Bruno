import { providerModels } from "@/models";

export interface ModelRateLimit {
  // Daily request limits
  freeRequestsPerDay: number;
  subscriberRequestsPerDay: number;

  // Token limits (approximately, varies by model)
  freeTokensPerDay: number;
  subscriberTokensPerDay: number;

  // Cooldown period in seconds (optional)
  freeCooldownSeconds?: number;
  subscriberCooldownSeconds?: number;
}

// Default rate limits to use for any model not explicitly configured
export const defaultRateLimits: ModelRateLimit = {
  freeRequestsPerDay: 10,
  subscriberRequestsPerDay: 100,
  freeTokensPerDay: 10000, // ~6000 words
  subscriberTokensPerDay: 100000, // ~60000 words
};

// Model-specific rate limits
export const modelRateLimits: Record<string, ModelRateLimit> = {
  // Llama models (free tier)
  "llama3-70b-8192": {
    freeRequestsPerDay: 20,
    subscriberRequestsPerDay: 200,
    freeTokensPerDay: 20000,
    subscriberTokensPerDay: 200000,
  },
  "llama-3.1-8b-instant": {
    freeRequestsPerDay: 50,
    subscriberRequestsPerDay: 500,
    freeTokensPerDay: 50000,
    subscriberTokensPerDay: 500000,
  },
  "meta-llama/llama-4-maverick-17b-128e-instruct": {
    freeRequestsPerDay: 10,
    subscriberRequestsPerDay: 100,
    freeTokensPerDay: 10000,
    subscriberTokensPerDay: 100000,
  },

  "mistral-saba-24b": {
    freeRequestsPerDay: 20,
    subscriberRequestsPerDay: 200,
    freeTokensPerDay: 20000,
    subscriberTokensPerDay: 200000,
  },

  "qwen-qwq-32b	": {
    freeRequestsPerDay: 20,
    subscriberRequestsPerDay: 200,
    freeTokensPerDay: 20000,
    subscriberTokensPerDay: 200000,
  },
  "deepseek-r1-distill-llama-70b": {
    freeRequestsPerDay: 20,
    subscriberRequestsPerDay: 200,
    freeTokensPerDay: 20000,
    subscriberTokensPerDay: 200000,
  },

  "gemma2-9b-it": {
    freeRequestsPerDay: 20,
    subscriberRequestsPerDay: 200,
    freeTokensPerDay: 20000,
    subscriberTokensPerDay: 200000,
    freeCooldownSeconds: 60, // Longer cooldown for free users
    subscriberCooldownSeconds: 30, // Premium users have a shorter cooldown
  },

  // Premium models
  "gpt-4o": {
    freeRequestsPerDay: 0, // Not available on free tier
    subscriberRequestsPerDay: 50,
    freeTokensPerDay: 0,
    subscriberTokensPerDay: 50000,
    subscriberCooldownSeconds: 30, // Premium users still have a cooldown
  },
  "claude-3-opus-20240229": {
    freeRequestsPerDay: 0, // Not available on free tier
    subscriberRequestsPerDay: 50,
    freeTokensPerDay: 0,
    subscriberTokensPerDay: 50000,
    subscriberCooldownSeconds: 30,
  },
};

// Helper function to get rate limits for a specific model
export function getRateLimitsForModel(modelId: string): ModelRateLimit {
  return modelRateLimits[modelId] || defaultRateLimits;
}

// Helper to estimate token usage for a message
export function estimateTokenCount(text: string): number {
  // Simple approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
