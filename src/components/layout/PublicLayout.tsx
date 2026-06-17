import type { ReactNode } from "react";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";
import { MobileBottomNav } from "./MobileBottomNav";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { PageDecor } from "./PageDecor";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <PageDecor />
      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          {children}
        </main>
        <PublicFooter />
        <MobileBottomNav />
        <InstallAppPrompt />
      </div>
    </div>
  );
}
