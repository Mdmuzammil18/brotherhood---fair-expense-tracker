import { createClient } from '@supabase/supabase-js';

// Helper to safely access process.env without crashing in browser
const getEnv = (key: string) => {
  try {
    return typeof process !== 'undefined' ? process.env?.[key] : undefined;
  } catch {
    return undefined;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_ANON_KEY');

// Helper to check if we have valid credentials
export const isSupabaseConfigured = () => !!supabaseUrl && !!supabaseKey;

// Prevent "supabaseUrl is required" crash by using a placeholder if missing.
// This allows the app to load to show a configuration error screen instead of white-screening.
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseKey || 'placeholder-key';

export const supabase = createClient(url, key);