import { useEffect, useState } from "react";
import {
  useLoaderData,
  useParams,
  redirect,
  type LoaderFunctionArgs,
} from "react-router";
import { ChatArea } from "@/components/chat-area";
import { ApiKeyModal } from "@/components/api-key-modal";
import { SubscriptionModal } from "@/components/subscription-modal";
import { useLayoutContext } from "./layout";
import type { Chat } from "./layout";
import type { Message } from "ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/db.server";

// Define the loader function to fetch chat data
export async function loader({ params, request }: LoaderFunctionArgs) {
  const chatId = params.id;

  if (!chatId) {
    return redirect("/");
  }

  // Check if user is logged in
  const session = await auth.api.getSession(request);
  const userId = session?.user?.id;

  // If user is logged in, try to fetch chat from database
  if (userId) {
    try {
      const thread = await prisma.thread.findUnique({
        where: {
          id: chatId,
          users: {
            some: {
              id: userId,
            },
          },
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (thread) {
        // Return thread data from the database
        return {
          id: thread.id,
          title: thread.title || "Untitled Chat",
          messages: thread.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg?.createdAt?.toISOString(),
          })),
          isFromDatabase: true,
        };
      }
    } catch (error) {
      console.error("Error fetching thread from database:", error);
    }
  }

  // For non-logged in users or if thread not found, return minimal data
  // The client will fill in from localStorage
  return {
    id: chatId,
    isFromDatabase: false,
  };
}

export default function ChatPage() {
  // Get the chat data from the loader
  const loaderData = useLoaderData<{
    id: string;
    title?: string;
    provider?: string;
    model?: string;
    messages?: any[];
    isFromDatabase: boolean;
  }>();
  const [clientChat, setClientChat] = useState<Chat | null>(null);

  const {
    apiKeys,
    setApiKeys,
    selectedProvider,
    setSelectedProvider,
    user,
    handleChatUpdate,
  } = useLayoutContext();

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const params = useParams();
  const chatId = params.id;

  const handleApiKeySave = (provider: string, key: string) => {
    const newKeys = { ...apiKeys, [provider]: key };
    setApiKeys(newKeys);
    localStorage.setItem("api-keys", JSON.stringify(newKeys));
    setSelectedProvider(provider);
    setShowApiKeyModal(false);
  };

  const handleSubscription = () => {
    setShowSubscriptionModal(false);
  };

  // On client side, load from localStorage if needed
  useEffect(() => {
    // If we already have complete data from the server, use that
    if (loaderData.isFromDatabase && loaderData.messages) {
      const serverChat: Chat = {
        id: loaderData.id,
        title: loaderData.title || "Untitled Chat",
        timestamp: new Date(),
        messages: loaderData.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(msg.createdAt),
        })),
        provider: loaderData.provider || "meta",
        model: loaderData.model || "meta-llama/Meta-Llama-3.1-70B-Instruct",
      };
      setClientChat(serverChat);
      return;
    }

    // Otherwise load from localStorage (for non-logged in or when not found in DB)
    try {
      const savedChats = localStorage.getItem("chat-history");
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
        }));

        const chat = parsedChats.find((c: Chat) => c.id === chatId);

        if (chat) {
          setClientChat(chat);
        } else {
          // Chat not found in localStorage either, redirect
          window.location.href = "/";
        }
      } else {
        // No chats in localStorage, redirect
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error loading chat from localStorage:", error);
      window.location.href = "/";
    }
  }, [loaderData, chatId]);

    // Show loading until we have chat data
  if (!clientChat && !loaderData.isFromDatabase) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-zinc-400">Loading chat...</div>
      </div>
    );
  }

  // Determine which chat data to use
  const chatToUse = loaderData.isFromDatabase ? {
    messages: loaderData.messages?.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: new Date(msg.createdAt),
    })) || [],
    provider: loaderData.provider || selectedProvider,
    model: loaderData.model || "meta-llama/Meta-Llama-3.1-70B-Instruct",
  } : {
    messages: clientChat?.messages || [],
    provider: clientChat?.provider || selectedProvider,
    model: clientChat?.model || "meta-llama/Meta-Llama-3.1-70B-Instruct",
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <ChatArea
        apiKeys={apiKeys}
        user={user}
        onOpenApiKeyModal={() => setShowApiKeyModal(true)}
        onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
        chatId={chatId || null}
        initialMessages={chatToUse.messages || []}
        onChatUpdate={handleChatUpdate}
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
        selectedModel={chatToUse.model}
      />

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleApiKeySave}
        currentKeys={apiKeys}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscribe={handleSubscription}
        user={user}
      />
    </div>
  );
}
