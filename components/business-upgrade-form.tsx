"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

export default function BusinessUpgradeForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Get the current user
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to upgrade to a business account.",
          variant: "destructive",
        })
        return
      }

      // Update the user's profile to business_admin role
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role: "business_admin",
          account_type: "business",
        })
        .eq("id", session.user.id)

      if (profileError) throw profileError

      // Create a new business
      const { error: businessError } = await supabase.from("businesses").insert({
        name: businessName,
        admin_id: session.user.id,
      })

      if (businessError) throw businessError

      toast({
        title: "Success",
        description: "Your account has been upgraded to a business account.",
      })

      router.push("/dashboard/business")
      router.refresh()
    } catch (error) {
      console.error("Error upgrading to business account:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upgrade to Business Account</CardTitle>
        <CardDescription>
          Business accounts allow you to purchase credits in bulk and manage headshots for your entire team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-name">Business Name</Label>
            <Input
              id="business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter your business name"
              required
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Benefits of a Business Account:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Purchase credits in bulk at discounted rates</li>
              <li>Invite team members to use your credits</li>
              <li>Manage credit allocation across your team</li>
              <li>Track usage and generate reports</li>
              <li>Centralized billing and administration</li>
            </ul>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          onClick={(e) => handleSubmit(e as any)}
          disabled={isLoading || !businessName}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Upgrade Account"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

