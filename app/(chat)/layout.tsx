import { cookies } from "next/headers";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { DataStreamProvider } from "@/components/chat/data-stream-provider";
import { GlobalErrorListener } from "@/components/chat/global-error-listener";
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
        <div className="pointer-events-none sticky top-0 z-40 flex h-0 justify-start p-3">
          <SidebarTrigger className="pointer-events-auto rounded-full border border-border/50 bg-card/75 shadow-sm backdrop-blur-xl" />
        </div>
        <Toaster
          position="top-center"
          theme="system"
          toastOptions={{
            className:
              "!bg-white/20 !text-foreground !border-white/25 !shadow-[var(--shadow-float)] !backdrop-blur-xl",
          }}
        />
        <GlobalErrorListener />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
