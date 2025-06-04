"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import {
  saveChatToIndexedDB,
  loadChatsFromIndexedDB,
  getChatFromIndexedDB,
} from "@/lib/indexeddb";
import type { ChatHistory, Message } from "@/lib/types";
import { ChatInterface } from "@/components/chat-interface";

type ChatInitStatus = "default" | "needInit" | "ready" | "submitting";

export default function ChatClient({ chatId }: { chatId: string }) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [chatInitStatus, setChatInitStatus] =
    useState<ChatInitStatus>("default");

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    status,
    setMessages,
    reload,
  } = useChat({
    onError: (error) => {
      console.error("Chat error:", error);
    },
    onFinish: async (data) => {
      console.log("Chat finished:", data);
      const { message } = data;
      if (chatId) {
        const allMessages = [...messagesRef.current, message];
        await saveChatToIndexedDB(chatId, allMessages);
      }
    },
  });

  const messagesRef = useRef<Message[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
    console.log(messages, "Messages updated");
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (chatInitStatus === "default") {
        const chat = await getChatFromIndexedDB(chatId);
        if (cancelled) return;
        let msgs = chat?.messages ?? [];

        if (
          Array.isArray(msgs) &&
          msgs.length > 0 &&
          msgs[msgs.length - 1]?.role === "user" &&
          status === "ready"
        ) {
          console.log(2222);
          setMessages(msgs);
          setChatInitStatus("needInit");
          // Immediately trigger reload and update status
          setChatInitStatus("submitting");
          await reload();
          setChatInitStatus("ready");
        } else {
          setMessages(msgs);
          setChatInitStatus("ready");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatId, setMessages, chatInitStatus, status, reload]);

  // Optional: Load chat history from IndexedDB
  const loadChatHistory = useCallback(async () => {
    try {
      const chats = await loadChatsFromIndexedDB();
      setChatHistory(chats);
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <ChatInterface
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        status={status}
        hasInitialQuery={false}
      />
    </div>
  );
}
