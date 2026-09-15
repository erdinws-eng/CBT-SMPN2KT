import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Baca dari environment variable atau localStorage
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem('cbt_supabase_url') || '';
  const localKey = localStorage.getItem('cbt_supabase_key') || '';

  const url = (envUrl || localUrl).trim();
  const key = (envKey || localKey).trim();

  return {
    url,
    key,
    isConfigured: Boolean(url && key && url.startsWith('http')),
  };
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('cbt_supabase_url', url.trim());
  localStorage.setItem('cbt_supabase_key', key.trim());
  // Invalidate client instance
  supabaseInstance = null;
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('cbt_supabase_url');
  localStorage.removeItem('cbt_supabase_key');
  supabaseInstance = null;
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.key, {
        auth: {
          persistSession: false,
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
};

export const testSupabaseConnection = async (testUrl?: string, testKey?: string): Promise<{ success: boolean; message: string }> => {
  try {
    const config = getSupabaseConfig();
    const url = testUrl || config.url;
    const key = testKey || config.key;

    if (!url || !key) {
      return { success: false, message: 'URL atau Anon Key Supabase belum diisi.' };
    }

    const testClient = createClient(url, key);
    const { error } = await testClient.from('school_settings').select('id').limit(1);

    if (error) {
      // Jika tabel belum dibuat, errorcode mungkin 42P01 (relation does not exist)
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Terkoneksi ke Supabase! (Catatan: Tabel belum dibuat, silakan jalankan supabase_schema.sql di SQL Editor).',
        };
      }
      return { success: false, message: `Gagal query: ${error.message}` };
    }

    return { success: true, message: 'Koneksi ke database Supabase berhasil dan siap digunakan!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal menyambung ke Supabase.' };
  }
};
