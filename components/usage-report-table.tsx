"use client"

import { useEffect, useState } from "react"
import { Loader2, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

export default function UsageReportTable() {
  const [isLoading, setIsLoading] = useState(true)
  const [usageData, setUsageData] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    async function fetchUsageData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) return

        // Get the business
        const { data: business, error: businessError } = await supabase
          .from("businesses")
          .select("id")
          .eq("admin_id", session.user.id)
          .single()

        if (businessError) throw businessError

        // Get credit usage grouped by user
        const { data: usageQuery, error: usageError } = await supabase
          .from("credit_usage")
          .select(`
            user_id,
            amount,
            created_at,
            profiles:user_id (
              full_name,
              email,
              avatar_url
            )
          `)
          .eq("business_id", business.id)
          .order("created_at", { ascending: false })

        if (usageError) throw usageError

        // Process the data to group by user
        const userMap = new Map()

        usageQuery.forEach((usage: any) => {
          const userId = usage.user_id
          const profile = usage.profiles

          if (!userMap.has(userId)) {
            userMap.set(userId, {
              id: userId,
              name: profile.full_name || "Unknown User",
              email: profile.email,
              avatar_url: profile.avatar_url,
              creditsUsed: 0,
              lastUsed: null,
            })
          }

          const user = userMap.get(userId)
          user.creditsUsed += usage.amount

          if (!user.lastUsed || new Date(usage.created_at) > new Date(user.lastUsed)) {
            user.lastUsed = usage.created_at
          }
        })

        setUsageData(Array.from(userMap.values()))
      } catch (error) {
        console.error("Error fetching usage data:", error)
        toast({
          title: "Error",
          description: "Failed to load usage data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsageData()
  }, [toast])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (usageData.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No usage data available yet.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Credits Used</TableHead>
          <TableHead>Last Used</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {usageData.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || ""} alt={user.name} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </TableCell>
            <TableCell>{user.creditsUsed}</TableCell>
            <TableCell>
              {user.lastUsed ? formatDistanceToNow(new Date(user.lastUsed), { addSuffix: true }) : "Never"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

