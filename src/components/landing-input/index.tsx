"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveChatToIndexedDB } from "@/lib/indexeddb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";

export default function LandingInput() {
  const [query, setQuery] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isNavigating) return;

    setIsNavigating(true);
    const chatId = `chat_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const messageId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    await saveChatToIndexedDB(chatId, [
      {
        id: messageId,
        role: "user",
        parts: [{ type: "text", text: query.trim() }],
      },
    ]);

    router.push(`/app/${chatId}`);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 sm:mb-12">
      <div className="relative">
        <div className="relative w-full mb-4">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none">
            <Search className="size-5 sm:size-6 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Start with a question"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 sm:pl-12 pr-4 py-6 text-base sm:text-lg rounded-xl sm:rounded-2xl w-full"
            disabled={isNavigating}
          />
        </div>

        <div className="flex flex-col sm:flex-row w-full justify-center sm:justify-end items-stretch sm:items-center gap-3 sm:gap-2">
          <Link href="/app" className="w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto px-4 sm:px-6"
            >
              Visit History
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!query.trim() || isNavigating}
            className="w-full sm:w-auto px-4 sm:px-6 bg-primary-blue"
          >
            {isNavigating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="hidden sm:inline">Starting Search...</span>
                <span className="sm:hidden">Starting...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Start Searching</span>
                <span className="sm:hidden">Search</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
