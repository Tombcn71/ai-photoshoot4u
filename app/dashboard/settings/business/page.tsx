import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import DashboardHeader from "@/components/dashboard-header";
import DashboardShell from "@/components/dashboard-shell";

export const metadata: Metadata = {
  title: "Business Account - AI Headshots",
  description: "Upgrade to a business account to manage team headshots",
};

export default function BusinessAccountPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Business Account"
        text="Upgrade to a business account to manage team headshots">
        <Link href="/dashboard/settings">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </DashboardHeader>

      <div className="grid gap-8"></div>
    </DashboardShell>
  );
}
