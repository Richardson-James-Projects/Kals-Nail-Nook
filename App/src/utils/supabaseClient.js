import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// Clean the URL by stripping trailing slashes and any accidental '/rest/v1' suffix
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_project_url_here';

export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured. Falling back to localStorage database mode.');
}

export const cleanPhoneNumber = (val) => {
    if (!val) return '';
    return val.replace(/[^\d]/g, '');
};

export const formatPhoneNumber = (val) => {
    if (!val) return '';
    const cleaned = val.replace(/[^\d]/g, '');
    if (cleaned.length > 6) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    if (cleaned.length > 3) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    return cleaned;
};
