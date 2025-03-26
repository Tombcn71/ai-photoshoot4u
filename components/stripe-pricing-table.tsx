"use client";

import type { User } from "@supabase/auth-helpers-nextjs";
import { useEffect, useRef } from "react";

type Props = {
  user: User | null;
  className?: string;
};

const StripePricingTable = ({ user, className = "" }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run this effect on the client
    if (typeof window === "undefined") return;

    // Load the Stripe Pricing Table script if it's not already loaded
    if (
      !document.querySelector(
        'script[src="https://js.stripe.com/v3/pricing-table.js"]'
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/pricing-table.js";
      script.async = true;
      document.body.appendChild(script);
    }

    // Function to create and insert the pricing table
    const createPricingTable = () => {
      if (!containerRef.current) return;

      // Check if environment variables are available
      const pricingTableId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID;
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      if (!pricingTableId || !publishableKey) {
        console.error("Missing Stripe environment variables");
        return;
      }

      // Clear the container first
      containerRef.current.innerHTML = "";

      // Create the HTML string for the custom element
      // This avoids TypeScript JSX issues completely
      const html = `
        <stripe-pricing-table
          pricing-table-id="${pricingTableId}"
          publishable-key="${publishableKey}"
          ${user?.id ? `client-reference-id="${user.id}"` : ""}
          ${user?.email ? `customer-email="${user.email}"` : ""}
        ></stripe-pricing-table>
      `;

      // Set the HTML
      containerRef.current.innerHTML = html;
    };

    // Try to create the pricing table immediately
    createPricingTable();

    // Also set up a fallback to try again after the script loads
    const scriptLoadHandler = () => {
      createPricingTable();
    };

    // Add the load event listener
    document.addEventListener(
      "stripe-pricing-table-script-loaded",
      scriptLoadHandler
    );

    // Dispatch a custom event when the script is loaded
    const existingScript = document.querySelector(
      'script[src="https://js.stripe.com/v3/pricing-table.js"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        document.dispatchEvent(new Event("stripe-pricing-table-script-loaded"));
      });
    }

    // Clean up
    return () => {
      document.removeEventListener(
        "stripe-pricing-table-script-loaded",
        scriptLoadHandler
      );
    };
  }, [user]);

  if (
    !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    !process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID
  ) {
    return (
      <div className="p-6 text-center bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Configuration Error</h3>
        <p>
          Missing Stripe environment variables. Please set
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and
          NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID in your environment.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* Loading placeholder */}
      <div className="flex justify-center py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-slate-200 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                <div className="h-2 bg-slate-200 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripePricingTable;
