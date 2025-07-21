import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ThemeButton } from "@/components/theme-button";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ChatSidebar />
      <SidebarInset className="relative overflow-hidden">
        <div className="absolute top-2 left-2 z-20 flex w-full justify-start items-center gap-2">
          <SidebarTrigger />
          <ThemeButton variant="ghost" className="h-7 w-7" />
        </div>

        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
