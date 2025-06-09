import { OpenAI } from "openai";
import {
  streamText,
  convertToCoreMessages,
  type StreamTextResult,
  type CoreMessage,
} from "ai";
import { prisma } from "@/db.server";

interface LLMProvider {
  name: string;
  sendMessage: (
    prompt: string,
    chatHistory?: CoreMessage[],
    options?: {
      llmOptions?: any; // e.g., temperature, max_tokens
      userId?: string;
      threadId?: string;
      providerName?: string; // For saving
      modelName?: string; // Ensure modelName is received here
    }
  ) => Promise<StreamTextResult<any, any> | LLMResponse>; // Update return type
}

interface LLMResponse {
  content: string;
  provider: string;
  error?: string;
}

class OpenAIProvider implements LLMProvider {
  name = "OpenAI";
  private openaiInstance: OpenAI; // Store the initialized OpenAI client

  constructor(apiKey?: string) {
    const keyToUse = apiKey || process.env.OPENAI_API_KEY;
    if (!keyToUse) {
      // This situation should ideally be caught by LLMService before instantiation
      // or the provider should throw an error if a key is absolutely required.
      console.warn("OpenAIProvider: API key is missing. Service might fail.");
      // Depending on strictness, you might throw here or let sendMessage handle it.
    }
    this.openaiInstance = new OpenAI({ apiKey: keyToUse });
  }

  async sendMessage(
    // The 'prompt' can be the last message in chatHistory, or passed separately
    // For simplicity with convertToCoreMessages, ensure the full conversation is in chatHistory
    _prompt_unused: string, // If prompt is always last in chatHistory, this might be redundant
    chatHistory: CoreMessage[] = [],
    options?: {
      llmOptions?: any;
      userId?: string;
      threadId?: string;
      providerName?: string;
      modelName?: string; // Ensure modelName is received here
    }
  ): Promise<StreamTextResult<any, any> | LLMResponse> {
    if (!this.openaiInstance.apiKey) {
      // Check if the client was initialized with a key
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

      // streamText expects a model object from the Vercel AI SDK's OpenAI adapter,
      // or you can directly use the official OpenAI client instance with some configuration.
      // For direct use with official openai client and streamText:
      const result = streamText({
        model: modelNameToUse,
        messages: chatHistory, // convertToCoreMessages might not be needed if chatHistory is already CoreMessage[]
        ...options?.llmOptions, // Pass additional OpenAI options if any
        onFinish: async ({ text }) => {
          // Use 'text' from onFinish for the full completion

          if (options?.userId && options?.threadId && options?.providerName) {
            try {
              await prisma.message.create({
                data: {
                  content: text, // Use 'text' which is the final completed text
                  role: "assistant",
                  provider: options.providerName,
                  threadId: options.threadId,
                  userId: options.userId, // Or null/system user
                },
              });
              console.log("Assistant message saved to DB via onFinish.");
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
      console.error("OpenAI API Error (streamText):", error.message);
      return {
        content: "",
        provider: this.name,
        error: `OpenAI API Error: ${error.message}`,
      };
    }
  }
}

class LLMService {
  private providers: Record<string, LLMProvider> = {}; // Store instances or classes

  constructor() {
    // You might instantiate providers here if they don't need dynamic API keys per call,
    // or handle instantiation within sendMessageToProvider if API keys are dynamic.
    // For now, let's assume instantiation happens in sendMessageToProvider for key flexibility.
  }

  public async sendMessageToProvider(
    providerName: string,
    prompt: string,
    chatHistory: CoreMessage[] = [], // Expecting CoreMessage from the route
    userApiKey?: string,
    isAuthenticatedAndSubscribed: boolean = false,
    dbSaveOptions?: {
      userId?: string;
      threadId?: string;
      providerName?: string;
      modelName?: string;
    }
  ): Promise<StreamTextResult<any, any> | LLMResponse> {
    // Update return type
    // Simplified: Directly use OpenAIProvider for this example.
    // In a multi-provider setup, you'd have a lookup here.
    if (providerName.toLowerCase() !== "openai") {
      return {
        content: "",
        provider: providerName,
        error: `Provider ${providerName} not supported in this example.`,
      };
    }

    let effectiveApiKey: string | undefined = userApiKey;
    if (!userApiKey && isAuthenticatedAndSubscribed) {
      effectiveApiKey = undefined; // OpenAIProvider constructor will use process.env.OPENAI_API_KEY
    } else if (!userApiKey && !isAuthenticatedAndSubscribed) {
      return {
        content: "",
        provider: providerName,
        error: `API key required for ${providerName}. Please provide your own key or log in and subscribe.`,
      };
    }

    const providerInstance = new OpenAIProvider(effectiveApiKey);

    const fullChatHistory: CoreMessage[] = [
      ...chatHistory, // Existing history
      { role: "user", content: prompt }, // Add current prompt
    ];

    return providerInstance.sendMessage(prompt, fullChatHistory, {
      ...dbSaveOptions,
      providerName,
    });
  }

  public getAvailableProviders(): string[] {
    return ["openai"]; // Example
  }
}

export const llmService = new LLMService();
