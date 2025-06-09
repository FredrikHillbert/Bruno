import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
import { Outlet } from "react-router";
import type { UserPlan } from "./home";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const handleNewChat = () => {
    setCurrentChatId(null);
  };
  const userPlan = { type: "free"} as UserPlan
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <AppSidebar
          currentChatId={currentChatId}
          onChatSelect={handleNewChat}
          userPlan={userPlan}
          onNewChat={handleNewChat}
        />

        <SidebarTrigger />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}
