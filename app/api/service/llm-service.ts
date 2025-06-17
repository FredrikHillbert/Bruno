import { streamText, type StreamTextResult, type CoreMessage } from "ai";
import { prisma } from "@/db.server";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { groq } from "@ai-sdk/groq";

// Don't create instances here with fixed API keys
// We'll create them dynamically based on user status and API keys

interface LLMProvider {
  name: string;
  sendMessage: (
    chatHistory?: CoreMessage[],
    options?: {
      llmOptions?: any;
      userId?: string;
      threadId?: string;
      providerName?: string;
      modelName?: string;
    }
  ) => Promise<StreamTextResult<any, any> | LLMResponse>;
}

interface LLMResponse {
  content: string;
  provider: string;
  error?: string;
}

class OpenAIProvider implements LLMProvider {
  name = "openai";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(
    chatHistory: CoreMessage[] = [],
    options?: {
      llmOptions?: any;
      userId?: string;
      threadId?: string;
      providerName?: string;
      modelName?: string;
    }
  ): Promise<StreamTextResult<any, any> | LLMResponse> {
    if (!this.apiKey) {
      return {
        content: "",
        provider: this.name,
        error:
          "OpenAI API key not configured. Please provide your own key or subscribe.",
      };
    }

    if (chatHistory.length === 0) {
      return {
        content: "",
        provider: this.name,
        error: "Cannot send an empty message history to OpenAI.",
      };
    }

    try {
      const modelNameToUse = options?.modelName || "gpt-3.5-turbo"; // Default fallback

      // Create instance with the appropriate API key
      const openai = createOpenAI({
        apiKey: this.apiKey,
        baseURL: "https://api.openai.com/v1",
      });

      // Get the specific model instance
      const model = openai.chat(modelNameToUse);

      const result = streamText({
        model: model,
        messages: chatHistory,
        ...options?.llmOptions,
        onFinish: async ({ text }) => {
          if (options?.userId && options?.threadId) {
            try {
              await prisma.message.create({
                data: {
                  content: text,
                  role: "assistant",
                  provider: options.providerName || this.name,
                  threadId: options.threadId,
                  userId: options.userId,
                },
              });
            } catch (dbError) {
              console.error(
                "Failed to save assistant message to DB via onFinish:",
                dbError
              );
            }
          }
        },
      });

      return result;
    } catch (error: any) {
      console.error("OpenAI API Error (streamText):", error);
      return {
        content: "",
        provider: this.name,
        error: `OpenAI API Error: ${error.message}`,
      };
    }
  }
}

class OpenRouterProvider implements LLMProvider {
  name = "openrouter";
  private apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  async sendMessage(
    chatHistory: CoreMessage[] = [],
    options?: {
      llmOptions?: any;
      userId?: string;
      threadId?: string;
      providerName?: string;
      modelName?: string;
    }
  ): Promise<StreamTextResult<any, any> | LLMResponse> {
    if (!this.apiKey) {
      return {
        content: "",
        provider: this.name,
        error:
          "OpenRouter API key not configured. Please provide your own key or subscribe.",
      };
    }
    if (chatHistory.length === 0) {
      return {
        content: "",
        provider: this.name,
        error: "Cannot send an empty message history to OpenRouter.",
      };
    }
    try {
      // Default to a common OpenRouter model
      const modelNameToUse =
        options?.modelName || "meta-llama/Meta-Llama-3.1-70B-Instruct";
      // Create instance with the appropriate API key
      const openRouter = createOpenRouter({
        apiKey: this.apiKey,
      });
      // Get the specific model instance
      const model = openRouter.chat(modelNameToUse);
      const result = streamText({
        model: model,
        messages: chatHistory,
        ...options?.llmOptions,
      });
      return result;
    } catch (error: any) {
      console.error("OpenRouter API Error (streamText):", error);
      return {
        content: "",
        provider: this.name,
        error: `OpenRouter API Error: ${error.message}`,
      };
    }
  }
}

