"use client";

import type React from "react";

import { useEffect, useState, Suspense, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useChat } from "ai/react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatInterface } from "@/components/chat-interface";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  saveChatToIndexedDB,
  loadChatsFromIndexedDB,
  getChatFromIndexedDB,
} from "@/lib/indexeddb";
import type { ChatHistory } from "@/lib/types";

function ChatPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const initialQuery = searchParams.get("q") || "";

  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initialQueryProcessed = useRef(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isChatLoading,
    setMessages,
    append,
  } = useChat({
    api: "/api/chat",
    onFinish: async (message) => {
      if (chatId && messages.length > 0) {
        await saveChatToIndexedDB(chatId, [...messages, message]);
        await loadChatHistory();
      }
    },
  });

  const loadChatHistory = async () => {
    const chats = await loadChatsFromIndexedDB();
    setChatHistory(chats);
  };

  // Initialize and load existing chat
  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      await loadChatHistory();

      // Try to load existing chat
      const existingChat = await getChatFromIndexedDB(chatId);
      if (existingChat && existingChat.messages.length > 0) {
        setMessages(existingChat.messages);
        initialQueryProcessed.current = true;
      }

      setIsInitialized(true);
      setIsLoading(false);
    };

    if (chatId) {
      initializeChat();
    }
  }, [chatId, setMessages]);

  // Handle initial query auto-submit and cleanup URL
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (
      initialQuery &&
      !initialQueryProcessed.current &&
      messages.length === 0
    ) {
      initialQueryProcessed.current = true;

      // Auto-submit the initial query
      append({
        role: "user",
        content: initialQuery,
      });

      // Clean up the URL by removing the query parameter
      router.replace(`/chat/${chatId}`, { scroll: false });
    }
  }, [
    initialQuery,
    isInitialized,
    isLoading,
    messages.length,
    append,
    router,
    chatId,
  ]);

  // Save messages to IndexedDB when they change
  useEffect(() => {
    if (messages.length > 0 && chatId && isInitialized && !isLoading) {
      const saveChat = async () => {
        await saveChatToIndexedDB(chatId, messages);
        await loadChatHistory();
      };
      saveChat();
    }
  }, [messages, chatId, isInitialized, isLoading]);

  const startNewChat = () => {
    const newChatId = `chat_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    router.push(`/chat/${newChatId}`);
  };

  const loadChat = (chat: ChatHistory) => {
    router.push(`/chat/${chat.id}`);
  };

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background w-full">
        <div className="w-64 border-r bg-muted/10 animate-pulse"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        <ChatSidebar
          chatHistory={chatHistory}
          currentChatId={chatId}
          onNewChat={startNewChat}
          onLoadChat={loadChat}
        />
        <div className="flex-1">
          <ChatInterface
            messages={messages}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleChatSubmit}
            isLoading={isChatLoading}
            hasInitialQuery={!!initialQuery && !initialQueryProcessed.current}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-background w-full">
          <div className="w-64 border-r bg-muted/10"></div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading MirrorStone...</p>
            </div>
          </div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
