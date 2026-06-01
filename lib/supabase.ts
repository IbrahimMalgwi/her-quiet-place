// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Secure storage adapter for Supabase
const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
        return SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
        return SecureStore.deleteItemAsync(key);
    },
};

const WebStorageAdapter = {
    getItem: (key: string) => {
        return Promise.resolve(typeof window === 'undefined' ? null : window.localStorage.getItem(key));
    },
    setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
        return Promise.resolve();
    },
    removeItem: (key: string) => {
        if (typeof window !== 'undefined') window.localStorage.removeItem(key);
        return Promise.resolve();
    },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: Platform.OS === 'web' ? WebStorageAdapter : ExpoSecureStoreAdapter,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
    },
});
