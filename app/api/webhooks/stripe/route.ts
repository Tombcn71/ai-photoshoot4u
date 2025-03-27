import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { streamToString } from "@/lib/utils";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Get environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check required environment variables
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

if (!endpointSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set");
}

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

// Map of product IDs to credit amounts
// This should match your Stripe products
const PRODUCT_CREDITS_MAP: Record<string, number> = {
  // Replace these with your actual product IDs
  prod_basic: 100,
  prod_standard: 500,
  prod_premium: 1000,
};

export async function POST(request: Request) {
  console.log("🔔 Webhook received from: ", request.url);

  // Await the headers function to get the headers object
  const headersObj = await headers();
  const sig = headersObj.get("stripe-signature");

  if (!sig) {
    console.error("❌ Missing signature");
    return NextResponse.json({ message: `Missing signature` }, { status: 400 });
  }

  if (!request.body) {
    console.error("❌ Missing body");
    return NextResponse.json({ message: `Missing body` }, { status: 400 });
  }

  const rawBody = await streamToString(request.body);

  let event;
  // Use type assertion to tell TypeScript that stripeSecretKey is definitely a string
  const stripe = new Stripe(stripeSecretKey as string, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });

  try {
    // Use type assertion for endpointSecret
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      endpointSecret as string
    );
    console.log(`✅ Webhook verified: ${event.type}`);
  } catch (err) {
    const error = err as Error;
    console.error("❌ Error verifying webhook signature: " + error.message);
    return NextResponse.json(
      { message: `Webhook Error: ${error?.message}` },
      { status: 400 }
    );
  }

  // Create a Supabase client with the service role key for admin access
  // Use type assertions for supabaseUrl and supabaseServiceRoleKey
  const supabase = createClient(
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
    case "checkout.session.completed": {
      console.log("💰 Processing completed checkout session");
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Session ID: ${session.id}`);

      // Get the user ID from client_reference_id
      const userId = session.client_reference_id;

      if (!userId) {
        console.error("❌ No client_reference_id found in session");
        return NextResponse.json(
          { message: `Missing client_reference_id` },
          { status: 400 }
        );
      }
      console.log(`User ID: ${userId}`);

      // Get the line items to determine what was purchased
      console.log("📦 Fetching line items");
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id
      );
      console.log(`Found ${lineItems.data.length} line items`);

      if (!lineItems.data.length) {
        console.error("❌ No line items found in session");
        return NextResponse.json(
          { message: `No line items found in session` },
          { status: 400 }
        );
      }

      // Calculate total credits from all line items
      let totalCredits = 0;

      for (const item of lineItems.data) {
        if (!item.price?.product) continue;

        // Get the product ID
        const productId =
          typeof item.price.product === "string"
            ? item.price.product
            : item.price.product.id;

        console.log(`Product ID: ${productId}`);

        // Get the product details
        console.log("🔍 Fetching product details");
        const product =
          typeof item.price.product === "string"
            ? await stripe.products.retrieve(item.price.product)
            : item.price.product;

        // Determine credits from product metadata or fallback to map
        let credits = 0;
        const quantity = item.quantity || 1;

        // Check for credits in metadata
        if (
          "metadata" in product &&
          product.metadata &&
          "credits" in product.metadata
        ) {
          credits =
            Number.parseInt(product.metadata.credits as string, 10) * quantity;
          console.log(`Credits from metadata: ${credits}`);
        } else if (PRODUCT_CREDITS_MAP[productId]) {
          credits = PRODUCT_CREDITS_MAP[productId] * quantity;
          console.log(`Credits from map: ${credits}`);
        } else {
          console.warn(`⚠️ No credits found for product ${productId}`);
        }

        if (credits > 0) {
          totalCredits += credits;
          console.log(`Added ${credits} credits for product ${productId}`);
        }
      }

      if (totalCredits === 0) {
        console.error("❌ No credits found in purchased products");
        return NextResponse.json(
          { message: `No credits found in purchased products` },
          { status: 400 }
        );
      }

      console.log(`Total credits to add: ${totalCredits}`);

      // First, try to update the profiles table (our current approach)
      try {
        console.log("💳 Updating credits in profiles table");

        // Get current credits
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();

        if (profileError) {
          console.error(`❌ Error fetching profile: ${profileError.message}`);
          // Don't return error here, we'll try the credits table next
        } else {
          const currentCredits = profile?.credits || 0;
          const newCredits = currentCredits + totalCredits;
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
            // Don't return error here, we'll try the credits table next
          } else {
            console.log(`✅ Profile credits updated successfully`);

            // Record the payment in the database
            try {
              const { error: paymentError } = await supabase
                .from("payments")
                .insert({
                  user_id: userId,
                  amount: session.amount_total ? session.amount_total / 100 : 0,
                  currency: session.currency || "usd",
                  status: "completed",
                  payment_intent_id:
                    typeof session.payment_intent === "string"
                      ? session.payment_intent
                      : null,
                  stripe_session_id: session.id,
                  credits_purchased: totalCredits,
                  package_id: "stripe_purchase",
                });

              if (paymentError) {
                console.error(
                  `❌ Error recording payment: ${paymentError.message}`
                );
              } else {
                console.log(`✅ Payment recorded successfully`);
              }
            } catch (error) {
              console.error(`❌ Error recording payment: ${error}`);
            }

            return NextResponse.json({ message: "success" }, { status: 200 });
          }
        }
      } catch (error) {
        console.error(`❌ Error updating profile credits: ${error}`);
      }

      // If updating profiles table failed, try the credits table (like in your other project)
      try {
        console.log("💳 Trying to update credits in credits table");

        // Check if user has existing credits
        const { data: existingCredits, error: creditsError } = await supabase
          .from("credits")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (creditsError && creditsError.code !== "PGRST116") {
          console.error(
            `❌ Error checking existing credits: ${creditsError.message}`
          );
          return NextResponse.json(
            {
              message: `Error checking existing credits: ${creditsError.message}`,
            },
            { status: 500 }
          );
        }

        // If user has existing credits, add to it
        if (existingCredits) {
          console.log(`Found existing credits: ${existingCredits.credits}`);
          const newCredits = existingCredits.credits + totalCredits;

          const { error: updateError } = await supabase
            .from("credits")
            .update({ credits: newCredits })
            .eq("user_id", userId);

          if (updateError) {
            console.error(`❌ Error updating credits: ${updateError.message}`);
            return NextResponse.json(
              { message: `Error updating credits: ${updateError.message}` },
              { status: 500 }
            );
          }

          console.log(`✅ Credits updated successfully to ${newCredits}`);
        } else {
          // Else create new credits row
          console.log(`No existing credits found, creating new entry`);
          const { error: insertError } = await supabase.from("credits").insert({
            user_id: userId,
            credits: totalCredits,
          });

          if (insertError) {
            console.error(`❌ Error creating credits: ${insertError.message}`);
            return NextResponse.json(
              { message: `Error creating credits: ${insertError.message}` },
              { status: 500 }
            );
          }

          console.log(`✅ Credits created successfully with ${totalCredits}`);
        }

        // Record the payment in the database
        try {
          const { error: paymentError } = await supabase
            .from("payments")
            .insert({
              user_id: userId,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              currency: session.currency || "usd",
              status: "completed",
              payment_intent_id:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : null,
              stripe_session_id: session.id,
              credits_purchased: totalCredits,
              package_id: "stripe_purchase",
            });

          if (paymentError) {
            console.error(
              `❌ Error recording payment: ${paymentError.message}`
            );
          } else {
            console.log(`✅ Payment recorded successfully`);
          }
        } catch (error) {
          console.error(`❌ Error recording payment: ${error}`);
        }

        return NextResponse.json({ message: "success" }, { status: 200 });
      } catch (error) {
        console.error(`❌ Error updating credits: ${error}`);
        return NextResponse.json(
          { message: `Error updating credits: ${error}` },
          { status: 500 }
        );
      }
    }

    default:
      console.log(`⏩ Ignoring event: ${event.type}`);
      return NextResponse.json(
        { message: `Unhandled event type ${event.type}` },
        { status: 200 }
      );
  }
}

// Add GET method to handle Stripe webhook verification
export async function GET() {
  return NextResponse.json({ status: "Stripe webhook endpoint is active" });
}
