"use client";

import { useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import {
  saveChatToIndexedDB,
  loadChatsFromIndexedDB,
  getChatFromIndexedDB,
} from "@/lib/indexeddb";
import type { ChatHistory, Message } from "@/lib/types";
import { ChatInterface } from "@/components/chat-interface";

// Inner component: uses useChat and renders debug/info
function ChatClientInner({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages: Message[];
}) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  console.log(initialMessages, "?>?>?>?1234");
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    setMessages,
    append,
    error,
  } = useChat({
    id: chatId,
    api: "/api/chat",
    initialMessages,
    onError: (error) => {
      console.error("Chat error:", error);
    },
    onFinish: async (message) => {
      if (chatId) {
        const allMessages = [...messages, message];
        await saveChatToIndexedDB(chatId, allMessages);
        await loadChatHistory();
      }
    },
  });

  const loadChatHistory = useCallback(async () => {
    try {
      const chats = await loadChatsFromIndexedDB();
      setChatHistory(chats);
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 && chatId) {
      saveChatToIndexedDB(chatId, messages);
      loadChatHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, chatId]);

  // Debug function to test manual message
  const testManualMessage = () => {
    console.log("Testing manual message...");
    append({
      role: "user",
      content: "Hello, this is a test message from the chat client",
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Debug info - remove in production */}
      <div className="bg-gray-100 p-2 text-xs mb-2">
        <p>
          Messages: {messages.length} | Loading: {status} | Error:{" "}
          {error ? "Yes" : "No"}
        </p>
        <button
          onClick={testManualMessage}
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs mt-1"
        >
          Test Message
        </button>
      </div>
      <ChatInterface
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={status === "streaming"}
        hasInitialQuery={false}
      />
    </div>
  );
}

// Outer component: loads initialMessages from IndexedDB, shows loading spinner
export default function ChatClient({ chatId }: { chatId: string }) {
  const [initialMessages, setInitialMessages] = useState<Message[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const chat = await getChatFromIndexedDB(chatId);
      if (!cancelled) {
        setInitialMessages(chat?.messages ?? []);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  if (loading || initialMessages === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return <ChatClientInner chatId={chatId} initialMessages={initialMessages} />;
}
