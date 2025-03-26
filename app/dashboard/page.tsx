import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Upload, Image, CreditCard } from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import DashboardHeader from "@/components/dashboard-header";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Get user profile with credits information
  const supabase = await createServerSupabaseClient();

  // Get recent headshot jobs
  const { data: recentJobs } = await supabase
    .from("headshot_jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`Welcome, ${user?.full_name || user.name || "User"}`}
        text="Generate professional AI headshots in minutes"
      />

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Credits
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.credits || 0}</div>
            <p className="text-xs text-muted-foreground">
              Credits available for generating headshots
            </p>
            <Link href="/dashboard/billing" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                Buy more credits
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Generated Headshots
            </CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentJobs?.filter((job) => job.status === "completed").length ||
                0}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed headshot generations
            </p>
            <Link href="/dashboard/gallery" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                View Gallery
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentJobs?.filter((job) => job.status === "processing")
                .length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Headshots currently being generated
            </p>
            <Link href="/dashboard/generate" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                Generate New
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/generate">
          <Card className="h-full cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <Upload className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Generate Headshots</CardTitle>
              <CardDescription>
                Upload photos and create professional AI headshots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Transform your selfies into professional headshots with our AI
                technology. Choose from various backgrounds and outfits.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/gallery">
          <Card className="h-full cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <Image className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>View Gallery</CardTitle>
              <CardDescription>
                Browse and download your generated headshots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access all your generated headshots, download them in high
                resolution, and share them with your team or on social media.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/billing">
          <Card className="h-full cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CreditCard className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Manage Credits</CardTitle>
              <CardDescription>
                Purchase credits and view billing history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Buy credits to generate more headshots. View your purchase
                history and manage your subscription.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {recentJobs && recentJobs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Generations</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                href={`/dashboard/headshots/processing/${job.id}`}>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {new Date(job.created_at).toLocaleDateString()}
                    </CardTitle>
                    <CardDescription>
                      Status:{" "}
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square rounded-md bg-muted flex items-center justify-center">
                      {job.status === "completed" &&
                      job.output_image_urls &&
                      job.output_image_urls.length > 0 ? (
                        <img
                          src={job.output_image_urls[0] || "/placeholder.svg"}
                          alt="Headshot preview"
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
