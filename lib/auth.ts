import { createServerSupabaseClient } from "@/lib/supabase-server";

// Get the current authenticated user
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    return {
      ...session.user,
      ...profile,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Check if the user is authenticated
export async function isAuthenticated() {
  const supabase = await createServerSupabaseClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return !!session;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
}
