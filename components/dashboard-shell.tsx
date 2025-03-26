import type React from "react";
import { Separator } from "@/components/ui/separator";
import DashboardNav from "@/components/dashboard-nav";
import UserDropdown from "@/components/user-dropdown";
import { getCurrentUser } from "@/lib/auth";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default async function DashboardShell({
  children,
}: DashboardShellProps) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-xl">AI Headshots</h1>
          </div>
          {user && <UserDropdown user={user} />}
        </div>
      </header>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <div className="h-full py-6 pr-6 lg:py-8">
            <DashboardNav />
          </div>
        </aside>
        <Separator className="md:hidden" />
        <main className="flex w-full flex-col overflow-hidden py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
