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

// Map your price IDs to credit amounts
// Replace these with your actual price IDs from Stripe
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

export async function POST(request: Request) {
  console.log("🔔 Webhook received from: ", request.url);
  const headersObj = await headers();
  const sig = headersObj.get("stripe-signature");

  if (!stripeSecretKey) {
    console.error("❌ Missing stripeSecretKey");
    return NextResponse.json(
      {
        message: `Missing stripeSecretKey`,
      },
      { status: 400 }
    );
  }

  // Use type assertion to fix the TypeScript error
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-08-16" as any,
    typescript: true,
  });

  if (!sig) {
    console.error("❌ Missing signature");
    return NextResponse.json(
      {
        message: `Missing signature`,
      },
      { status: 400 }
    );
  }

  if (!request.body) {
    console.error("❌ Missing body");
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
    console.log(`✅ Verified webhook: ${event.type}`);
  } catch (err) {
    const error = err as Error;
    console.error(`❌ Error verifying webhook signature: ${error.message}`);
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
        console.error("❌ Missing client_reference_id");
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

      if (!lineItems.data.length) {
        console.error("❌ No line items found");
        return NextResponse.json(
          {
            message: `No line items found`,
          },
          { status: 400 }
        );
      }

      const quantity = lineItems.data[0].quantity || 1;
      const priceId = lineItems.data[0].price?.id;

      if (!priceId) {
        console.error("❌ No price ID found");
        return NextResponse.json(
          {
            message: `No price ID found`,
          },
          { status: 400 }
        );
      }

      const creditsPerUnit = creditsPerPriceId[priceId];

      if (!creditsPerUnit) {
        console.error(`❌ No credits mapping found for price ID: ${priceId}`);
        return NextResponse.json(
          {
            message: `No credits mapping found for price ID: ${priceId}`,
          },
          { status: 400 }
        );
      }

      const totalCreditsPurchased = quantity * creditsPerUnit;

      console.log({ lineItems: lineItems.data });
      console.log({ quantity });
      console.log({ priceId });
      console.log({ creditsPerUnit });
      console.log("totalCreditsPurchased: " + totalCreditsPurchased);

      try {
        // First try the credits table
        const { data: existingCredits, error: creditsError } = await supabase
          .from("credits")
          .select("*")
          .eq("user_id", userId)
          .single();

        // If user has existing credits, add to it
        if (existingCredits) {
          console.log(`Found existing credits: ${existingCredits.credits}`);
          const newCredits = existingCredits.credits + totalCreditsPurchased;

          const { error: updateError } = await supabase
            .from("credits")
            .update({
              credits: newCredits,
            })
            .eq("user_id", userId);

          if (updateError) {
            console.error(
              `❌ Error updating credits: ${JSON.stringify(updateError)}`
            );
            throw new Error(
              `Error updating credits: ${JSON.stringify(updateError)}`
            );
          }

          console.log(`✅ Credits updated successfully to ${newCredits}`);

          // Record the payment
          try {
            await supabase.from("payments").insert({
              user_id: userId,
              amount: checkoutSessionCompleted.amount_total
                ? checkoutSessionCompleted.amount_total / 100
                : 0,
              currency: checkoutSessionCompleted.currency || "usd",
              status: "completed",
              payment_intent_id:
                typeof checkoutSessionCompleted.payment_intent === "string"
                  ? checkoutSessionCompleted.payment_intent
                  : null,
              stripe_session_id: checkoutSessionCompleted.id,
              credits_purchased: totalCreditsPurchased,
              package_id: "stripe_purchase",
            });
            console.log("✅ Payment recorded successfully");
          } catch (paymentError) {
            console.warn(
              "⚠️ Payment completed but failed to record in database:",
              paymentError
            );
          }

          return NextResponse.json(
            {
              message: "success",
              source: "credits_table",
              userId,
              totalCreditsPurchased,
              newCredits,
            },
            { status: 200 }
          );
        } else {
          // Else create new credits row
          console.log(`No existing credits found, creating new entry`);
          const { error: insertError } = await supabase.from("credits").insert({
            user_id: userId,
            credits: totalCreditsPurchased,
          });

          if (insertError) {
            console.error(
              `❌ Error creating credits: ${JSON.stringify(insertError)}`
            );
            throw new Error(
              `Error creating credits: ${JSON.stringify(insertError)}`
            );
          }

          console.log(
            `✅ Credits created successfully with ${totalCreditsPurchased}`
          );

          // Record the payment
          try {
            await supabase.from("payments").insert({
              user_id: userId,
              amount: checkoutSessionCompleted.amount_total
                ? checkoutSessionCompleted.amount_total / 100
                : 0,
              currency: checkoutSessionCompleted.currency || "usd",
              status: "completed",
              payment_intent_id:
                typeof checkoutSessionCompleted.payment_intent === "string"
                  ? checkoutSessionCompleted.payment_intent
                  : null,
              stripe_session_id: checkoutSessionCompleted.id,
              credits_purchased: totalCreditsPurchased,
              package_id: "stripe_purchase",
            });
            console.log("✅ Payment recorded successfully");
          } catch (paymentError) {
            console.warn(
              "⚠️ Payment completed but failed to record in database:",
              paymentError
            );
          }

          return NextResponse.json(
            {
              message: "success",
              source: "credits_table_new",
              userId,
              totalCreditsPurchased,
            },
            { status: 200 }
          );
        }
      } catch (error) {
        // If credits table fails, try profiles table as fallback
        console.error(
          "❌ Error with credits table, trying profiles table:",
          error
        );

        try {
          // Get current credits from profiles
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", userId)
            .single();

          if (profileError) {
            console.error(`❌ Error fetching profile: ${profileError.message}`);
            throw new Error(`Failed to fetch profile: ${profileError.message}`);
          }

          const currentCredits = profile?.credits || 0;
          const newCredits = currentCredits + totalCreditsPurchased;
          console.log(
            `Current credits: ${currentCredits}, New credits: ${newCredits}`
          );

          // Update the user's credits
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ credits: newCredits })
            .eq("id", userId);

          if (updateError) {
            console.error(
              `❌ Error updating profile credits: ${updateError.message}`
            );
            throw new Error(
              `Failed to update profile credits: ${updateError.message}`
            );
          }

          console.log(`✅ Profile credits updated successfully`);

          // Record the payment
          try {
            await supabase.from("payments").insert({
              user_id: userId,
              amount: checkoutSessionCompleted.amount_total
                ? checkoutSessionCompleted.amount_total / 100
                : 0,
              currency: checkoutSessionCompleted.currency || "usd",
              status: "completed",
              payment_intent_id:
                typeof checkoutSessionCompleted.payment_intent === "string"
                  ? checkoutSessionCompleted.payment_intent
                  : null,
              stripe_session_id: checkoutSessionCompleted.id,
              credits_purchased: totalCreditsPurchased,
              package_id: "stripe_purchase",
            });
            console.log("✅ Payment recorded successfully");
          } catch (paymentError) {
            console.warn(
              "⚠️ Payment completed but failed to record in database:",
              paymentError
            );
          }

          return NextResponse.json(
            {
              message: "success",
              source: "profiles_table",
              userId,
              totalCreditsPurchased,
              previousCredits: currentCredits,
              newCredits,
            },
            { status: 200 }
          );
        } catch (profileError) {
          console.error("❌ All update methods failed:", profileError);
          return NextResponse.json(
            {
              message: `Failed to update credits: ${String(profileError)}`,
            },
            { status: 500 }
          );
        }
      }

    default:
      console.log(`Unhandled event type ${event.type}`);
      return NextResponse.json(
        {
          message: `Unhandled event type ${event.type}`,
        },
        { status: 200 } // Return 200 for unhandled events to avoid Stripe retries
      );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  });
}

// Handle GET requests for testing
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: "Webhook endpoint is active" });
}
