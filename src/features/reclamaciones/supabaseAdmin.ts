import { createClient } from "@supabase/supabase-js";

export const createSupabaseAdmin = () => {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const secretKey = import.meta.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY.");
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};
