import { cookies } from "next/headers";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { DataStreamProvider } from "@/components/chat/data-stream-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "../(auth)/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DataStreamProvider>
      <Suspense fallback={<div className="flex h-dvh bg-sidebar" />}>
        <SidebarShell>{children}</SidebarShell>
      </Suspense>
    </DataStreamProvider>
  );
}

async function SidebarShell({ children }: { children: React.ReactNode }) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} />
      <SidebarInset className="relative">
        <div className="fixed top-3 left-3 z-[95] flex justify-start">
          <SidebarTrigger className="rounded-full border border-sidebar-border/45 bg-sidebar/90 text-sidebar-foreground shadow-sm backdrop-blur-md hover:bg-sidebar" />
        </div>
        <Toaster
          position="top-right"
          theme="system"
          toastOptions={{
            className:
              "liquid-panel !text-foreground !shadow-[var(--shadow-float)]",
          }}
        />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
