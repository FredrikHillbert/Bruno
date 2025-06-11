import { streamText, type StreamTextResult, type CoreMessage } from "ai";
import { prisma } from "@/db.server";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

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

    console.log(
      "OpenAIProvider.sendMessage called with chatHistory:",
      chatHistory
    );

    try {
      const modelNameToUse = options?.modelName || "gpt-3.5-turbo"; // Default fallback
      console.log(`Using OpenAI model: ${modelNameToUse}`);

      // Create instance with the appropriate API key
      const openai = createOpenAI({
        apiKey: this.apiKey,
        baseURL: "https://api.openai.com/v1",
      });

      // Get the specific model instance
      const model = openai.chat(modelNameToUse);
      console.log("OpenAI model instance:", model);

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
              console.log(
                "Assistant message saved to DB via onFinish (OpenAI)."
              );
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

class MetaProvider implements LLMProvider {
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
      console.log(`Using Meta model: ${modelNameToUse}`);

      // Create instance with the appropriate API key via Groq's API
      const meta = createOpenAI({
        apiKey: this.apiKey,
        baseURL: "https://api.groq.com/openai/v1",
      });

      // Get the specific model instance
      const model = meta.chat(modelNameToUse);
      console.log("Meta model instance:", model);

      const result = await streamText({
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
              console.log("Assistant message saved to DB via onFinish (Meta).");
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

    console.log(
      "AnthropicProvider.sendMessage called with chatHistory:",
      chatHistory
    );

    try {
      const modelNameToUse = options?.modelName || "claude-3-5-haiku-20241022";
      console.log(`Using Anthropic model: ${modelNameToUse}`);

      // Create instance with the appropriate API key
      const anthropic = createAnthropic({
        apiKey: this.apiKey,
      });

      const result = streamText({
        model: anthropic(modelNameToUse),
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
              console.log(
                "Assistant message saved to DB via onFinish (Anthropic)."
              );
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
    anthropic: process.env.ANTHROPIC_API_KEY || "",
  };

  // Supported providers and models
  private readonly supportedProviders = ["openai", "meta", "anthropic"];

  // Default models for each provider if not specified
  private readonly defaultModels: Record<string, string> = {
    openai: "gpt-4o",
    meta: "meta-llama/Meta-Llama-3.1-70B-Instruct",
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
      console.log(
        `Using our ${normalizedProviderName} API key for subscribed user`
      );
    }
    // If not subscribed and no user key, return an error
    else if (!userApiKey && !isAuthenticatedAndSubscribed) {
      return {
        content: "",
        provider: normalizedProviderName,
        error: `API key required for ${normalizedProviderName}. Please provide your own key or subscribe to our service.`,
      };
    }
    // User provided their own key
    else {
      console.log(`Using user-provided ${normalizedProviderName} API key`);
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
        providerInstance = new MetaProvider(effectiveApiKey);
        break;
      case "anthropic":
        providerInstance = new AnthropicProvider(effectiveApiKey);
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

      console.log("dbSaveOptions:", dbSaveOptions);

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
      case "anthropic":
        return [
          "claude-3-opus-20240229",
          "claude-3-sonnet-20240229",
          "claude-3-haiku-20240307",
        ];
      default:
        return [];
    }
  }
}

export const llmService = new LLMService();
