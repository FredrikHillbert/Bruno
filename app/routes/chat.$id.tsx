import { useState } from "react";
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

// Define the loader function to fetch chat data
export async function clientLoader({ params }: LoaderFunctionArgs) {
  const chatId = params.id;

  if (!chatId) {
    return redirect("/");
  }

  // This will be replaced with database fetching for premium users
  // For now, we'll use localStorage
  try {
    const savedChats = localStorage.getItem("chat-history");
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
        ...chat,
        timestamp: new Date(chat.timestamp),
      }));

      const chat = parsedChats.find((c: Chat) => c.id === chatId);

      if (!chat) {
        return redirect("/");
      }

      return { chat };
    }

    return redirect("/");
  } catch (error) {
    console.error("Error loading chat:", error);
    return redirect("/");
  }
}

export default function ChatPage() {
  // Get the chat data from the loader
  const { chat } = useLoaderData<{ chat: Chat }>();

  const {
    apiKeys,
    setApiKeys,
    selectedProvider,
    setSelectedProvider,
    isUserPremium,
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

  return (
    <div className="flex h-full flex-col bg-background">
      <ChatArea
        apiKeys={apiKeys}
        isUserPremium={isUserPremium}
        onOpenApiKeyModal={() => setShowApiKeyModal(true)}
        onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
        chatId={chatId || null}
        initialMessages={chat.messages || []}
        onChatUpdate={handleChatUpdate}
        selectedProvider={chat.provider || selectedProvider}
        onProviderChange={setSelectedProvider}
        selectedModel={chat.model}
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
        isPremium={isUserPremium}
      />
    </div>
  );
}
