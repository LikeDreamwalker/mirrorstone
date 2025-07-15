import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat-sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        <ChatSidebar />
        <div className="flex-1">{children}</div>
      </div>
    </SidebarProvider>
  );
}
