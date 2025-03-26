"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";

type Props = {
  user: User | null;
  className?: string;
};

const StripePricingTable = ({ user, className = "" }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the Stripe Pricing Table script
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;
    document.body.appendChild(script);

    // Wait for script to load before creating the custom element
    script.onload = () => {
      if (
        containerRef.current &&
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
        process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID
      ) {
        // Clear the container first
        containerRef.current.innerHTML = "";

        // Create the custom element programmatically
        const pricingTable = document.createElement("stripe-pricing-table");
        pricingTable.setAttribute(
          "pricing-table-id",
          process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID
        );
        pricingTable.setAttribute(
          "publishable-key",
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        );

        if (user?.id) {
          pricingTable.setAttribute("client-reference-id", user.id);
        }

        if (user?.email) {
          pricingTable.setAttribute("customer-email", user.email);
        }

        // Append to the container
        containerRef.current.appendChild(pricingTable);
      }
    };

    return () => {
      // Clean up the script when component unmounts
      const existingScript = document.querySelector(
        'script[src="https://js.stripe.com/v3/pricing-table.js"]'
      );
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
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
      {/* The stripe-pricing-table element will be inserted here programmatically */}
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
