import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detects if the user has replaced placeholder credentials with their real Supabase keys
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl.trim() !== '' &&
  !supabaseUrl.includes('your-project-id.supabase.co') &&
  !!supabaseAnonKey && 
  supabaseAnonKey.trim() !== '' &&
  supabaseAnonKey !== 'your-supabase-anon-key-here';

// Initialize with safe placeholders if not configured to prevent client crashes
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
);
