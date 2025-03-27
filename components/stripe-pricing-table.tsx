"use client";

import { useEffect, useRef } from "react";
import type { User } from "@supabase/auth-helpers-nextjs";

type Props = {
  user: User | null;
  className?: string;
};

const StripePricingTable = ({ user, className = "" }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Get environment variables
  const pricingTableId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (!containerRef.current || !pricingTableId || !publishableKey) return;

    // Load the Stripe Pricing Table script
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;
    document.body.appendChild(script);

    // Create the pricing table element programmatically
    const pricingTable = document.createElement("stripe-pricing-table");
    pricingTable.setAttribute("pricing-table-id", pricingTableId);
    pricingTable.setAttribute("publishable-key", publishableKey);

    if (user?.id) {
      pricingTable.setAttribute("client-reference-id", user.id);
    }

    if (user?.email) {
      pricingTable.setAttribute("customer-email", user.email);
    }

    // Clear the container and append the pricing table
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(pricingTable);
    }

    return () => {
      // Clean up the script when component unmounts
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, [pricingTableId, publishableKey, user]);

  // Show error if environment variables are missing
  if (!pricingTableId || !publishableKey) {
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
      {/* The stripe-pricing-table element will be created and appended here via JavaScript */}
      <div className="text-center py-4">Loading pricing table...</div>
    </div>
  );
};

export default StripePricingTable;
