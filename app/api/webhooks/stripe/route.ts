import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe-server";
import { CREDIT_PACKAGES } from "@/lib/stripe-client";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = headers();
  const signature = (await headersList).get("stripe-signature") as string;

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
        const session = event.data.object as any;
        const userId = session.metadata.userId;

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
          amount: session.amount_total / 100, // Convert from cents to dollars
          currency: session.currency,
          status: "completed",
          payment_intent_id: session.payment_intent,
          stripe_session_id: session.id,
          credits_purchased: creditPackage.credits,
          package_id: creditPackage.id,
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
            description: `Purchased ${creditPackage.credits} credits`,
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
        const paymentIntent = event.data.object as any;
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
