import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type AdminClient = SupabaseClient<Database>;

let cachedClient: AdminClient | null = null;

/**
 * Reads a server-only environment variable when an operation actually needs it.
 * Validating lazily keeps builds that never execute the invitation flow from
 * failing because a secret is absent.
 */
export function requireServerEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

/**
 * Administrative Supabase client bound to the service role key.
 *
 * It never receives visitor cookies and never persists, refreshes or detects a
 * session, so it cannot be mistaken for the request-scoped client in
 * `utils/supabase/server.ts`. The `server-only` import makes importing this
 * module from a client component a build error.
 */
export function createAdminClient(): AdminClient {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = createSupabaseClient<Database>(
    requireServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );

  return cachedClient;
}
