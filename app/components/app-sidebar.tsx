"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Settings, Crown, Key } from "lucide-react"
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
} from "@/components/ui/sidebar"
import type { UserPlan } from "@/routes/home"

interface Chat {
  id: string
  title: string
  timestamp: Date
}

interface AppSidebarProps {
  onNewChat: () => void
  currentChatId: string | null
  onChatSelect: (chatId: string) => void
  userPlan: UserPlan
}

export function AppSidebar({ onNewChat, currentChatId, onChatSelect, userPlan }: AppSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Only load chat history for premium users
    if (userPlan.type === "premium") {
      const savedChats = localStorage.getItem("chat-history")
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
        }))
        setChats(parsedChats)
      }
    }
  }, [userPlan.type])

  const filteredChats = chats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const groupedChats = {
    today: filteredChats.filter((chat) => {
      const today = new Date()
      return chat.timestamp.toDateString() === today.toDateString()
    }),
    yesterday: filteredChats.filter((chat) => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return chat.timestamp.toDateString() === yesterday.toDateString()
    }),
    older: filteredChats.filter((chat) => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return chat.timestamp < yesterday
    }),
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">BRUNO</span>
          </div>
          <div className="flex items-center gap-2">
            {userPlan.type === "premium" ? (
              <Badge variant="default" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Pro
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                <Key className="h-3 w-3 mr-1" />
                BYOK
              </Badge>
            )}
            
          </div>
        </div>

        <div className="p-2">
          <Button onClick={onNewChat} className="w-full bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Search - Only for premium users */}
        {userPlan.type === "premium" && (
          <SidebarGroup className="py-0">
            <SidebarGroupContent className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
              <SidebarInput
                placeholder="Search your threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Chat History - Only for premium users */}
        {userPlan.type === "premium" ? (
          <>
            {groupedChats.today.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Today</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupedChats.today.map((chat) => (
                      <SidebarMenuItem key={chat.id}>
                        <SidebarMenuButton
                          onClick={() => onChatSelect(chat.id)}
                          isActive={currentChatId === chat.id}
                          className="w-full justify-start"
                        >
                          <span className="truncate">{chat.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {groupedChats.yesterday.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Yesterday</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupedChats.yesterday.map((chat) => (
                      <SidebarMenuItem key={chat.id}>
                        <SidebarMenuButton
                          onClick={() => onChatSelect(chat.id)}
                          isActive={currentChatId === chat.id}
                          className="w-full justify-start"
                        >
                          <span className="truncate">{chat.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {groupedChats.older.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Older</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupedChats.older.map((chat) => (
                      <SidebarMenuItem key={chat.id}>
                        <SidebarMenuButton
                          onClick={() => onChatSelect(chat.id)}
                          isActive={currentChatId === chat.id}
                          className="w-full justify-start"
                        >
                          <span className="truncate">{chat.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {filteredChats.length === 0 && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <div className="text-center text-sm text-muted-foreground p-4">
                    {searchQuery ? "No chats found" : "No chat history yet"}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        ) : (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex flex-col items-center justify-center p-4 text-center text-sm text-muted-foreground">
                <Crown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Chat history available</p>
                <p>with Premium plan</p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
