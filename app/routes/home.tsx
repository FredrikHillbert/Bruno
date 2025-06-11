import { useState, useEffect } from "react";
import { ChatArea } from "@/components/chat-area";
import { ApiKeyModal } from "@/components/api-key-modal";
import { SubscriptionModal } from "@/components/subscription-modal";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  useLoaderData,
  useNavigate,
  useOutletContext,
  type LoaderFunctionArgs,
} from "react-router";
import { auth } from "@/lib/auth";
import { userHasActiveSubscription } from "@/api/service/user-service";
import { useLayoutContext, type Chat } from "./layout";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession(request);
  const userHaveActiveSubscription = session?.user.id
    ? await userHasActiveSubscription(session.user.id)
    : false;

  return {
    isUserPremium: userHaveActiveSubscription,
  };
}

export default function Home() {
  const {
    apiKeys,
    setApiKeys,
    selectedProvider,
    setSelectedProvider,
    chats,
    currentChatId,
    isUserPremium,
    handleChatUpdate,
  } = useLayoutContext();

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  // Find the current chat if we have an ID
  const currentChat = currentChatId
    ? chats.find((chat) => chat.id === currentChatId)
    : null;
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
    <div className="flex h-screen bg-background">
      <ChatArea
        apiKeys={apiKeys}
        isUserPremium={isUserPremium}
        onOpenApiKeyModal={() => setShowApiKeyModal(true)}
        onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
        chatId={currentChatId}
        initialMessages={currentChat?.messages || []}
        onChatUpdate={handleChatUpdate}
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
        selectedModel={currentChat?.model}
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
