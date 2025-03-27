import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check profiles table structure
    const { data: profilesInfo, error: profilesError } = await supabase.rpc(
      "debug_table_info",
      {
        table_name: "profiles",
      }
    );

    if (profilesError) {
      // Fallback to a simpler query if the RPC doesn't exist
      const { data: profilesData, error: profilesQueryError } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      if (profilesQueryError) {
        return NextResponse.json(
          { error: `Error querying profiles: ${profilesQueryError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Table structure inferred from sample data",
        profiles: profilesData.length > 0 ? Object.keys(profilesData[0]) : [],
      });
    }

    return NextResponse.json({
      profiles: profilesInfo,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
