import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createCheckoutSession } from "@/lib/stripe-server";
import { CREDIT_PACKAGES } from "@/lib/stripe-client";

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
