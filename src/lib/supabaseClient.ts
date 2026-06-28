import { createClient } from '@supabase/supabase-js';

const sUrl = import.meta.env.VITE_SUPABASE_URL || '';
const sKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Vê se o dev colocou as chaves de verdade no .env
export const temSupabase = 
  !!sUrl && 
  sUrl.trim() !== '' &&
  !sUrl.includes('your-project-id.supabase.co') &&
  !!sKey && 
  sKey.trim() !== '' &&
  sKey !== 'your-supabase-anon-key-here';

// Cria o client. Se não tiver configurado ainda, usa uns placeholders pro app não capotar
export const supabase = createClient(
  temSupabase ? sUrl : 'https://placeholder.supabase.co',
  temSupabase ? sKey : 'placeholder-key'
);
