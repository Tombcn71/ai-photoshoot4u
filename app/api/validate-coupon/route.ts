import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Coupon code is required" },
        { status: 400 }
      );
    }

    // Retrieve the coupon from Stripe
    const coupon = await stripe.coupons.retrieve(code);

    if (!coupon || !coupon.valid) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired coupon code" },
        { status: 400 }
      );
    }

    // Return coupon details
    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        name: coupon.name || coupon.id,
        percentOff: coupon.percent_off,
        amountOff: coupon.amount_off,
        valid: coupon.valid,
      },
    });
  } catch (error: any) {
    console.error("Error validating coupon:", error);

    // Handle specific Stripe errors
    if (
      error.type === "StripeInvalidRequestError" &&
      error.statusCode === 404
    ) {
      return NextResponse.json(
        { success: false, message: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to validate coupon",
      },
      { status: 500 }
    );
  }
}
