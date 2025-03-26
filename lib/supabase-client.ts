import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

// This client is for client components only
export const supabase = createClientComponentClient<Database>();

// Add a function to check if the client is working
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("count(*)")
      .limit(1);
    if (error) throw error;
    console.log("Supabase connection successful");
    return true;
  } catch (error) {
    console.error("Supabase connection error:", error);
    return false;
  }
}
