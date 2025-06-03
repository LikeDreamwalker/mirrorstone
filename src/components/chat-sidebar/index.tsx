"use client";

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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  MessageSquare,
  Home,
  Sparkles,
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
    router.push(`/${newChatId}`);
  };

  const handleLoadChat = (chat: ChatHistory) => {
    router.push(`/${chat.id}`);
  };

  const formatChatTitle = (chat: ChatHistory) => {
    const firstUserMessage = chat.messages.find((m) => m.role === "user");
    return firstUserMessage?.content
      ? firstUserMessage.content.slice(0, 50) +
          (firstUserMessage.content.length > 50 ? "..." : "")
      : "New Chat";
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Filter out chats with no messages
  const validChats = chatHistory.filter(
    (chat) => chat.messages && chat.messages.length > 0
  );

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg">MirrorStone</span>
        </div>
        <Button onClick={handleNewChat} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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

        <SidebarGroup>
          <SidebarGroupLabel>
            Chat History ({validChats.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[400px]">
              <SidebarMenu>
                {validChats.map((chat) => (
                  <SidebarMenuItem
                    key={chat.id}
                    className="flex items-center group transition"
                  >
                    <SidebarMenuButton
                      onClick={() => handleLoadChat(chat)}
                      isActive={currentChatId === chat.id}
                      className="flex-1 flex items-center min-w-0"
                    >
                      <MessageSquare className="size-4 shrink-0 mr-2" />
                      <div className="truncate text-sm font-medium">
                        {formatChatTitle(chat)}
                      </div>
                      <div className="text-xs text-muted-foreground ml-2">
                        {formatDate(chat.timestamp)}
                      </div>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-1"
                          tabIndex={0}
                          aria-label="Chat actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          disabled={deletingChatId === chat.id}
                          className="text-red-600 focus:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span>Delete Chat</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground text-center">
          Powered by DeepSeek V3
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
