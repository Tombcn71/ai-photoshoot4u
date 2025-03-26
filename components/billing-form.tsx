"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Tag } from "lucide-react";
import { CREDIT_PACKAGES } from "@/lib/stripe-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function BillingForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    name: string;
    amountOff?: number;
    percentOff?: number;
  } | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Coupon code required",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingCoupon(true);

    try {
      const response = await fetch(
        `/api/validate-coupon?code=${encodeURIComponent(couponCode.trim())}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid coupon code");
      }

      setAppliedCoupon(data.coupon);
      toast({
        title: "Coupon applied",
        description: `Coupon "${data.coupon.id}" has been applied to your order`,
      });
    } catch (error) {
      console.error("Error validating coupon:", error);
      toast({
        title: "Invalid coupon",
        description:
          error instanceof Error ? error.message : "Failed to apply coupon",
        variant: "destructive",
      });
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

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
          couponId: appliedCoupon?.id, // Pass the coupon ID if one is applied
          successUrl: `${window.location.origin}/dashboard/billing?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`,
        }),
      });

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(data.message || "Failed to create checkout session");
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

  // Calculate discounted price if a coupon is applied
  const getDiscountedPrice = (originalPrice: number) => {
    if (!appliedCoupon) return originalPrice;

    if (appliedCoupon.percentOff) {
      return originalPrice * (1 - appliedCoupon.percentOff / 100);
    }

    if (appliedCoupon.amountOff) {
      return Math.max(0, originalPrice - appliedCoupon.amountOff / 100); // amountOff is in cents
    }

    return originalPrice;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {CREDIT_PACKAGES.map((pkg) => {
          const discountedPrice = getDiscountedPrice(pkg.price);
          const hasDiscount = appliedCoupon && discountedPrice < pkg.price;

          return (
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
                <div className="text-3xl font-bold mb-2">
                  {hasDiscount && (
                    <span className="line-through text-muted-foreground mr-2 text-xl">
                      ${pkg.price}
                    </span>
                  )}
                  ${discountedPrice.toFixed(2)}
                </div>
                <div className="text-muted-foreground text-sm">
                  {pkg.credits} credits
                  {pkg.savePercent && !hasDiscount && (
                    <span className="ml-2 text-green-600">
                      Save {pkg.savePercent}%
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="ml-2 text-green-600">
                      Save{" "}
                      {appliedCoupon.percentOff
                        ? `${appliedCoupon.percentOff}%`
                        : `$${(appliedCoupon.amountOff! / 100).toFixed(2)}`}
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
          );
        })}
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="coupon-code">Coupon Code</Label>
            <div className="flex mt-1">
              <Input
                id="coupon-code"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="rounded-r-none"
                disabled={!!appliedCoupon || isValidatingCoupon}
              />
              <Button
                variant="secondary"
                className="rounded-l-none"
                onClick={handleApplyCoupon}
                disabled={
                  !couponCode.trim() || !!appliedCoupon || isValidatingCoupon
                }>
                {isValidatingCoupon ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Tag className="h-4 w-4 mr-2" />
                )}
                {isValidatingCoupon ? "Validating..." : "Apply"}
              </Button>
            </div>
          </div>
          {appliedCoupon && (
            <div className="flex items-center bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-4 py-2 rounded-md">
              <Check className="h-4 w-4 mr-2" />
              <span>
                Coupon <strong>{appliedCoupon.id}</strong> applied
                {appliedCoupon.percentOff &&
                  ` (${appliedCoupon.percentOff}% off)`}
                {appliedCoupon.amountOff &&
                  ` ($${(appliedCoupon.amountOff / 100).toFixed(2)} off)`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-6 text-xs"
                onClick={() => {
                  setAppliedCoupon(null);
                  setCouponCode("");
                }}>
                Remove
              </Button>
            </div>
          )}
        </div>
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
