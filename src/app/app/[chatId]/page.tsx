import ChatClient from "@/components/chat";
import { DotPattern } from "@/components/magicui/dot-pattern";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  return (
    <>
      <ChatClient chatId={chatId} />
      <DotPattern
        // glow={true}
        className="[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
      />
    </>
  );
}
