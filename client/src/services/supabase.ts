import { createClient } from '@supabase/supabase-js';

// User's exact Supabase configuration
const supabaseUrl = 'https://zyzdeilsdynusbbxzxuf.supabase.co';
const supabaseAnonKey = 'sb_publishable_TezSb3GnwTOxPSJ02mia4A_qss0IBZU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadReportToSupabaseStorage(
  patientId: string,
  file: File
): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${patientId}/${Date.now()}_${file.name}`;
    
    // Upload to medical-reports bucket
    const { data, error } = await supabase.storage
      .from('medical-reports')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.warn('Supabase storage bucket info:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('medical-reports')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('Supabase storage fallback:', err);
    return null;
  }
}
