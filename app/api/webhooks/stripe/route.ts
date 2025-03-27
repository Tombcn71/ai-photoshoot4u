import type { Database } from "@/types/supabase";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { streamToString } from "@/lib/utils";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("MISSING NEXT_PUBLIC_SUPABASE_URL!");
}

if (!supabaseServiceRoleKey) {
  throw new Error("MISSING SUPABASE_SERVICE_ROLE_KEY!");
}

// Use your existing price IDs and credit mappings
const basicPriceId = process.env.STRIPE_BASIC_PRICE_ID as string;
const standardPriceId = process.env.STRIPE_STANDARD_PRICE_ID as string;
const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID as string;

const creditsPerPriceId: {
  [key: string]: number;
} = {
  [basicPriceId]: 100,
  [standardPriceId]: 500,
  [premiumPriceId]: 1000,
};

// Add a GET handler to the webhook endpoint for testing
export async function GET() {
  try {
    // Check if the webhook endpoint is accessible
    return NextResponse.json({
      status: "Webhook endpoint is accessible",
      timestamp: new Date().toISOString(),
      method: "GET",
      note: "This is just a test response. The actual webhook only processes POST requests from Stripe.",
      stripeSecretKey: process.env.STRIPE_SECRET_KEY ? "Present" : "Missing",
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET
        ? "Present"
        : "Missing",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log("Webhook request received from:", request.url);

  // Next.js 15 requires awaiting headers()
  const headersObj = await headers();
  const sig = headersObj.get("stripe-signature");

  if (!stripeSecretKey) {
    return NextResponse.json(
      {
        message: `Missing stripeSecretKey`,
      },
      { status: 400 }
    );
  }

  // Use type assertion to fix TypeScript error with API version
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-08-16" as any,
    typescript: true,
  });

  if (!sig) {
    return NextResponse.json(
      {
        message: `Missing signature`,
      },
      { status: 400 }
    );
  }

  if (!request.body) {
    return NextResponse.json(
      {
        message: `Missing body`,
      },
      { status: 400 }
    );
  }

  const rawBody = await streamToString(request.body);

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret!);
  } catch (err) {
    const error = err as Error;
    console.log("Error verifying webhook signature: " + error.message);
    return NextResponse.json(
      {
        message: `Webhook Error: ${error?.message}`,
      },
      { status: 400 }
    );
  }

  const supabase = createClient<Database>(
    supabaseUrl as string,
    supabaseServiceRoleKey as string,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const checkoutSessionCompleted = event.data
        .object as Stripe.Checkout.Session;
      const userId = checkoutSessionCompleted.client_reference_id;

      if (!userId) {
        return NextResponse.json(
          {
            message: `Missing client_reference_id`,
          },
          { status: 400 }
        );
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(
        checkoutSessionCompleted.id
      );
      const quantity = lineItems.data[0].quantity || 1;
      const priceId = lineItems.data[0].price!.id;
      const creditsPerUnit = creditsPerPriceId[priceId];
      const totalCreditsPurchased = quantity * creditsPerUnit;

      console.log({ lineItems });
      console.log({ quantity });
      console.log({ priceId });
      console.log({ creditsPerUnit });
      console.log("totalCreditsPurchased: " + totalCreditsPurchased);

      // Try to create the profiles table if it doesn't exist
      try {
        await supabase.rpc("execute_sql", {
          sql: `
            CREATE TABLE IF NOT EXISTS profiles (
              id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
              credits INTEGER DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
        });
      } catch (error) {
        console.log("Error creating profiles table:", error);
        // Continue anyway, we'll try to use the credits table
      }

      // First try to update the credits table
      const { data: existingCredits, error: creditsError } = await supabase
        .from("credits")
        .select("*")
        .eq("user_id", userId)
        .single();

      let creditsUpdated = false;

      if (!creditsError) {
        // Update existing credits
        const newCredits = existingCredits.credits + totalCreditsPurchased;
        const { error: updateError } = await supabase
          .from("credits")
          .update({ credits: newCredits })
          .eq("user_id", userId);

        if (!updateError) {
          creditsUpdated = true;
          console.log(
            `Credits updated in credits table: ${existingCredits.credits} -> ${newCredits}`
          );
        } else {
          console.log("Error updating credits table:", updateError);
        }
      } else if (creditsError.code === "PGRST116") {
        // No existing credits, insert new record
        const { error: insertError } = await supabase
          .from("credits")
          .insert({ user_id: userId, credits: totalCreditsPurchased });

        if (!insertError) {
          creditsUpdated = true;
          console.log(`New credits record created: ${totalCreditsPurchased}`);
        } else {
          console.log("Error inserting into credits table:", insertError);
        }
      } else {
        console.log("Error checking credits table:", creditsError);
      }

      // Also try to update the profiles table
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();

        if (!profileError) {
          // Update existing profile
          const currentCredits = profile.credits || 0;
          const newCredits = currentCredits + totalCreditsPurchased;

          const { error: updateError } = await supabase
            .from("profiles")
            .update({ credits: newCredits })
            .eq("id", userId);

          if (!updateError) {
            console.log(
              `Credits updated in profiles table: ${currentCredits} -> ${newCredits}`
            );
          } else {
            console.log("Error updating profiles table:", updateError);
          }
        } else if (profileError.code === "PGRST116") {
          // No existing profile, insert new record
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({ id: userId, credits: totalCreditsPurchased });

          if (!insertError) {
            console.log(
              `New profile created with ${totalCreditsPurchased} credits`
            );
          } else {
            console.log("Error inserting into profiles table:", insertError);
          }
        } else {
          console.log("Error checking profiles table:", profileError);
        }
      } catch (error) {
        console.log("Error updating profiles table:", error);
      }

      // Record the payment
      try {
        const { error: paymentError } = await supabase.from("payments").insert({
          user_id: userId,
          amount: checkoutSessionCompleted.amount_total
            ? checkoutSessionCompleted.amount_total / 100
            : 0,
          currency: checkoutSessionCompleted.currency || "usd",
          status: "completed",
          stripe_session_id: checkoutSessionCompleted.id,
          credits_purchased: totalCreditsPurchased,
          package_id: priceId,
        });

        if (paymentError) {
          console.log("Error recording payment:", paymentError);
        } else {
          console.log("Payment recorded successfully");
        }
      } catch (error) {
        console.log("Error recording payment:", error);
      }

      return NextResponse.json(
        {
          message: "success",
          creditsUpdated,
        },
        { status: 200 }
      );

    default:
      return NextResponse.json(
        {
          message: `Unhandled event type ${event.type}`,
        },
        { status: 400 }
      );
  }
}
