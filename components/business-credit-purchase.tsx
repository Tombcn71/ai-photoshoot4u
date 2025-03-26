"use client"

import { useState } from "react"
import { Check, CreditCard, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function BusinessCreditPurchase() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("medium")
  const router = useRouter()
  const { toast } = useToast()

  const plans = [
    {
      id: "small",
      name: "Small Business",
      credits: 20,
      price: 179,
      savings: "10%",
      description: "Perfect for small teams of 3-5 people",
    },
    {
      id: "medium",
      name: "Medium Business",
      credits: 50,
      price: 399,
      savings: "20%",
      description: "Ideal for medium-sized teams of 5-15 people",
      popular: true,
    },
    {
      id: "large",
      name: "Enterprise",
      credits: 100,
      price: 699,
      savings: "30%",
      description: "Best value for larger teams of 15+ people",
    },
  ]

  const handlePurchase = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: selectedPlan }),
      })

      const data = await response.json()

      if (response.ok && data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl
      } else {
        toast({
          title: "Error",
          description: data.message || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error purchasing credits:", error)
      toast({
        title: "Error",
        description: "Failed to initiate checkout. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Credits in Bulk</CardTitle>
        <CardDescription>Buy credits in bulk at discounted rates for your team</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id}>
              <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} className="peer sr-only" />
              <Label
                htmlFor={`plan-${plan.id}`}
                className={`flex flex-col gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary ${
                  plan.popular ? "relative overflow-hidden" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute right-0 top-0 translate-x-[30%] -translate-y-[30%] rotate-45 bg-primary px-10 py-1 text-xs text-primary-foreground">
                    Popular
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold">€{plan.price}</div>
                  <div className="text-sm text-muted-foreground">
                    {plan.credits} credits (Save {plan.savings})
                  </div>
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>{plan.credits} headshot credits</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Team management dashboard</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Credit allocation control</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Usage reporting</span>
                  </li>
                </ul>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button onClick={handlePurchase} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Purchase Credits
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

