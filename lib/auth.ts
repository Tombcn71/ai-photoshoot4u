import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "./supabase";

// Get the current session
export async function getSession() {
  return await getServerSession(authOptions);
}

// Get the current user
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

// Get the current user's profile from Supabase
export async function getUserProfile() {
  const user = await getCurrentUser();

  if (!user?.email) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", user.email)
    .single();

  return data;
}
