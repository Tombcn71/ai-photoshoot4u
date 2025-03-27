import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { streamToString } from "@/lib/utils";
import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Ensure environment variables are defined
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

// Direct mapping of price IDs to credit amounts
const PRICE_TO_CREDITS: Record<string, number> = {
  // Replace these with your actual price IDs from Stripe
  price_1O4KyJ2eZvKYlo2C3Ix0Ym6R: 100, // Basic
  price_1O4KzZ2eZvKYlo2C75ZDwEXG: 500, // Standard
  price_1O4L0i2eZvKYlo2C2Q9j3t9r: 1000, // Premium
};

// Type for credits record
interface CreditsRecord {
  id: number;
  user_id: string;
  credits: number;
  created_at?: string;
  updated_at?: string;
}

// Type for profile record
interface ProfileRecord {
  id: string;
  credits?: number;
  [key: string]: any;
}

// Type for payment record
interface PaymentRecord {
  id?: number;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_intent_id: string | null;
  stripe_session_id: string;
  credits_purchased: number;
  package_id: string;
  created_at?: string;
}

// Helper function to record payment
async function recordPayment(
  supabase: SupabaseClient,
  userId: string,
  session: Stripe.Checkout.Session,
  totalCredits: number
): Promise<void> {
  try {
    const paymentData: PaymentRecord = {
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
    };

    const { error: paymentError } = await supabase
      .from("payments")
      .insert(paymentData);

    if (paymentError) {
      console.warn(
        `⚠️ Payment recorded but failed to log: ${paymentError.message}`
      );
    } else {
      console.log(`✅ Payment recorded successfully`);
    }
  } catch (error) {
    console.error(`❌ Error recording payment:`, error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  console.log("🔔 Webhook received");

  try {
    // Get the Stripe signature from headers
    const headersObj = await headers();
    const signature = headersObj.get("stripe-signature");

    if (!signature) {
      console.error("❌ No Stripe signature found");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // Get the raw body
    if (!request.body) {
      console.error("❌ No request body found");
      return NextResponse.json({ error: "No request body" }, { status: 400 });
    }
    const rawBody = await streamToString(request.body);

    // Verify the webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      const error = err as Error;
      console.error(
        `❌ Webhook signature verification failed: ${error.message}`
      );
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`✅ Verified webhook: ${event.type}`);

    // Initialize Supabase with service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Processing checkout session: ${session.id}`);

      // Get user ID from client_reference_id
      const userId = session.client_reference_id;
      if (!userId) {
        console.error("❌ No user ID in session");
        return NextResponse.json({ error: "No user ID" }, { status: 400 });
      }

      // Get line items to determine credits
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id
      );

      if (!lineItems.data.length) {
        console.error("❌ No line items found");
        return NextResponse.json({ error: "No line items" }, { status: 400 });
      }

      // Calculate total credits
      let totalCredits = 0;

      for (const item of lineItems.data) {
        if (!item.price?.id) continue;

        const priceId = item.price.id;
        const quantity = item.quantity || 1;

        // Get credits from our direct mapping
        if (PRICE_TO_CREDITS[priceId]) {
          const credits = PRICE_TO_CREDITS[priceId] * quantity;
          totalCredits += credits;
          console.log(`Adding ${credits} credits from price ${priceId}`);
        } else {
          // If not in our mapping, try to get from product metadata
          try {
            const price = await stripe.prices.retrieve(priceId, {
              expand: ["product"],
            });

            const product = price.product as Stripe.Product;

            if (product.metadata?.credits) {
              const credits =
                Number.parseInt(product.metadata.credits, 10) * quantity;
              totalCredits += credits;
              console.log(`Adding ${credits} credits from product metadata`);
            } else {
              console.warn(`⚠️ No credits found for price ${priceId}`);
            }
          } catch (err) {
            const error = err as Error;
            console.error(`❌ Error fetching price: ${error.message}`);
          }
        }
      }

      if (totalCredits === 0) {
        console.error("❌ No credits to add");
        return NextResponse.json(
          { error: "No credits to add" },
          { status: 400 }
        );
      }

      console.log(`Total credits to add: ${totalCredits}`);

      // First try to update the credits table
      try {
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
        }

        // If user has existing credits, add to it
        if (existingCredits) {
          const typedCredits = existingCredits as CreditsRecord;
          console.log(`Found existing credits: ${typedCredits.credits}`);
          const newCredits = typedCredits.credits + totalCredits;

          const { error: updateError } = await supabase
            .from("credits")
            .update({ credits: newCredits })
            .eq("user_id", userId);

          if (updateError) {
            console.error(`❌ Error updating credits: ${updateError.message}`);
            // Don't return error here, we'll try the profiles table next
          } else {
            console.log(`✅ Credits updated successfully to ${newCredits}`);

            // Record the payment
            await recordPayment(supabase, userId, session, totalCredits);

            return NextResponse.json({
              success: true,
              source: "credits_table",
              userId,
              totalCredits,
              newCredits,
            });
          }
        } else {
          // Else create new credits row
          console.log(`No existing credits found, creating new entry`);
          const { error: insertError } = await supabase.from("credits").insert({
            user_id: userId,
            credits: totalCredits,
          });

          if (insertError) {
            console.error(`❌ Error creating credits: ${insertError.message}`);
            // Don't return error here, we'll try the profiles table next
          } else {
            console.log(`✅ Credits created successfully with ${totalCredits}`);

            // Record the payment
            await recordPayment(supabase, userId, session, totalCredits);

            return NextResponse.json({
              success: true,
              source: "credits_table",
              userId,
              totalCredits,
            });
          }
        }
      } catch (error) {
        const err = error as Error;
        console.error(`❌ Error updating credits table: ${err.message}`);
      }

      // If credits table update failed, try the profiles table
      try {
        console.log("💳 Trying to update profiles table");

        // Get current credits
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();

        if (profileError) {
          console.error(`❌ Error fetching profile: ${profileError.message}`);
          throw new Error(`Failed to fetch profile: ${profileError.message}`);
        }

        const typedProfile = profile as ProfileRecord;
        const currentCredits = typedProfile?.credits || 0;
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
          throw new Error(
            `Failed to update profile credits: ${updateError.message}`
          );
        }

        console.log(`✅ Profile credits updated successfully`);

        // Record the payment
        await recordPayment(supabase, userId, session, totalCredits);

        return NextResponse.json({
          success: true,
          source: "profiles_table",
          userId,
          totalCredits,
          previousCredits: currentCredits,
          newCredits,
        });
      } catch (error) {
        const err = error as Error;
        console.error(`❌ Error updating profiles table: ${err.message}`);

        // Last resort: try direct SQL update
        try {
          console.log("Attempting direct SQL update...");

          // Try to update profiles table directly
          const { error: sqlError } = await supabase.rpc("execute_sql", {
            sql: `UPDATE profiles SET credits = COALESCE(credits, 0) + ${totalCredits} WHERE id = '${userId}'`,
          });

          if (sqlError) {
            console.error(`❌ SQL error: ${sqlError.message}`);
            throw sqlError;
          }

          console.log("✅ Credits updated via SQL");

          // Record the payment
          await recordPayment(supabase, userId, session, totalCredits);

          return NextResponse.json({
            success: true,
            method: "sql",
            userId,
            totalCredits,
          });
        } catch (sqlError) {
          console.error(`❌ All update methods failed`);
          return NextResponse.json(
            { error: "Failed to update credits" },
            { status: 500 }
          );
        }
      }
    }

    // Return success for other event types
    return NextResponse.json({ received: true });
  } catch (err) {
    const error = err as Error;
    console.error(`❌ Unhandled error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handle GET requests for testing
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: "Webhook endpoint is active" });
}