class GroqProvider implements LLMProvider {
  name = "meta";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(
    chatHistory: CoreMessage[] = [],
    options?: {
      llmOptions?: any;
      userId?: string;
      threadId?: string;
      providerName?: string;
      modelName?: string;
    }
  ): Promise<StreamTextResult<any, any> | LLMResponse> {
    if (!this.apiKey) {
      return {
        content: "",
        provider: this.name,
        error:
          "Meta/Llama API key not configured. Please provide your own key or subscribe.",
      };
    }

    if (chatHistory.length === 0) {
      return {
        content: "",
        provider: this.name,
        error: "Cannot send an empty message history to Meta/Llama.",
      };
    }

    try {
      // Default to Llama 4
      const modelNameToUse =
        options?.modelName || "meta-llama/llama-guard-4-12b";

      // Create instance with the appropriate API key via Groq's API
      const meta = createOpenAI({
        apiKey: this.apiKey,
        baseURL: "https://api.groq.com/openai/v1",
      });

      // Get the specific model instance
      const model = meta.chat(modelNameToUse);

      console.log("Using model:", modelNameToUse);

      const result = streamText({
        model: groq(modelNameToUse),
        messages: chatHistory,
        ...options?.llmOptions,
      });

      return result;
    } catch (error: any) {
      console.error("Meta API Error (streamText):", error);
      return {
        content: "",
        provider: this.name,
        error: `Meta API Error: ${error.message}`,
      };
    }
  }
}

class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(
    chatHistory: CoreMessage[] = [],
    options?: {
      llmOptions?: any;
      userId?: string;
      threadId?: string;
      providerName?: string;
      modelName?: string;
    }
  ): Promise<StreamTextResult<any, any> | LLMResponse> {
    if (!this.apiKey) {
      return {
        content: "",
        provider: this.name,
        error:
          "Anthropic API key not configured. Please provide your own key or subscribe.",
      };
    }

    if (chatHistory.length === 0) {
      return {
        content: "",
        provider: this.name,
        error: "Cannot send an empty message history to Anthropic.",
      };
    }

    try {
      const modelNameToUse = options?.modelName || "claude-3-5-haiku-20241022";

      // Create instance with the appropriate API key
      const anthropic = createAnthropic({
        apiKey: this.apiKey,
      });

      const result = streamText({
        model: anthropic(modelNameToUse),
        messages: chatHistory,
        ...options?.llmOptions,
      });

      return result;
    } catch (error: any) {
      console.error("Anthropic API Error (streamText):", error);
      return {
        content: "",
        provider: this.name,
        error: `Anthropic API Error: ${error.message}`,
      };
    }
  }
}

class LLMService {
  // Map provider names to their respective environment variables for API keys
  private readonly providerApiKeyMap: Record<string, string> = {
    openai: process.env.OPENAI_API_KEY || "",
    meta: process.env.GROQ_API_KEY || "",
    google: process.env.GROQ_API_KEY || "",
    deepseek: process.env.GROQ_API_KEY || "",
    mistral: process.env.GROQ_API_KEY || "",
    qwen: process.env.GROQ_API_KEY || "",
    anthropic: process.env.ANTHROPIC_API_KEY || "",
  };

  // Supported providers and models
  private readonly supportedProviders = [
    "openai",
    "meta",
    "anthropic",
    "google",
    "deepseek",
    "mistral",
    "qwen",
    "openrouter",
  ];

  // Default models for each provider if not specified
  private readonly defaultModels: Record<string, string> = {
    openai: "gpt-4o",
    meta: "meta-llama/Meta-Llama-3.1-70B-Instruct",
    google: "gemma2-9b-it",
    deepseek: "deepseek-r1-distill-llama-70b",
    mistral: "mistral-saba-24b",
    qwen: "qwen-qwq-32b",
    openrouter: "meta-llama/Meta-Llama-3.1-70B-Instruct",
    anthropic: "claude-3-opus-20240229",
  };

