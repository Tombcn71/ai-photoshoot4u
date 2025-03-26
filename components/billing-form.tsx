"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { CREDIT_PACKAGES } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function BillingForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast({
        title: "Please select a package",
        description: "You need to select a credit package to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const selectedPriceId = CREDIT_PACKAGES.find(
        (pkg) => pkg.id === selectedPackage
      )?.priceId;

      if (!selectedPriceId) {
        throw new Error("Invalid package selected");
      }

      // Create a checkout session
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: selectedPriceId,
          successUrl: `${window.location.origin}/dashboard/billing?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {CREDIT_PACKAGES.map((pkg) => (
          <Card
            key={pkg.id}
            className={`cursor-pointer transition-colors ${
              selectedPackage === pkg.id
                ? "border-primary"
                : "hover:border-muted-foreground/50"
            }`}
            onClick={() => setSelectedPackage(pkg.id)}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                </div>
                {pkg.popular && (
                  <div className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
                    Popular
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">${pkg.price}</div>
              <div className="text-muted-foreground text-sm">
                {pkg.credits} credits
                {pkg.savePercent && (
                  <span className="ml-2 text-green-600">
                    Save {pkg.savePercent}%
                  </span>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant={selectedPackage === pkg.id ? "default" : "outline"}
                className="w-full"
                onClick={() => setSelectedPackage(pkg.id)}>
                {selectedPackage === pkg.id && (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {selectedPackage === pkg.id ? "Selected" : "Select"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Button
        className="w-full md:w-auto md:min-w-[200px]"
        size="lg"
        disabled={!selectedPackage || isLoading}
        onClick={handlePurchase}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Purchase Credits"
        )}
      </Button>
    </div>
  );
}
