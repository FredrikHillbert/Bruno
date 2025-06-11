import { llmService } from "@/api/service/llm-service";
import { userHasActiveSubscription } from "@/api/service/user-service";
import { auth } from "@/lib/auth";
import type { ActionFunctionArgs } from "react-router";
import { convertToCoreMessages } from "ai"; // No StreamingTextResponse needed here
import type { CoreMessage, StreamTextResult } from "ai"; // Import StreamTextResult

export async function action({ request }: ActionFunctionArgs) {
  const session = await auth.api.getSession(request);
  const userId = session?.user.id;

  // Read custom headers
  const userApiKey = request.headers.get("x-api-key") || undefined;

  const payload = await request.json();
  const { id, messages, model, provider } = payload || {};
  const chatHistory = convertToCoreMessages(messages);

  let isAuthenticatedAndSubscribed = false;
  if (userId) {
    if (!userApiKey) {
      isAuthenticatedAndSubscribed = await userHasActiveSubscription(userId);
      if (!isAuthenticatedAndSubscribed) {
        return Response.json(
          {
            error: "Active subscription required or provide your own API key.",
          },
          { status: 403 }
        );
      }
    }
  } else if (!userApiKey) {
    return Response.json(
      { error: "Please log in and subscribe, or provide your own API key." },
      { status: 401 }
    );
  }

  try {
    const dbSaveOpts =
      userId && id
        ? { userId, id, modelName: model }
        : { userId: undefined, id: undefined, modelName: model };

    const streamTextResultOrError = await llmService.sendMessageToProvider(
      provider,
      chatHistory,
      userApiKey,
      isAuthenticatedAndSubscribed,
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
