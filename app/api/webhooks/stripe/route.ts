import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from "stripe";

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

// Map of product IDs to credit amounts
// This should match your Stripe products
const PRODUCT_CREDITS_MAP: Record<string, number> = {
  // Replace these with your actual product IDs
  prod_basic: 100,
  prod_standard: 500,
  prod_premium: 1000,
};

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

        // Get the user ID from client_reference_id
        const userId = session.client_reference_id;

        if (!userId) {
          console.error("No client_reference_id found in session");
          return NextResponse.json(
            { error: "No user ID found in session" },
            { status: 400 }
          );
        }

        // Get the line items to determine what was purchased
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id
        );

        if (!lineItems.data.length) {
          console.error("No line items found in session");
          return NextResponse.json(
            { error: "No line items found in session" },
            { status: 400 }
          );
        }

        // Get the product details for each line item
        let totalCredits = 0;
        const purchasedItems = [];

        for (const item of lineItems.data) {
          if (!item.price?.product) continue;

          // Get the product ID
          const productId =
            typeof item.price.product === "string"
              ? item.price.product
              : item.price.product.id;

          // Get the product details
          const product =
            typeof item.price.product === "string"
              ? await stripe.products.retrieve(item.price.product)
              : item.price.product;

          // Check if the product is deleted
          if ("deleted" in product && product.deleted === true) {
            console.warn(`Product ${productId} has been deleted`);
            continue;
          }

          // Determine credits from product metadata or fallback to map
          let credits = 0;
          let productName = "Unknown Product";

          // Now we know it's a valid product, not a deleted one
          if ("name" in product) {
            productName = product.name;

            // Check for credits in metadata
            if (product.metadata && "credits" in product.metadata) {
              credits =
                Number.parseInt(product.metadata.credits as string, 10) *
                (item.quantity || 1);
            } else if (PRODUCT_CREDITS_MAP[productId]) {
              credits = PRODUCT_CREDITS_MAP[productId] * (item.quantity || 1);
            }
          }

          if (credits > 0) {
            totalCredits += credits;
            purchasedItems.push({
              product_id: productId,
              product_name: productName,
              credits: credits,
              amount: (item.amount_total || 0) / 100, // Convert from cents to dollars
            });
          }
        }

        if (totalCredits === 0) {
          console.error("No credits found in purchased products");
          return NextResponse.json(
            { error: "No credits found in purchased products" },
            { status: 400 }
          );
        }

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
        const newCredits = currentCredits + totalCredits;

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
        for (const item of purchasedItems) {
          const { error: paymentError } = await supabase
            .from("payments")
            .insert({
              user_id: userId,
              amount: item.amount,
              currency: session.currency || "usd",
              status: "completed",
              payment_intent_id:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : null,
              stripe_session_id: session.id,
              credits_purchased: item.credits,
              package_id: item.product_name,
              metadata: {
                product_id: item.product_id,
              },
            });

          if (paymentError) {
            console.error(`Error recording payment: ${paymentError.message}`);
          }

          // Record credit addition in credit_usage table
          const { error: creditUsageError } = await supabase
            .from("credit_usage")
            .insert({
              user_id: userId,
              amount: item.credits,
              description: `Purchased ${item.credits} credits (${item.product_name})`,
              type: "purchase",
            });

          if (creditUsageError) {
            console.error(
              `Error recording credit usage: ${creditUsageError.message}`
            );
          }
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(`Payment failed: ${paymentIntent.id}`);
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
