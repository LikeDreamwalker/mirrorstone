"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
} from "@/lib/indexeddb";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ChatSidebarProps {
  chatHistory: ChatHistory[];
  currentChatId: string;
  onNewChat: () => void;
  onLoadChat: (chat: ChatHistory) => void;
}

export function ChatSidebar({
  chatHistory,
  currentChatId,
  onNewChat,
  onLoadChat,
}: ChatSidebarProps) {
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  // Clean up duplicates on mount
  useEffect(() => {
    const cleanup = async () => {
      await cleanupDuplicateChats();
    };
    cleanup();
  }, []);

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingChatId(chatId);
    await deleteChatFromIndexedDB(chatId);
    setDeletingChatId(null);
    // Reload the page to refresh chat history
    window.location.reload();
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
        <Button onClick={onNewChat} className="w-full" size="sm">
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
                      onClick={() => onLoadChat(chat)}
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
                        {/* You can add more actions here */}
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
