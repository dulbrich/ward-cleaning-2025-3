import { createBrowserClient } from "@supabase/ssr";

// Singleton instance to ensure all components use the same client
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  // Return existing instance if already created
  if (supabaseClient) return supabaseClient;
  
  // Create a new client if one doesn't exist
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'X-Client-Info': 'ward-cleaning-app'
        }
      },
      // Configure auto-refresh to get tokens and maintain connections
      auth: {
        autoRefreshToken: true,
        persistSession: true
      },
      realtime: {
        timeout: 60000, // 1 minute
        params: {
          eventsPerSecond: 10
        }
      }
    }
  );
  
  // Return the singleton instance
  return supabaseClient;
};
