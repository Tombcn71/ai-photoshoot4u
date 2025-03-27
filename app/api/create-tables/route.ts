import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error: "Missing Supabase credentials",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create profiles table if it doesn't exist
    const { error: profilesError } = await supabase.rpc("execute_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          credits INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add index on id for faster lookups
        CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
        
        -- Enable Row Level Security
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for users to view their own profile
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select_policy'
          ) THEN
            CREATE POLICY profiles_select_policy ON profiles
            FOR SELECT USING (auth.uid() = id);
          END IF;
        END
        $$;
        
        -- Create policy for service role to manage all profiles
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_service_policy'
          ) THEN
            CREATE POLICY profiles_service_policy ON profiles
            USING (true)
            WITH CHECK (true);
          END IF;
        END
        $$;
      `,
    });

    if (profilesError) {
      return NextResponse.json(
        {
          error: `Error creating profiles table: ${profilesError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tables created successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
