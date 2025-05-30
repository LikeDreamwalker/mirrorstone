"use client";
import { useEffect, useState, useRef } from "react";
import { useChat } from "ai/react";
import {
  saveChatToIndexedDB,
  loadChatsFromIndexedDB,
  getChatFromIndexedDB,
} from "@/lib/indexeddb";
import type { ChatHistory } from "@/lib/types";
import { ChatInterface } from "@/components/chat-interface";

export default function ChatClient({ chatId }: { chatId: string }) {
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
      }

      setIsInitialized(true);
      setIsLoading(false);
    };

    if (chatId) {
      initializeChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, setMessages]);

  // If last message is from user and no agent response, trigger agent (init/retry)
  useEffect(() => {
    if (
      isInitialized &&
      !isLoading &&
      messages.length > 0 &&
      messages[messages.length - 1].role === "user" &&
      (messages.length === 1 ||
        messages[messages.length - 2].role !== "assistant")
    ) {
      if (!initialQueryProcessed.current) {
        initialQueryProcessed.current = true;
        append({
          role: "user",
          content: messages[messages.length - 1].content,
        });
      }
    }
  }, [isInitialized, isLoading, messages, append]);

  // Save messages to IndexedDB when they change
  useEffect(() => {
    if (messages.length > 0 && chatId && isInitialized && !isLoading) {
      const saveChat = async () => {
        await saveChatToIndexedDB(chatId, messages);
        await loadChatHistory();
      };
      saveChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, chatId, isInitialized, isLoading]);

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatInterface
      messages={messages}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleChatSubmit}
      isLoading={isChatLoading}
      hasInitialQuery={false}
    />
  );
}
