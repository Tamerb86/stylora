/**
 * Supabase Auth Integration
 * Production-ready authentication system
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from './env';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = ENV.supabaseUrl;
  const supabaseKey = ENV.supabaseAnonKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Anon Key must be configured in environment variables');
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Server-side, we don't persist sessions
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
}

/**
 * Get Supabase admin client (for server-side operations)
 */
export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = ENV.supabaseUrl;
  const supabaseServiceKey = ENV.supabaseServiceKey;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and Service Key must be configured for admin operations');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
