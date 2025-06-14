import { llmService } from "@/api/service/llm-service";
import { auth } from "@/lib/auth";
import type { ActionFunctionArgs } from "react-router";
import { convertToCoreMessages } from "ai"; // No StreamingTextResponse needed here
import type { CoreMessage, StreamTextResult } from "ai"; // Import StreamTextResult
import { getUser } from "@/api/service/user-service";
import { rateLimitService } from "@/api/service/rate-limit-service";
import { estimateTokenCount } from "@/lib/rate-limits";

export async function action({ request }: ActionFunctionArgs) {
  const session = await auth.api.getSession(request);
  const user = await getUser(session?.user.id || "");

  // Read custom headers
  const userApiKey = request.headers.get("x-api-key") || undefined;

  const payload = await request.json();
  const { id, messages, model, provider } = payload || {};

  // Check if user has access to the requested model
  const hasAccess =
    // Subscribed users can access all models
    user?.isSubscribed ||
    // Users with API keys can access the model
    (userApiKey && userApiKey.length > 0) ||
    // Authenticated users can access Llama models for free
    (user && ["meta", "google", "deepseek", "mistral"].includes(provider));

  if (!hasAccess) {
    return new Response(
      JSON.stringify({
        error: "Access denied. Please subscribe or provide an API key.",
      }),
      { status: 403 }
    );
  }

  // Get the latest user message for rate limiting
  const latestUserMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;
  // Apply rate limits ONLY IF:
  // 1. User is logged in (we have a user ID)
  // 2. AND User is NOT using their own API key
  // 3. AND User is either:
  //    a. Using free models (provider === "meta" and not subscribed)
  //    b. Using premium models with their subscription
  if (
    user &&
    !userApiKey &&
    (["meta", "google", "deepseek", "mistral"].includes(provider) ||
      user.isSubscribed)
  ) {
    const rateLimitCheck = await rateLimitService.checkRateLimit(
      user.id,
      model,
      latestUserMessage?.content || "",
      user.isSubscribed
    );

    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: rateLimitCheck.reason,
          reset: rateLimitCheck.reset,
          cooldownSeconds: rateLimitCheck.cooldownSeconds,
        }),
        { status: 429 }
      );
    }
  }

  const chatHistory = convertToCoreMessages(messages);

  try {
    const dbSaveOpts =
      user?.isSubscribed && id
        ? { userId: user.id, id, modelName: model }
        : { userId: undefined, id: undefined, modelName: model };

    const streamTextResultOrError = await llmService.sendMessageToProvider(
      provider,
      chatHistory,
      userApiKey,
      hasAccess,
      dbSaveOpts // Pass options for DB saving via onFinish
    );

    // Check if it's an LLMResponse error object
    if (
      "error" in streamTextResultOrError &&
      !("textStream" in streamTextResultOrError) &&
      !(streamTextResultOrError instanceof ReadableStream)
    ) {
      console.log("StreamTextResult error:", streamTextResultOrError);
      return Response.json(
        {
          error: (streamTextResultOrError as any).error,
          provider: (streamTextResultOrError as any).provider,
        },
        { status: 400 }
      );
    }

    // Record usage after successful request, but ONLY for users using our service
    // (not their own API keys)
    if (
      user &&
      !userApiKey &&
      (["meta", "google", "deepseek", "mistral"].includes(provider) ||
        user.isSubscribed)
    ) {
      // Estimate token usage for this request
      const estimatedInputTokens = estimateTokenCount(
        latestUserMessage?.content || ""
      );

      // Record the request
      await rateLimitService.recordUsage(user.id, model, estimatedInputTokens);
    }

    // Type assertion after the check
    const streamTextResult = streamTextResultOrError as StreamTextResult<
      any,
      any
    >;
    return streamTextResult.toDataStreamResponse({
      getErrorMessage(error) {
        console.error("Error in streamTextResult:", error);
        return "An error occurred while processing your request.";
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "An unexpected error occurred on the server." },
      { status: 500 }
    );
  }
}
