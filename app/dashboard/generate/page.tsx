import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardShell from "@/components/dashboard-shell";
import DashboardHeader from "@/components/dashboard-header";
import UploadForm from "@/components/upload-form";
import { redirect } from "next/navigation";

export default async function GeneratePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Get user profile with credits information
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Generate Headshots"
        text="Upload a photo and create professional AI headshots">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
      </DashboardHeader>

      <UploadForm />
    </DashboardShell>
  );
}
