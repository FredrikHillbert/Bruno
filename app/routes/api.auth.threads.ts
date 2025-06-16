import { getUser } from "@/api/service/user-service";
import { prisma } from "@/db.server";
import { auth } from "@/lib/auth";

export async function action({ request }: { request: Request }) {
  const session = await auth.api.getSession(request);
  const user = await getUser(session?.user.id || "");

  const payload = await request.json();
  const { id, messages, title, userApiKey, provider, model } = payload || {};

  if (!user) {
    return Response.json(
      { error: "Please log in to add a message to a thread." },
      { status: 401 }
    );
  }

  try {
    // Ensure the thread exists
    const thread = await prisma.thread.findUnique({
      where: { id },
      include: { messages: true },
    });

    // Find the latest user and AI messages in the provided messages array
    let latestUserMessage;
    let latestAIMessage;

    // Scan from the end of the array backward to find the latest messages
    for (let i = messages.length - 1; i >= 0; i--) {
      if (!latestAIMessage && messages[i].role === "assistant") {
        latestAIMessage = messages[i];
      }
      if (!latestUserMessage && messages[i].role === "user") {
        latestUserMessage = messages[i];
      }
      // If we found both, we can stop searching
      if (latestUserMessage && latestAIMessage) break;
    }

    if (!thread) {
      // If the thread doesn't exist, create a new one
      const newThread = await prisma.thread.create({
        data: {
          title: title || "New Thread",
          id: id,
          users: {
            connect: { id: user.id },
          },
        },
      });

      // Add the latest user message if found
      if (latestUserMessage) {
        await prisma.message.create({
          data: {
            content: latestUserMessage.content,
            role: "user",
            threadId: newThread.id,
            userId: user.id,
          },
        });
      }

      // Add the latest AI message if found
      if (latestAIMessage) {
        await prisma.message.create({
          data: {
            content: latestAIMessage.content,
            role: "assistant",
            threadId: newThread.id,
            userId: user.id,
          },
        });
      }

      return Response.json(
        { message: "Thread created with latest messages." },
        { status: 201 }
      );
    }

    // For existing threads, add the latest messages

    // Add the latest user message if found and not already in the thread
    if (latestUserMessage) {
      // Check if this exact message already exists to avoid duplicates
      const userMessageExists = thread.messages.some(
        (msg) =>
          msg.role === "user" && msg.content === latestUserMessage.content
      );

      if (!userMessageExists) {
        await prisma.message.create({
          data: {
            content: latestUserMessage.content,
            role: "user",
            threadId: id,
            userId: user.id,
          },
        });
      }
    }

    // Add the latest AI message if found and not already in the thread
    if (latestAIMessage) {
      // Check if this exact message already exists to avoid duplicates
      const aiMessageExists = thread.messages.some(
        (msg) =>
          msg.role === "assistant" && msg.content === latestAIMessage.content
      );

      if (!aiMessageExists) {
        await prisma.message.create({
          data: {
            content: latestAIMessage.content,
            role: "assistant",
            threadId: id,
            userId: user.id,
          },
        });
      }
    }


    return Response.json(
      { message: "Thread updated with latest messages." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating thread:", error);
    return Response.json(
      { error: `Failed to update thread data. ${error}` },
      { status: 500 }
    );
  }
}
