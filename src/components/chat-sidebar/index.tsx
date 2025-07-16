"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarFooter,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  Plus,
  MessageSquare,
  Home,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import type { ChatHistory } from "@/lib/types";
import {
  deleteChatFromIndexedDB,
  cleanupDuplicateChats,
  loadChatsFromIndexedDB,
} from "@/lib/indexeddb";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";

export function ChatSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentChatId = Array.isArray(params.chatId)
    ? params.chatId[0]
    : params.chatId || "";

  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  // Load chat history and clean up duplicates on mount
  useEffect(() => {
    const load = async () => {
      await cleanupDuplicateChats();
      const chats = await loadChatsFromIndexedDB();
      setChatHistory(chats);
    };
    load();
  }, []);

  // Reload chat history after deletion
  const reloadChats = async () => {
    const chats = await loadChatsFromIndexedDB();
    setChatHistory(chats);
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingChatId(chatId);
    await deleteChatFromIndexedDB(chatId);
    await reloadChats();
    setDeletingChatId(null);
    // If we're deleting the current chat, redirect to new chat
    if (chatId === currentChatId) {
      handleNewChat();
    }
  };

  const handleNewChat = () => {
    const newChatId = `chat_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    router.push(`/app/${newChatId}`);
  };

  const handleLoadChat = (chat: ChatHistory) => {
    router.push(`/app/${chat.id}`);
  };

  const formatChatTitle = (chat: ChatHistory) => {
    const firstUserMessage = chat.messages.find((m) => m.role === "user");
    const userText =
      firstUserMessage?.parts?.find((part) => part.type === "text")?.text ?? "";
    return userText || "New Chat";
  };

  // Filter out chats with no messages
  const validChats = chatHistory.filter(
    (chat) => chat.messages && chat.messages.length > 0
  );

  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      {/* Header with title and new chat button */}
      <SidebarHeader>
        <h1 className="font-bold text-lg">MirrorStone</h1>
        <Button
          className="w-full mt-2"
          variant="outline"
          onClick={handleNewChat}
        >
          <Plus />
          <span>New Chat</span>
        </Button>
      </SidebarHeader>

      {/* Main content area - constrained height with internal scrolling */}
      <SidebarContent className="flex flex-col overflow-hidden">
        {/* Home navigation - fixed height */}
        <SidebarGroup className="flex-shrink-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Chat History - takes remaining space and scrolls internally */}
        <SidebarGroup className="flex-1 flex flex-col min-h-0">
          <SidebarGroupLabel className="flex-shrink-0 font-thin">
            History ({validChats.length})
          </SidebarGroupLabel>
          <SidebarGroupContent className="flex-1 min-h-0">
            <div className="h-full overflow-y-auto bg-background rounded-lg shadow-sm p-2">
              <SidebarMenu>
                {validChats.map((chat) => {
                  const title = formatChatTitle(chat);

                  return (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={currentChatId === chat.id}
                        onClick={(e) => {
                          e.preventDefault();
                          handleLoadChat(chat);
                        }}
                      >
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4" />
                          <span>{title}</span>
                        </div>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction showOnHover>
                            <MoreHorizontal />
                            <span className="sr-only">More</span>
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-56 rounded-lg"
                          side="right"
                          align="start"
                        >
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteChat(chat.id, e)}
                            disabled={deletingChatId === chat.id}
                            className="text-red-600 focus:text-red-700 dark:text-red-400 dark:focus:text-red-300"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span>Delete Chat</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <div className="text-xs font-thin text-muted-foreground pl-2">
          Built By
        </div>
        <Link href="https://ldwid.com">
          <Button asChild className="w-full" variant="outline">
            <Logo className="text-[#0066FF]" />
          </Button>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
