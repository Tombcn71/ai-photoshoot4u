import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// This client is for client components only
export const supabase = createClientComponentClient();
