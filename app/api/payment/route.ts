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

export async function POST(request: Request) {
  try {
    console.log("Payment API route called");

    // Parse the request body
    const body = await request.json();
    console.log("Request body:", body);

    const { priceId, couponId, successUrl, cancelUrl } = body;

    if (!priceId || !successUrl || !cancelUrl) {
      console.error("Missing required fields:", {
        priceId,
        successUrl,
        cancelUrl,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Validate the price ID
    const validPackage = CREDIT_PACKAGES.find((pkg) => pkg.priceId === priceId);
    if (!validPackage) {
      console.error("Invalid price ID:", priceId);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid price ID",
        },
        { status: 400 }
      );
    }

    // Get the authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      console.error("User not authenticated");
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    console.log("Creating Stripe checkout session for user:", session.user.id);

    // Prepare checkout session parameters
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
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
        userId: session.user.id,
      },
      ...(session.user.email && { customer_email: session.user.email }),
    };

    // Apply coupon if provided
    if (couponId) {
      try {
        // Verify the coupon exists and is valid
        const coupon = await stripe.coupons.retrieve(couponId);

        if (coupon && coupon.valid) {
          checkoutParams.discounts = [
            {
              coupon: couponId,
            },
          ];
          console.log(`Applied coupon: ${couponId}`);
        } else {
          console.warn(`Coupon ${couponId} is invalid or expired`);
        }
      } catch (error) {
        console.error(`Error retrieving coupon ${couponId}:`, error);
        // Continue without the coupon if there's an error
      }
    }

    // Create a checkout session
    try {
      const stripeSession = await stripe.checkout.sessions.create(
        checkoutParams
      );

      console.log("Checkout session created:", stripeSession.id);

      return NextResponse.json({
        success: true,
        sessionId: stripeSession.id,
        url: stripeSession.url,
      });
    } catch (stripeError: any) {
      console.error("Stripe error:", stripeError);
      return NextResponse.json(
        {
          success: false,
          message: stripeError.message || "Error creating Stripe session",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in payment API route:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
