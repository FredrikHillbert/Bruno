import { llmService } from "@/api/service/llm-service";
import { userHasActiveSubscription } from "@/api/service/user-service";
import { prisma } from "@/db.server";
import { auth } from "@/lib/auth";
import type { ActionFunctionArgs } from "react-router";
import { convertToCoreMessages } from "ai"; // No StreamingTextResponse needed here
import type { CoreMessage, StreamTextResult } from "ai"; // Import StreamTextResult

export async function action({ request }: ActionFunctionArgs) {
  const session = await auth.api.getSession(request);
  const userId = session?.user.id;

    // Read custom headers
  const userApiKey = request.headers.get("x-api-key") || undefined;
  const userPlanType = request.headers.get("x-user-plan"); // "free" or "premium"

  const formData = await request.formData();
  const prompt = formData.get("prompt") as string;
  const providerName = (formData.get("providerName") as string) || "openai";
  let threadId = formData.get("threadId") as string | undefined;
  const chatHistoryPayload = formData.get("chatHistory") as string | undefined;

  let simpleChatHistory: CoreMessage[] = []; // Will be converted to CoreMessage
  if (chatHistoryPayload) {
    try {
      // Assuming client sends an array of {role: string, content: string}
      const parsedHistory = JSON.parse(chatHistoryPayload);
      // Ensure it's in CoreMessage format if not already
      simpleChatHistory = convertToCoreMessages(parsedHistory);
    } catch (e) {
      console.error("Failed to parse chat history from formData:", e);
    }
  }

  if (!prompt) {
    return Response.json({ error: "Prompt is required" }, { status: 400 });
  }

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
    let currentThreadIdForSaving = threadId;
    if (userId) {
      if (!currentThreadIdForSaving) {
        const newThread = await prisma.thread.create({
          data: {
            users: { connect: [{ id: userId }] },
            title: prompt.substring(0, 30) || "New Chat",
          },
        });
        currentThreadIdForSaving = newThread.id;
      } else {
        // ... (thread existence and update logic remains the same)
        const threadExists = await prisma.thread.findFirst({
          where: {
            id: currentThreadIdForSaving,
            users: { some: { id: userId } },
          },
        });
        if (!threadExists) {
          return Response.json(
            { error: "Thread not found or access denied." },
            { status: 404 }
          );
        }
        await prisma.thread.update({
          where: { id: currentThreadIdForSaving },
          data: { updatedAt: new Date() },
        });
      }
      await prisma.message.create({
        data: {
          content: prompt,
          role: "user",
          threadId: currentThreadIdForSaving,
          userId: userId,
        },
      });
    }

    const dbSaveOpts =
      userId && currentThreadIdForSaving
        ? { userId, threadId: currentThreadIdForSaving, providerName }
        : undefined;

    const streamTextResultOrError = await llmService.sendMessageToProvider(
      providerName,
      prompt,
      simpleChatHistory,
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

    // Use the toDataStreamResponse method from the result of streamText
    // The onFinish callback for DB saving is now handled within the llmService.
    return streamTextResult.toDataStreamResponse();
  } catch (error: any) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "An unexpected error occurred on the server." },
      { status: 500 }
    );
  }
}
