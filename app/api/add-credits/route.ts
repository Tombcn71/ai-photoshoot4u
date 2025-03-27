import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const { userId, credits } = await request.json();

    if (!userId || !credits) {
      return NextResponse.json(
        { error: "User ID and credits are required" },
        { status: 400 }
      );
    }

    // Try multiple methods to update credits

    // Method 1: Direct update
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error(`Error fetching profile: ${profileError.message}`);
      } else {
        const currentCredits = profile?.credits || 0;
        const newCredits = currentCredits + Number(credits);

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ credits: newCredits })
          .eq("id", userId);

        if (!updateError) {
          return NextResponse.json({
            success: true,
            method: "direct_update",
            previousCredits: currentCredits,
            newCredits,
          });
        }
      }
    } catch (error) {
      console.error(`Direct update failed: ${error}`);
    }

    // Method 2: Upsert
    try {
      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: userId,
        credits: supabase.rpc("add_credits_expr", {
          base: "credits",
          amount: Number(credits),
        }),
      });

      if (!upsertError) {
        return NextResponse.json({
          success: true,
          method: "upsert",
          creditsAdded: credits,
        });
      }
    } catch (error) {
      console.error(`Upsert failed: ${error}`);
    }

    // Method 3: RPC
    try {
      const { error: rpcError } = await supabase.rpc("add_credits", {
        user_id_param: userId,
        credits_param: Number(credits),
      });

      if (!rpcError) {
        return NextResponse.json({
          success: true,
          method: "rpc",
          creditsAdded: credits,
        });
      }
    } catch (error) {
      console.error(`RPC failed: ${error}`);
    }

    // Method 4: Raw SQL (last resort)
    try {
      const { error: sqlError } = await supabase.rpc("execute_sql", {
        sql: `UPDATE profiles SET credits = COALESCE(credits, 0) + ${Number(
          credits
        )} WHERE id = '${userId}'`,
      });

      if (!sqlError) {
        return NextResponse.json({
          success: true,
          method: "raw_sql",
          creditsAdded: credits,
        });
      }
    } catch (error) {
      console.error(`Raw SQL failed: ${error}`);
    }

    return NextResponse.json(
      { error: "All update methods failed" },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
