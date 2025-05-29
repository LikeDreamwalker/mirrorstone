"use client";

import type React from "react";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatInterface } from "@/components/chat-interface";
import { SidebarProvider } from "@/components/ui/sidebar";
import { saveChatToIndexedDB, loadChatsFromIndexedDB } from "@/lib/indexeddb";
import type { ChatHistory } from "@/lib/types";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const chatId = searchParams.get("chatId");

  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  const initialQueryProcessed = useRef(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    append,
  } = useChat({
    api: "/api/chat",
    onFinish: async (message) => {
      if (currentChatId && messages.length > 0) {
        await saveChatToIndexedDB(currentChatId, [...messages, message]);
        await loadChatHistory();
      }
    },
  });

  const loadChatHistory = async () => {
    const chats = await loadChatsFromIndexedDB();
    setChatHistory(chats);
  };

  // Initialize chat history on mount
  useEffect(() => {
    loadChatHistory();
    setIsInitialized(true);
  }, []);

  // Handle initial query or existing chat loading
  useEffect(() => {
    if (!isInitialized) return;

    if (chatId) {
      // Load existing chat
      setCurrentChatId(chatId);
      const existingChat = chatHistory.find((chat) => chat.id === chatId);
      if (existingChat) {
        setMessages(existingChat.messages);
      }
      initialQueryProcessed.current = true;
    } else if (initialQuery && !initialQueryProcessed.current) {
      // Create new chat and auto-submit initial query
      const newChatId = `chat_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      setCurrentChatId(newChatId);
      initialQueryProcessed.current = true;

      // Use append to directly send the message
      append({
        role: "user",
        content: initialQuery,
      });
    }
  }, [initialQuery, chatId, chatHistory, isInitialized, append, setMessages]);

  // Save messages to IndexedDB when they change
  useEffect(() => {
    if (messages.length > 0 && currentChatId && isInitialized) {
      const saveChat = async () => {
        await saveChatToIndexedDB(currentChatId, messages);
        await loadChatHistory();
      };
      saveChat();
    }
  }, [messages, currentChatId, isInitialized]);

  const startNewChat = () => {
    initialQueryProcessed.current = false;
    const newChatId = `chat_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setCurrentChatId(newChatId);
    setMessages([]);
    window.history.pushState({}, "", "/chat");
  };

  const loadChat = (chat: ChatHistory) => {
    initialQueryProcessed.current = true;
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    window.history.pushState({}, "", `/chat?chatId=${chat.id}`);
  };

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!currentChatId) {
      const newChatId = `chat_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      setCurrentChatId(newChatId);
    }
    handleSubmit(e);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        <ChatSidebar
          chatHistory={chatHistory}
          currentChatId={currentChatId}
          onNewChat={startNewChat}
          onLoadChat={loadChat}
        />
        <div className="flex-1">
          <ChatInterface
            messages={messages}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleChatSubmit}
            isLoading={isLoading}
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
