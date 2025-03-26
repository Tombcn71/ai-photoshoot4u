import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardHeader from "@/components/dashboard-header"
import DashboardShell from "@/components/dashboard-shell"
import UsageReportTable from "@/components/usage-report-table"
import UsageChart from "@/components/usage-chart"

export const metadata: Metadata = {
  title: "Usage Reports - AI Headshots",
  description: "Track credit usage across your team",
}

export default function ReportsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Usage Reports" text="Track credit usage across your team">
        <div className="flex gap-2">
          <Link href="/dashboard/business">
            <Button variant="outline" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <Button size="sm" className="gap-1">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Credit Usage Overview</CardTitle>
              <CardDescription>Total credits used by your team</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <UsageChart />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Usage by Member</CardTitle>
              <CardDescription>Credit usage breakdown by team member</CardDescription>
            </CardHeader>
            <CardContent>
              <UsageReportTable />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

