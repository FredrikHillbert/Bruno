import { useState, useEffect } from "react";
import { ChatArea } from "@/components/chat-area";
import { ApiKeyModal } from "@/components/api-key-modal";
import { SubscriptionModal } from "@/components/subscription-modal";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export interface UserPlan {
  type: "free" | "premium";
  expiresAt?: Date;
}

export default function Home() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan>({ type: "free" });
  const [selectedProvider, setSelectedProvider] = useState<string>("openai");

  useEffect(() => {
    let loadedApiKeys: Record<string, string> = {};
    let loadedUserPlan: UserPlan = { type: "free" };

    // Load saved API keys
    const savedKeysString = localStorage.getItem("api-keys");
    if (savedKeysString) {
      try {
        loadedApiKeys = JSON.parse(savedKeysString);
        setApiKeys(loadedApiKeys);
      } catch (e) {
        console.error("Failed to parse API keys from localStorage:", e);
        localStorage.removeItem("api-keys"); // Clear corrupted data
      }
    }

    // Load user plan
    const savedPlanString = localStorage.getItem("user-plan");
    if (savedPlanString) {
      try {
        const planFromFile = JSON.parse(savedPlanString);
        if (planFromFile.expiresAt) {
          planFromFile.expiresAt = new Date(planFromFile.expiresAt);
        }
        loadedUserPlan = planFromFile;
        setUserPlan(loadedUserPlan);
      } catch (e) {
        console.error("Failed to parse user plan from localStorage:", e);
        localStorage.removeItem("user-plan"); // Clear corrupted data
      }
    }

    // Now check for access method using the loaded values
    const hasValidSubscription =
      loadedUserPlan.type === "premium" &&
      (!loadedUserPlan.expiresAt || loadedUserPlan.expiresAt > new Date());

    // Check if there's a key for the currently selected provider
    const hasApiKeyForSelectedProvider = !!loadedApiKeys[selectedProvider];

    if (!hasValidSubscription && !hasApiKeyForSelectedProvider) {
      // If no subscription and no API key for the current provider,
      // prompt for API key.
      setShowApiKeyModal(true);
    } else if (!hasValidSubscription && hasApiKeyForSelectedProvider) {
      // Has API key, but no subscription (might be relevant for other features or providers)
      // For now, this is fine, user can proceed with BYOK.
    } else if (hasValidSubscription) {
      // User has a subscription, all good.
    }

  }, [selectedProvider]); // Re-run if selectedProvider changes to check key for new provider

  const handleApiKeySave = (provider: string, key: string) => {
    const newKeys = { ...apiKeys, [provider]: key };
    setApiKeys(newKeys);
    localStorage.setItem("api-keys", JSON.stringify(newKeys));
    setShowApiKeyModal(false);
  };

  const handleSubscription = (plan: UserPlan) => {
    setUserPlan(plan);
    localStorage.setItem("user-plan", JSON.stringify(plan));
    setShowSubscriptionModal(false);
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  return (
    <div className="flex h-screen bg-background">
      <ChatArea
        apiKeys={apiKeys}
        userPlan={userPlan}
        onOpenApiKeyModal={() => setShowApiKeyModal(true)}
        onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
        chatId={currentChatId}
        onChatIdChange={setCurrentChatId}
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
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
        currentPlan={userPlan}
      />
    </div>
  );
}
