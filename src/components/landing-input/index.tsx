"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveChatToIndexedDB } from "@/lib/indexeddb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
        parts: [{ type: "text", text: query.trim() }], // ✅ This is v5 style!
      },
    ]);
    router.push(`/app/${chatId}`);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-12">
      <div className="relative max-w-2xl mx-auto">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search className="h-6 w-6 text-slate-400" />
          </div>
          <Input
            type="text"
            placeholder="What would you like to search for today?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 pr-4 py-6 text-lg rounded-2xl"
            disabled={isNavigating}
          />
        </div>
        <div className="flex w-full justify-end items-center gap-2 mt-2">
          <Button type="button" variant="outline">
            Visit History
          </Button>
          <Button type="submit" disabled={!query.trim() || isNavigating}>
            {isNavigating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Starting Search...
              </>
            ) : (
              "Start Searching"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
