import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardShell from "@/components/dashboard-shell";
import DashboardHeader from "@/components/dashboard-header";
import Link from "next/link";
import InvitationsList from "@/components/invitations-list";
import TeamMembersList from "@/components/team-members-list";

export default async function TeamPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Create server supabase client
  const supabase = await createServerSupabaseClient();

  // Check if the user has enough credits to invite team members
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  const hasEnoughCredits = profile?.credits > 1;

  // Get team members (people the user has invited)
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*, member:member_id(id, full_name, email, created_at)")
    .eq("team_lead_id", user.id)
    .order("created_at", { ascending: false });

  // Get pending invitations
  const { data: invitations } = await supabase
    .from("invitations")
    .select("*")
    .eq("team_lead_id", user.id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  // Get team leads (users who have invited the current user)
  const { data: teamLeads } = await supabase
    .from("team_members")
    .select("*, team_lead:team_lead_id(id, full_name, email, created_at)")
    .eq("member_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Team Management"
        text="Invite team members and manage your team">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
      </DashboardHeader>

      <div className="grid gap-6">
        <TeamMembersList
          members={teamMembers?.map((tm) => tm.member) || []}
          currentUserId={user.id}
          hasEnoughCredits={hasEnoughCredits}
        />

        <InvitationsList
          invitations={invitations || []}
          hasEnoughCredits={hasEnoughCredits}
        />

        {teamLeads && teamLeads.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Your Team Leads</h2>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="grid gap-4">
                  {teamLeads.map((tl) => (
                    <div
                      key={tl.id}
                      className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {tl.team_lead.full_name || "Unnamed User"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tl.team_lead.email}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(tl.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
