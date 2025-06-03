import ChatClient from "@/components/chat-client";

export default async function ChatPage({
  params,
}: {
  params: { chatId: string };
}) {
  const { chatId } = await params;
  return <ChatClient chatId={chatId} />;
}
