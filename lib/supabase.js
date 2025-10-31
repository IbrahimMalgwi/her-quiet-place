// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://qlpzixkgifjefjsmmtke.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHppeGtnaWZqZWZqc21tdGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MjM5MzYsImV4cCI6MjA3NzQ5OTkzNn0.RR7FuEQ6KQ1zL-OgJ1ur1dJvPeV-V6mXqNREJrCs-P0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});
