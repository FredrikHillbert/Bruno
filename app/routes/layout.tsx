import { userHasActiveSubscription } from "@/api/service/user-service";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid"; // Make sure you have this installed

import {
  Outlet,
  useLoaderData,
  useNavigate,
  useOutletContext,
  useParams,
  type LoaderFunctionArgs,
} from "react-router";

export interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  messages: any[]; // Store actual messages
  provider: string; // Track which provider was used
  model: string; // Track which model was used
}

export interface LayoutContextType {
  apiKeys: Record<string, string>;
  setApiKeys: (keys: Record<string, string>) => void;
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
  chats: Chat[];
  currentChatId: string | null;
  isUserPremium: boolean;
  handleChatUpdate: (
    messages: any[],
    title: string,
    provider: string,
    model: string
  ) => void;
}

export function useLayoutContext() {
  return useOutletContext<LayoutContextType>();
}
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession(request);
  const userHaveActiveSubscription = session?.user.id
    ? await userHasActiveSubscription(session.user.id)
    : false;
  return {
    isUserPremium: userHaveActiveSubscription,
  };
}

export default function Layout() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [selectedProvider, setSelectedProvider] = useState<string>("openai");
  const [chats, setChats] = useState<Chat[]>([]);
  const navigate = useNavigate();
  const params = useParams();
  const currentChatId = params.id || null;

  const handleChatSelect = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };
  const handleNewChat = () => {
    navigate("/"); // Navigate to home without an ID parameter
  };
  const { isUserPremium } = useLoaderData<typeof loader>();

  // Handle saving a new message to chat history
  const handleChatUpdate = (
    messages: any[],
    title: string,
    provider: string,
    model: string
  ) => {
    if (messages.length === 0) return;

    // If we have a currentChatId, update that chat
    if (currentChatId) {
      const updatedChats = chats.map((chat) =>
        chat.id === currentChatId
          ? { ...chat, messages, timestamp: new Date(), provider, model }
          : chat
      );

      setChats(updatedChats);
      localStorage.setItem("chat-history", JSON.stringify(updatedChats));
    }
    // Otherwise create a new chat
    else if (messages.length > 0) {
      const newChatId = uuidv4();

      const newChat: Chat = {
        id: newChatId,
        title: title || messages[0].content.substring(0, 30) + "...",
        timestamp: new Date(),
        messages,
        provider,
        model,
      };

      const updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      localStorage.setItem("chat-history", JSON.stringify(updatedChats));

      // Navigate to the new chat
      navigate(`/chat/${newChatId}`);
    }
  };

  useEffect(() => {
    const savedKeys = localStorage.getItem("api-keys");

    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys) as Record<string, string>;

        setApiKeys(parsedKeys);

        // If user has no access with the default provider but has keys for other providers,
        // automatically select the first provider they have a key for
        if (!isUserPremium && !parsedKeys["openai"]) {
          const availableProviders = Object.keys(parsedKeys).filter(
            (provider) => parsedKeys[provider]?.trim()
          );

          if (availableProviders.length > 0) {
            setSelectedProvider(availableProviders[0]);
          }
        }
      } catch (e) {
        console.error("Failed to parse saved API keys:", e);
      }
    }

    // Load chat history from localStorage
    const savedChats = localStorage.getItem("chat-history");
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
        }));
        setChats(parsedChats);
      } catch (e) {
        console.error("Failed to parse chat history:", e);
      }
    }
  }, [isUserPremium]);

  // Create a context object with all the state and functions child routes need
  const context: LayoutContextType = {
    apiKeys,
    setApiKeys,
    selectedProvider,
    setSelectedProvider,
    chats,
    currentChatId,
    isUserPremium,
    handleChatUpdate,
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <AppSidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          isPremium={isUserPremium}
          chats={chats}
        />

        <SidebarTrigger />
        <div className="flex-1 overflow-auto">
          <Outlet context={context} />
        </div>
      </div>
    </SidebarProvider>
  );
}
