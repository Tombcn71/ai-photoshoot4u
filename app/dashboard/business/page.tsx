import type { Metadata } from "next"
import Link from "next/link"
import { CreditCard, Mail, Plus, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DashboardHeader from "@/components/dashboard-header"
import DashboardShell from "@/components/dashboard-shell"
import TeamMembersList from "@/components/team-members-list"
import BusinessCreditPurchase from "@/components/business-credit-purchase"
import InvitationsList from "@/components/invitations-list"

export const metadata: Metadata = {
  title: "Business Dashboard - AI Headshots",
  description: "Manage your team and credits",
}

export default function BusinessDashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Business Dashboard" text="Manage your team and credits" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
            <p className="text-xs text-muted-foreground">5 credits used out of 30 purchased</p>
          </CardContent>
          <CardFooter>
            <Link href="#purchase-credits">
              <Button variant="outline" size="sm">
                Buy more credits
              </Button>
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">2 active members + you (admin)</p>
          </CardContent>
          <CardFooter>
            <Link href="#team-management">
              <Button variant="outline" size="sm">
                Manage team
              </Button>
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">2 invitations awaiting response</p>
          </CardContent>
          <CardFooter>
            <Link href="#invitations">
              <Button variant="outline" size="sm">
                View invitations
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="team">Team Management</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-6" id="team-management">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your team members and their credit allocations</CardDescription>
              </div>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Invite Member
              </Button>
            </CardHeader>
            <CardContent>
              <TeamMembersList isBusinessAdmin={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="mt-6" id="purchase-credits">
          <BusinessCreditPurchase />
        </TabsContent>

        <TabsContent value="invitations" className="mt-6" id="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>Track and manage your team invitations</CardDescription>
            </CardHeader>
            <CardContent>
              <InvitationsList />
            </CardContent>
            <CardFooter>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Send New Invitation
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}

