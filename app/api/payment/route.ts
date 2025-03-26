import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { CREDIT_PACKAGES } from "@/lib/stripe-client";
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

// Create a Stripe Checkout Session
async function createCheckoutSession({
  priceId,
  userId,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  userId: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
      ...(customerEmail && { customer_email: customerEmail }),
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { priceId, successUrl, cancelUrl } = await request.json();

    // Validate the price ID
    const validPackage = CREDIT_PACKAGES.find((pkg) => pkg.priceId === priceId);
    if (!validPackage) {
      return NextResponse.json(
        { success: false, message: "Invalid price ID" },
        { status: 400 }
      );
    }

    // Get the authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create a checkout session
    const checkoutSession = await createCheckoutSession({
      priceId,
      userId: session.user.id,
      customerEmail: session.user.email,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.sessionId,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Error creating payment session:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
