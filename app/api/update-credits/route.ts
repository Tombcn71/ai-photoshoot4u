import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, credits } = body;

    if (!userId || credits === undefined) {
      return NextResponse.json(
        { error: "User ID and credits are required" },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get current credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: `Error fetching profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    const currentCredits = profile?.credits || 0;
    const newCredits = currentCredits + Number.parseInt(credits.toString(), 10);

    // Update credits
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: `Error updating credits: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      previousCredits: currentCredits,
      newCredits: newCredits,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
