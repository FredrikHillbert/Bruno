import { useState } from "react";
import { ChatArea } from "@/components/chat-area";
import { ApiKeyModal } from "@/components/api-key-modal";
import { SubscriptionModal } from "@/components/subscription-modal";
import { useLayoutContext, type Chat } from "./layout";
import { providerModels } from "@/models";

export default function Home() {
  const {
    apiKeys,
    setApiKeys,
    selectedProvider,
    setSelectedProvider,
    chats,
    currentChatId,
    user,
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

  // Determine the initial model based on the current chat or provider
  const getInitialModel = () => {
    // If we have a current chat with a model, use that
    if (currentChat?.model) {
      return currentChat.model;
    }

    // Otherwise, use the first available model for the selected provider
    const models =
      providerModels[selectedProvider as keyof typeof providerModels] || [];
    return models.length > 0 ? models[0].id : undefined;
  };

  const initialModel = getInitialModel();

  const handleSubscription = () => {
    setShowSubscriptionModal(false);
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <ChatArea
        apiKeys={apiKeys}
        user={user}
        onOpenApiKeyModal={() => setShowApiKeyModal(true)}
        onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
        chatId={currentChatId}
        initialMessages={currentChat?.messages || []}
        onChatUpdate={handleChatUpdate}
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
        selectedModel={initialModel}
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
