import type { ChatHistory, Message } from "./types";

const DB_NAME = "MirrorStoneDB";
const DB_VERSION = 1;
const STORE_NAME = "chats";

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

export async function saveChatToIndexedDB(
  chatId: string,
  messages: Message[]
): Promise<void> {
  try {
    // Don't save empty chats
    if (!messages || messages.length === 0) {
      return;
    }

    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const chatData: ChatHistory = {
      id: chatId,
      messages,
      timestamp: Date.now(),
    };

    await store.put(chatData);
  } catch (error) {
    console.error("Error saving chat to IndexedDB:", error);
  }
}

export async function loadChatsFromIndexedDB(): Promise<ChatHistory[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("timestamp");

    return new Promise((resolve, reject) => {
      const request = index.getAll();
      request.onsuccess = () => {
        const chats = request.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(chats);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error loading chats from IndexedDB:", error);
    return [];
  }
}

export async function deleteChatFromIndexedDB(chatId: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await store.delete(chatId);
  } catch (error) {
    console.error("Error deleting chat from IndexedDB:", error);
  }
}

export async function getChatFromIndexedDB(
  chatId: string
): Promise<ChatHistory | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(chatId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error getting chat from IndexedDB:", error);
    return null;
  }
}

export async function cleanupDuplicateChats(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const allChats = await new Promise<ChatHistory[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Group chats by first user message text and timestamp (within 1 minute)
    const duplicateGroups = new Map<string, ChatHistory[]>();

    allChats.forEach((chat) => {
      if (chat.messages.length > 0) {
        const firstUserMsg = chat.messages.find((m) => m.role === "user");
        const firstMessageText =
          firstUserMsg?.parts?.find((part) => part.type === "text")?.text || "";
        const timeKey = Math.floor(chat.timestamp / 60000); // Group by minute
        const key = `${firstMessageText}_${timeKey}`;

        if (!duplicateGroups.has(key)) {
          duplicateGroups.set(key, []);
        }
        duplicateGroups.get(key)!.push(chat);
      }
    });

    // Remove duplicates, keeping the one with most messages
    for (const [, chats] of duplicateGroups) {
      if (chats.length > 1) {
        // Sort by message count (descending) and timestamp (descending)
        chats.sort((a, b) => {
          if (a.messages.length !== b.messages.length) {
            return b.messages.length - a.messages.length;
          }
          return b.timestamp - a.timestamp;
        });

        // Keep the first one, delete the rest
        for (let i = 1; i < chats.length; i++) {
          await store.delete(chats[i].id);
        }
      }
    }
  } catch (error) {
    console.error("Error cleaning up duplicate chats:", error);
  }
}
