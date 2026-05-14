import { createServerClient as supabaseCreateServerClient } from "@supabase/ssr"; // Added 'as' alias
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";

// Rename this to match what your other files are looking for
export function createServerClient() { 
  const cookieStore = cookies();

  return supabaseCreateServerClient<Database>( // Use the alias here
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}