  public async sendMessageToProvider(
    providerName: string,
    chatHistory: CoreMessage[] = [],
    userApiKey?: string,
    isAuthenticatedAndSubscribed: boolean = false,
    dbSaveOptions?: {
      userId?: string;
      threadId?: string;
      modelName?: string;
    }
  ): Promise<StreamTextResult<any, any> | LLMResponse> {
    // 1. Validate that the provider is supported
    if (!this.supportedProviders.includes(providerName.toLowerCase())) {
      return {
        content: "",
        provider: providerName,
        error: `Provider ${providerName} is not supported. Supported providers are: ${this.supportedProviders.join(
          ", "
        )}`,
      };
    }

    const normalizedProviderName = providerName.toLowerCase();

    // 2. Determine which API key to use
    let effectiveApiKey: string | undefined = userApiKey;

    // If user is a paying subscriber and no user key provided, use our key
    if (!userApiKey && isAuthenticatedAndSubscribed) {
      effectiveApiKey = this.providerApiKeyMap[normalizedProviderName];
    }
    // If not subscribed and no user key, return an error
    else if (!userApiKey && !isAuthenticatedAndSubscribed) {
      return {
        content: "",
        provider: normalizedProviderName,
        error: `API key required for ${normalizedProviderName}. Please provide your own key or subscribe to our service.`,
      };
    }

    if (!effectiveApiKey) {
      return {
        content: "",
        provider: normalizedProviderName,
        error: `No valid API key available for ${normalizedProviderName}. Please check your configuration.`,
      };
    }

    // 3. Create the appropriate provider instance based on the name
    let providerInstance: LLMProvider;

    switch (normalizedProviderName) {
      case "openai":
        providerInstance = new OpenAIProvider(effectiveApiKey);
        break;
      case "meta":
        providerInstance = new GroqProvider(effectiveApiKey);
        break;
      case "google":
        providerInstance = new GroqProvider(effectiveApiKey);
        break;
      case "deepseek":
        providerInstance = new GroqProvider(effectiveApiKey);
        break;
      case "mistral":
        providerInstance = new GroqProvider(effectiveApiKey);
        break;
      case "qwen":
        providerInstance = new GroqProvider(effectiveApiKey);
        break;
      case "anthropic":
        providerInstance = new AnthropicProvider(effectiveApiKey);
        break;
      case "openrouter":
        providerInstance = new OpenRouterProvider(effectiveApiKey);
        break;
      default:
        // This should never happen due to the earlier check
        return {
          content: "",
          provider: normalizedProviderName,
          error: `Provider ${normalizedProviderName} not implemented.`,
        };
    }

    // 4. Call the provider's sendMessage method with the chatHistory and options
    const modelName =
      dbSaveOptions?.modelName || this.defaultModels[normalizedProviderName];

    return providerInstance.sendMessage(chatHistory, {
      ...dbSaveOptions,
      providerName: normalizedProviderName,
      modelName,
    });
  }

  public getAvailableProviders(): string[] {
    return this.supportedProviders;
  }

  public getDefaultModelForProvider(providerName: string): string {
    const normalizedProviderName = providerName.toLowerCase();
    return this.defaultModels[normalizedProviderName] || "";
  }

  public getAvailableModelsForProvider(providerName: string): string[] {
    const normalizedProviderName = providerName.toLowerCase();

    switch (normalizedProviderName) {
      case "openai":
        return ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"];
      case "meta":
        return [
          "meta-llama/Meta-Llama-3.1-70B-Instruct",
          "meta-llama/Meta-Llama-3.1-405B-Instruct",
          "meta-llama/Meta-Llama-3.1-8B-Instruct",
          "meta-llama/Llama-3-8B-Instruct",
          "meta-llama/Llama-3-70B-Instruct",
        ];
      case "google":
        return ["gemma2-9b-it"];
      case "deepseek":
        return ["deepseek-r1-distill-llama-70b"];
      case "mistral":
        return ["mistral-saba-24b"];
      case "qwen":
        return ["qwen-qwq-32b"];
      case "anthropic":
        return [
          "claude-3-opus-20240229",
          "claude-3-sonnet-20240229",
          "claude-3-haiku-20240307",
        ];
      case "openrouter":
        return [
          // Popular models grouped by provider
          // OpenAI
          "openai/gpt-4o",
          "openai/gpt-4-turbo",
          // Anthropic
          "anthropic/claude-3-opus",
          "anthropic/claude-3-sonnet",
          "anthropic/claude-3-haiku",
          // Meta/Llama
          "meta-llama/meta-llama-3.1-70b-instruct",
          "meta-llama/meta-llama-3.1-8b-instruct",
          // Mistral
          "mistral/mistral-large",
          "mistral/mistral-medium",
          // Google
          "google/gemini-1.5-pro",
          "google/gemini-1.5-flash",
          // Other notable models
          "perplexity/sonar-small-online",
          "01-ai/yi-large",
          "cohere/command-r-plus",
          // Add a special option for custom model input
          "custom-model-input",
        ];
      default:
        return [];
    }
  }
}

export const llmService = new LLMService();
