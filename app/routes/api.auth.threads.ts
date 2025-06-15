import { getUser } from "@/api/service/user-service";
import { prisma } from "@/db.server";
import { auth } from "@/lib/auth";

export async function action({ request }: { request: Request }) {
  const session = await auth.api.getSession(request);
  const user = await getUser(session?.user.id || "");


  const payload = await request.json();
  const { id, messages, title, userApiKey } = payload || {};

  if (!user) {
    return Response.json(
      { error: "Please log in to add a message to a thread." },
      { status: 401 }
    );
  }
  if (!userApiKey) {
    if (!user) {
      return Response.json(
        { error: "Active subscription required or provide your own API key." },
        { status: 403 }
      );
    }
    return Response.json(
      { error: "Please log in and subscribe, or provide your own API key." },
      { status: 401 }
    );
  }

  // Ensure the thread exists
  const thread = await prisma.thread.findUnique({
    where: { id },
    include: { messages: true },
  });

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

    await prisma.message.create({
      data: {
        content: messages[messages.length - 1].content,
        role: messages[messages.length - 1].role,
        threadId: newThread.id,
        userId: user.id,
      },
    });
    return Response.json(
      { message: "Thread created and message added successfully." },
      { status: 201 }
    );
  }

  // Add the new message to the thread
  await prisma.message.create({
    data: {
      content: messages[messages.length - 1].content,
      role: messages[messages.length - 1].role,
      threadId: id,
      userId: user.id,
    },
  });

  // Update the thread title if provided

  await prisma.thread.update({
    where: { id },
    data: { title },
  });
}
