"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Heart, Share, Star, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardHeader from "@/components/dashboard-header"
import DashboardShell from "@/components/dashboard-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface HeadshotJob {
  id: string
  created_at: string
  status: "processing" | "completed" | "failed"
  background: string
  outfit: string
  output_image_urls: string[]
}

export default function GalleryClientPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [jobs, setJobs] = useState<HeadshotJob[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    async function fetchHeadshots() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        // Get all completed headshot jobs
        const { data, error } = await supabase
          .from("headshot_jobs")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })

        if (error) throw error
        setJobs(data || [])

        // Get user's favorite headshots
        const { data: favoritesData, error: favoritesError } = await supabase
          .from("favorite_headshots")
          .select("headshot_url")
          .eq("user_id", session.user.id)

        if (favoritesError) throw favoritesError
        setFavorites(favoritesData?.map((f) => f.headshot_url) || [])
      } catch (error) {
        console.error("Error fetching headshots:", error)
        toast({
          title: "Error",
          description: "Failed to load headshots. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchHeadshots()
  }, [toast])

  const toggleFavorite = async (url: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      if (favorites.includes(url)) {
        // Remove from favorites
        await supabase.from("favorite_headshots").delete().eq("user_id", session.user.id).eq("headshot_url", url)

        setFavorites(favorites.filter((f) => f !== url))
      } else {
        // Add to favorites
        await supabase.from("favorite_headshots").insert({
          user_id: session.user.id,
          headshot_url: url,
        })

        setFavorites([...favorites, url])
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      })
    }
  }

  const downloadHeadshot = (url: string) => {
    // Create a temporary link element
    const link = document.createElement("a")
    link.href = url
    link.download = `headshot-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareHeadshot = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My AI Headshot",
          text: "Check out my professional AI headshot!",
          url: url,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(url)
      toast({
        title: "Link Copied",
        description: "Headshot link copied to clipboard.",
      })
    }
  }

  const renderHeadshotGrid = (headshots: string[]) => {
    if (headshots.length === 0) {
      return (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No headshots found.</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {headshots.map((url, index) => (
          <div key={index} className="group relative aspect-square rounded-md overflow-hidden border">
            <img src={url || "/placeholder.svg"} alt={`Headshot ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30"
                onClick={() => toggleFavorite(url)}
              >
                {favorites.includes(url) ? (
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                ) : (
                  <Heart className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30"
                onClick={() => downloadHeadshot(url)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30"
                onClick={() => shareHeadshot(url)}
              >
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const allHeadshots = jobs.flatMap((job) => job.output_image_urls || [])
  const favoriteHeadshots = allHeadshots.filter((url) => favorites.includes(url))

  return (
    <DashboardShell>
      <DashboardHeader heading="Gallery" text="View and download your AI-generated headshots">
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <Link href="/dashboard/generate">
            <Button size="sm" className="gap-1">
              <Upload className="h-4 w-4" /> Generate New
            </Button>
          </Link>
        </div>
      </DashboardHeader>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground">Loading headshots...</p>
                </div>
              </CardContent>
            </Card>
          ) : allHeadshots.length > 0 ? (
            <div className="space-y-8">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <CardTitle>Headshots from {new Date(job.created_at).toLocaleDateString()}</CardTitle>
                    <CardDescription>
                      {job.background} background with {job.outfit} outfit
                    </CardDescription>
                  </CardHeader>
                  <CardContent>{renderHeadshotGrid(job.output_image_urls || [])}</CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Headshots Yet</CardTitle>
                <CardDescription>
                  You haven't generated any headshots yet. Get started by creating your first set.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Ready to create your professional headshots?</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Upload your photos, select backgrounds and outfits, and let our AI do the rest.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/dashboard/generate" className="w-full">
                  <Button className="w-full">Generate Headshots</Button>
                </Link>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground">Loading headshots...</p>
                </div>
              </CardContent>
            </Card>
          ) : jobs.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Headshots</CardTitle>
                <CardDescription>Your most recently generated headshots</CardDescription>
              </CardHeader>
              <CardContent>{renderHeadshotGrid(jobs[0]?.output_image_urls || [])}</CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Recent Headshots</CardTitle>
                <CardDescription>You haven't generated any headshots recently.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Generate new headshots</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Create a new set of professional headshots.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/dashboard/generate" className="w-full">
                  <Button className="w-full">Generate Headshots</Button>
                </Link>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground">Loading favorites...</p>
                </div>
              </CardContent>
            </Card>
          ) : favoriteHeadshots.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Favorite Headshots</CardTitle>
                <CardDescription>Your favorite headshots</CardDescription>
              </CardHeader>
              <CardContent>{renderHeadshotGrid(favoriteHeadshots)}</CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Favorite Headshots</CardTitle>
                <CardDescription>You haven't marked any headshots as favorites yet.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Star className="h-10 w-10 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Add favorites</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Click the heart icon on any headshot to add it to your favorites.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/dashboard/generate" className="w-full">
                  <Button className="w-full">Generate Headshots</Button>
                </Link>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}

