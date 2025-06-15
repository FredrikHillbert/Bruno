"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Settings, Crown, Key, User as UserIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Link } from "react-router";
import type { User } from "@/routes/layout";

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
}

interface AppSidebarProps {
  onNewChat: () => void;
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  user: User | null;
  chats: Chat[];
}

export function AppSidebar({
  onNewChat,
  currentChatId,
  onChatSelect,
  user,
  chats,
}: AppSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedChats = {
    today: filteredChats.filter((chat) => {
      const today = new Date();
      return chat.timestamp.toDateString() === today.toDateString();
    }),
    yesterday: filteredChats.filter((chat) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return chat.timestamp.toDateString() === yesterday.toDateString();
    }),
    older: filteredChats.filter((chat) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return chat.timestamp < yesterday;
    }),
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-black/20 bg-gradient-to-b from-black to-zinc-900">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wide">BRUNO</span>
          </div>
          <div className="flex items-center gap-2">
            {user?.isSubscribed ? (
              <Badge className="text-xs bg-green-500/20 text-green-200 border-green-600/30">
                <Crown className="h-3 w-3 mr-1" />
                Pro
              </Badge>
            ) : (
              <Badge className="text-xs bg-red-900/30 text-red-200 border-red-800/30">
                <Key className="h-3 w-3 mr-1" />
                BYOK
              </Badge>
            )}
          </div>
        </div>

        <div className="p-3">
          <Button
            onClick={onNewChat}
            className="w-full bg-gradient-to-r from-green-800 to-green-700 hover:from-green-700 hover:to-green-600 border-none text-white shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Search - With updated styling */}
        <SidebarGroup className="py-0 px-3 pb-3">
          <SidebarGroupContent className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 select-none text-zinc-400" />
            <SidebarInput
              placeholder="Search your threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-800/50 border-zinc-700 focus-visible:ring-red-800 text-white placeholder:text-zinc-500"
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent className="bg-zinc-900">
        {/* Update group labels and menu items */}
        {groupedChats.today.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-zinc-400 font-medium text-xs px-3 py-2">
              Today
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {groupedChats.today.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      onClick={() => onChatSelect(chat.id)}
                      isActive={currentChatId === chat.id}
                      className={`w-full justify-start text-zinc-300 hover:bg-zinc-800 hover:text-white ${
                        currentChatId === chat.id
                          ? "bg-red-900/30 text-white border-l-2 border-red-700"
                          : ""
                      }`}
                    >
                      <span className="truncate">{chat.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Update empty state */}
        {filteredChats.length === 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="text-center text-sm text-zinc-500 p-6">
                {searchQuery ? "No chats found" : "No chat history yet"}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail className="bg-black border-r border-zinc-800" />
      <SidebarFooter className="bg-zinc-900">
        <SidebarMenu>
          <SidebarMenuItem>
            {!user ? (
              <Link
                to="/sign-up"
                className="block w-full" // Make the link take full width
              >
                <SidebarMenuButton className="w-full bg-gradient-to-r from-red-950 to-red-900 hover:from-red-900 hover:to-red-800 shadow-md">
                  <div className="flex items-center gap-2 text-white">
                    <UserIcon className="h-4 w-4" />
                    <span className="truncate">Sign Up</span>
                  </div>
                </SidebarMenuButton>
              </Link>
            ) : (
              <SidebarMenuButton
                className={`flex w-full h-full flex-col items-start gap-2 mb-5 rounded-lg p-3 transition-all duration-200 ${
                  user.isSubscribed
                    ? "bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 shadow-md"
                    : "bg-gradient-to-r from-red-950 to-red-900 hover:from-red-900 hover:to-red-800 shadow-md"
                }`}
              >
                <Link to="/profile" className="w-full">
                  <div className="flex items-center gap-3 mb-2">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt="User Avatar"
                        className="h-8 w-8 rounded-full ring-2 ring-white/20"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-black/30 flex items-center justify-center text-white">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium text-white truncate">
                        {user.name}
                      </span>
                      <span className="text-xs text-white/70 truncate">
                        {user.email || "Your account"}
                      </span>
                    </div>
                  </div>

                  <div className="flex w-full justify-between items-center">
                    {user.isSubscribed ? (
                      <Badge className="text-xs bg-green-500/20 text-green-200 hover:bg-green-500/30 border-green-600/50">
                        <Crown className="h-3 w-3 mr-1" />
                        Pro Account
                      </Badge>
                    ) : (
                      <Badge className="text-xs bg-white/10 text-white hover:bg-white/20 border-white/20">
                        <Key className="h-3 w-3 mr-1" />
                        Free Account
                      </Badge>
                    )}

                    <div className="text-xs text-white/50 hover:text-white transition-colors flex items-center">
                      Settings
                      <Settings className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
