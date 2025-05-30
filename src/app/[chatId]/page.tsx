import ChatClient from "@/components/chat-client";

export default function ChatPage({ params }: { params: { chatId: string } }) {
  return <ChatClient chatId={params.chatId} />;
}
