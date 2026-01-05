import { createClient } from '@supabase/supabase-js';

// Get environment variables from Vite's import.meta.env
// In production (Vercel), these must be prefixed with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper to check if we have valid credentials
export const isSupabaseConfigured = () => !!supabaseUrl && !!supabaseKey;

// Prevent "supabaseUrl is required" crash by using a placeholder if missing.
// This allows the app to load to show a configuration error screen instead of white-screening.
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseKey || 'placeholder-key';

export const supabase = createClient(url, key);