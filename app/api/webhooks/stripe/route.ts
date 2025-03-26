import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from "stripe";
import { CREDIT_PACKAGES } from "@/lib/stripe-client";

// Initialize Stripe directly in the route handler
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  appInfo: {
    name: "AI Headshots Generator",
    version: "1.0.0",
  },
});

export async function POST(request: Request) {
  const body = await request.text();
  // Await the headers function to get the headers object
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not set" },
      { status: 500 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          throw new Error("User ID not found in session metadata");
        }

        // Get the price ID from the session
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id
        );
        const priceId = lineItems.data[0]?.price?.id;

        if (!priceId) {
          throw new Error("Price ID not found in session");
        }

        // Find the credit package based on the price ID
        const creditPackage = CREDIT_PACKAGES.find(
          (pkg) => pkg.priceId === priceId
        );

        if (!creditPackage) {
          throw new Error(`Credit package not found for price ID: ${priceId}`);
        }

        // Get coupon information if a coupon was used
        let couponData = null;

        try {
          // Retrieve the checkout session with expanded discount data
          const expandedSession = await stripe.checkout.sessions.retrieve(
            session.id,
            {
              expand: [
                "total_details.breakdown.discounts",
                "line_items.data.discounts",
              ],
            }
          );

          // Check if we have discount information in total_details
          const discounts = expandedSession.total_details?.breakdown?.discounts;

          if (discounts && discounts.length > 0) {
            // Get the coupon details from the first discount
            const discount = discounts[0];

            if (discount.discount?.coupon) {
              const coupon = discount.discount.coupon;
              couponData = {
                id: coupon.id,
                name: coupon.name || coupon.id,
                amountOff: coupon.amount_off,
                percentOff: coupon.percent_off,
              };
            }
          }

          // If we couldn't find coupon data in total_details, try line_items
          if (!couponData && expandedSession.line_items?.data) {
            for (const item of expandedSession.line_items.data) {
              if (item.discounts && item.discounts.length > 0) {
                for (const discount of item.discounts) {
                  if (discount.discount?.coupon) {
                    const coupon = discount.discount.coupon;
                    couponData = {
                      id: coupon.id,
                      name: coupon.name || coupon.id,
                      amountOff: coupon.amount_off,
                      percentOff: coupon.percent_off,
                    };
                    break;
                  }
                }
                if (couponData) break;
              }
            }
          }
        } catch (error) {
          console.error("Error retrieving coupon information:", error);
          // Continue without coupon data if there's an error
        }

        // Calculate discount amount
        const subtotal = session.amount_subtotal
          ? session.amount_subtotal / 100
          : 0;
        const total = session.amount_total ? session.amount_total / 100 : 0;
        const discountAmount = subtotal - total;

        // Update user credits in the database
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();

        if (profileError) {
          throw new Error(
            `Error fetching user profile: ${profileError.message}`
          );
        }

        const currentCredits = profile.credits || 0;
        const newCredits = currentCredits + creditPackage.credits;

        // Update the user's credits
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ credits: newCredits })
          .eq("id", userId);

        if (updateError) {
          throw new Error(
            `Error updating user credits: ${updateError.message}`
          );
        }

        // Record the payment in the database
        const { error: paymentError } = await supabase.from("payments").insert({
          user_id: userId,
          amount: total,
          currency: session.currency || "usd",
          status: "completed",
          payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          stripe_session_id: session.id,
          credits_purchased: creditPackage.credits,
          package_id: creditPackage.id,
          metadata: {
            coupon: couponData,
            original_amount: subtotal,
            discount_amount: discountAmount,
          },
        });

        if (paymentError) {
          throw new Error(`Error recording payment: ${paymentError.message}`);
        }

        // Record credit addition in credit_usage table
        const { error: creditUsageError } = await supabase
          .from("credit_usage")
          .insert({
            user_id: userId,
            amount: creditPackage.credits,
            description: `Purchased ${creditPackage.credits} credits${
              couponData ? ` with coupon ${couponData.id}` : ""
            }`,
            type: "purchase",
          });

        if (creditUsageError) {
          throw new Error(
            `Error recording credit usage: ${creditUsageError.message}`
          );
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(`Payment failed: ${paymentIntent.id}`);

        // You could update the database to mark the payment as failed
        // and notify the user if needed
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Error processing webhook: ${error.message}`);
    return NextResponse.json(
      { error: `Error processing webhook: ${error.message}` },
      { status: 500 }
    );
  }
}

// This is important for Stripe webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};
