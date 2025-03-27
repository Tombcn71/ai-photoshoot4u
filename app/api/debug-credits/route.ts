import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: `Error fetching profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Get payment history
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (paymentsError) {
      return NextResponse.json(
        { error: `Error fetching payments: ${paymentsError.message}` },
        { status: 500 }
      );
    }

    // Get credit usage
    const { data: creditUsage, error: creditUsageError } = await supabase
      .from("credit_usage")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (creditUsageError) {
      return NextResponse.json(
        { error: `Error fetching credit usage: ${creditUsageError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile,
      payments,
      creditUsage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
