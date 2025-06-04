"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChatStatus } from "@/components/chat-status";
import { Send, User, Bot, Copy, Check, Sparkles } from "lucide-react";
import type { Message } from "@/lib/types";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  hasInitialQuery?: boolean;
}

export function ChatInterface({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  status,
  hasInitialQuery,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Track previous messages length and last message role
  const prevMessagesRef = useRef<{ length: number; lastRole: string | null }>({
    length: messages.length,
    lastRole: messages.length > 0 ? messages[messages.length - 1].role : null,
  });

  useEffect(() => {
    const prev = prevMessagesRef.current;
    const lastMsg = messages[messages.length - 1];
    // Only scroll if a new user message is added
    if (messages.length > prev.length && lastMsg && lastMsg.role === "user") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesRef.current = {
      length: messages.length,
      lastRole: lastMsg ? lastMsg.role : null,
    };
  }, [messages]);

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  // Memoized rendering for status
  const statusBlock = (() => {
    if (
      status === "submitted" &&
      messages.length > 0 &&
      messages[messages.length - 1].role === "user"
    ) {
      // Thinking bubble
      return (
        <div className="flex gap-3 justify-start">
          <div className="flex gap-3 max-w-[85%]">
            <div className="shrink-0">
              <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
            </div>
            <Card className="p-4 bg-card border">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">
                  MirrorStone is thinking...
                </span>
              </div>
            </Card>
          </div>
        </div>
      );
    }
    if (status === "error") {
      return (
        <div className="flex gap-3 justify-start">
          <div className="flex gap-3 max-w-[85%]">
            <div className="shrink-0">
              <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
            </div>
            <Card className="p-4 bg-card border">
              <span className="text-sm text-red-600">
                Sorry, something went wrong. Please try again.
              </span>
            </Card>
          </div>
        </div>
      );
    }
    return null;
  })();

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-lg font-semibold">MirrorStone</h1>
          </div>
        </div>
        <ChatStatus />
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 && status === "ready" ? (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                Ready to help you search
              </h3>
              <p className="text-muted-foreground">
                {hasInitialQuery
                  ? "Starting your search..."
                  : "Ask me anything and I'll provide comprehensive answers using DeepSeek V3."}
              </p>
            </div>
          ) : (
            messages.map((message) => {
              // Gather all text parts for copy button
              const textToCopy =
                message.parts
                  ?.filter((part) => part.type === "text")
                  .map((part) => part.text)
                  .join("\n") ?? "";

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div className="shrink-0">
                      {message.role === "user" ? (
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <Card
                      className={`p-4 relative group ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-card border"
                      }`}
                    >
                      {message.role === "user" ? (
                        <div className="whitespace-pre-wrap text-white">
                          {message.parts?.map((part, idx) =>
                            part.type === "text" ? (
                              <span key={idx}>{part.text}</span>
                            ) : null
                          )}
                        </div>
                      ) : (
                        <div className="prose-container">
                          {message.parts?.map((part, idx) => {
                            if (part.type === "text") {
                              return (
                                <MarkdownRenderer
                                  key={idx}
                                  content={part.text}
                                />
                              );
                            }
                            if (part.type === "reasoning") {
                              return (
                                <pre
                                  key={idx}
                                  className="bg-gray-100 p-2 rounded mb-2"
                                >
                                  {part.reasoning}
                                </pre>
                              );
                            }
                            // Add more part types as needed
                            return null;
                          })}
                        </div>
                      )}
                      {message.role === "assistant" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-muted"
                          onClick={() =>
                            copyToClipboard(textToCopy, message.id)
                          }
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </Card>
                  </div>
                </div>
              );
            })
          )}
          {statusBlock}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask MirrorStone anything..."
              className="flex-1"
              disabled={status === "streaming" || status === "submitted"}
            />
            <Button
              type="submit"
              disabled={
                status === "streaming" ||
                status === "submitted" ||
                !input.trim()
              }
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
