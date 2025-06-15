import { getUser } from "@/api/service/user-service";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid"; // Make sure you have this installed
import {
  Outlet,
  useFetcher,
  useLoaderData,
  useNavigate,
  useOutletContext,
  useParams,
  type LoaderFunctionArgs,
} from "react-router";
import type { Message } from "ai";

export interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[]; // Store actual messages
  provider: string; // Track which provider was used
  model: string; // Track which model was used
}

export interface User {
  id: string;
  createdAt: Date;
  email: string;
  name: string | null;
  image: string | null;
  isSubscribed: boolean;
  threads:
    | {
        id: string;
        messages: {
          id: string;
          createdAt: Date;
          content: string;
          role: string;
        }[];
        title: string;
      }[]
    | null;
}

export interface LayoutContextType {
  apiKeys: Record<string, string>;
  setApiKeys: (keys: Record<string, string>) => void;
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
  chats: Chat[];
  currentChatId: string | null;
  user: (User & {}) | null;
  handleChatUpdate: (
    messages: Message[],
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

  const user = await getUser(session?.user.id || "");
  if (!user) {
    return {
      user: null,
    };
  }
  return {
    user: user,
  };
}

export default function Layout() {
  const { user } = useLoaderData<typeof loader>();

  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [chats, setChats] = useState<Chat[]>([]);
  const navigate = useNavigate();
  const params = useParams();
  const currentChatId = params.id || null;
  const fetcher = useFetcher();

  // Load data from localStorage when the component mounts - only if user is not logged in
  // For logged-in users, this will be replaced with a database call
  // This is to ensure we have a consistent experience for both logged-in and non-logged-in users
  // Non-premium users will use localStorage, premium users will use a database so that they get synced across devices
  useEffect(() => {
    // Load API keys
    try {
      const savedKeys = localStorage.getItem("api-keys");
      if (savedKeys) {
        const parsedKeys = JSON.parse(savedKeys) as Record<string, string>;
        setApiKeys(parsedKeys);

        // Set default provider
        let provider = "openai"; // Default provider
        if (!parsedKeys["openai"]) {
          const availableProviders = Object.keys(parsedKeys).filter((p) =>
            parsedKeys[p]?.trim()
          );
          if (availableProviders.length > 0) {
            provider = availableProviders[0];
          }
        }
        setSelectedProvider(provider);
      }
    } catch (error) {
      console.error("Failed to load API keys:", error);
    }

    const savedChats = localStorage.getItem("chat-history");

    // Load chat history from localStorage
    // Only load if the user is not logged in
    if (!user) {
      try {
        if (!savedChats) {
          return;
        }

        const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
        }));
        setChats(parsedChats);
        return;
      } catch (error) {
        console.error("Failed to load chat history:", error);
        return;
      }
    }
    // For  users, we load threads from the user object AND from the localstorage if available
    // This is to ensure that if they have chats saved locally, we still show them

    if (!user.threads || user.threads.length === 0) {
      if (!savedChats) {
        return;
      }

      const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
        ...chat,
        timestamp: new Date(chat.timestamp),
      }));
      setChats(parsedChats);
      return;
    }
    // Parse threads from the user object
    const parsedChats = user.threads.map((thread: any) => ({
      id: thread.id,
      title: thread.title,
      timestamp: new Date(thread.messages[0].createdAt),
      messages: thread.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        createdAt: new Date(msg.createdAt),
      })),
      provider: "openai", // Default provider for premium users
      model: "gpt-4", // Default model for premium users
    }));

    // If the user has threads in localStorage, we can merge them with the fetched threads
    const localChats = localStorage.getItem("chat-history");
    let threads: Chat[] = [];
    if (localChats) {
      threads = JSON.parse(localChats).map((chat: any) => ({
        ...chat,
        timestamp: new Date(chat.timestamp),
      }));
    }
    // Combine both threads and local chats, ensuring no duplicates
    const combinedChats = [
      ...threads,
      ...user.threads.map((thread: any) => ({
        id: thread.id,
        title: thread.title,
        timestamp: new Date(thread.messages[0].createdAt),
        messages: thread.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          createdAt: new Date(msg.createdAt),
        })),
        provider: "openai", // Default provider for premium users
        model: "gpt-4", // Default model for premium users
      })),
    ];
    // Remove duplicates based on chat ID
    const uniqueChats = Array.from(
      new Map(combinedChats.map((chat) => [chat.id, chat])).values()
    );
    // Sort by timestamp descending
    uniqueChats.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setChats(uniqueChats);
  }, [user]);

  const handleChatSelect = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };
  const handleNewChat = () => {
    navigate("/"); // Navigate to home without an ID parameter
  };

  // Handle saving a new message to chat history - in localStorage for non-premium users
  // For premium users, this will be replaced with a database call
  const handleChatUpdate = (
    messages: Message[],
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
      if (!user) {
        localStorage.setItem("chat-history", JSON.stringify(updatedChats));
        return;
      }
      // For premium users, we need to update the thread in the database
      fetcher.load("/api/auth/threads"); // Load threads from the API

      const payload = JSON.stringify({
        id: currentChatId,
        title: title,
        messages: messages,
        provider: provider,
        model: model,
        userApiKey: apiKeys[selectedProvider] || "",
      });

      fetcher.submit(payload, {
        method: "post",
        action: "/api/auth/threads",
        encType: "application/json",
      });
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

      if (!user) {
        localStorage.setItem("chat-history", JSON.stringify(updatedChats));
      } else {
        // For premium users, we need to save the new chat to the database
        fetcher.load("/api/auth/threads"); // Load threads from the API

        const payload = JSON.stringify({
          id: newChatId,
          title: newChat.title,
          messages: newChat.messages,
          provider: newChat.provider,
          model: newChat.model,
          userApiKey: apiKeys[selectedProvider] || "",
        });

        fetcher.submit(payload, {
          method: "post",
          action: "/api/auth/threads",
          encType: "application/json",
        });
      }
      localStorage.setItem("chat-history", JSON.stringify(updatedChats));

      // Navigate to the new chat
      navigate(`/chat/${newChatId}`);
    }
  };

  // Create a context object with all the state and functions child routes need
  const context: LayoutContextType = {
    apiKeys,
    setApiKeys,
    selectedProvider,
    setSelectedProvider,
    chats,
    currentChatId,
    user: user,
    handleChatUpdate,
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-black text-white">
        <AppSidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          user={user}
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
