// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    userRole: 'user' | 'admin' | null;
    isAuthenticated: boolean;
    refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const isAuthenticated = !!user;

    const safeNavigate = (path: any) => {
        try {
            router.replace(path);
        } catch (error) {
            // Use number type for setTimeout in React Native
            const timeoutId = setTimeout(() => router.replace(path), 100);
            // No need to store timeoutId as we don't need to clear it
        }
    };

    // Session recovery function
    const refreshSession = async () => {
        try {
            console.log('Refreshing session...');
            const { data: { session: freshSession }, error } = await supabase.auth.getSession();

            if (error) {
                console.log('Session refresh error:', error);
                // Clear corrupted session
                await SecureStore.deleteItemAsync('supabase.auth.token');
                setSession(null);
                setUser(null);
                setUserRole(null);
                return;
            }

            if (freshSession?.user) {
                console.log('Session refreshed successfully');
                setSession(freshSession);
                setUser(freshSession.user);
                checkUserRole(freshSession.user);
            } else {
                console.log('No valid session after refresh');
                setSession(null);
                setUser(null);
                setUserRole(null);
            }
        } catch (error) {
            console.error('Session refresh failed:', error);
            setSession(null);
            setUser(null);
            setUserRole(null);
        }
    };

    const checkUserRole = async (user: User) => {
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (data && !error) {
                setUserRole(data.role as 'user' | 'admin');
            } else {
                setUserRole('user');
            }
        } catch (error) {
            setUserRole('user');
        }
    };

    useEffect(() => {
        let mounted = true;
        let refreshInterval: number | null = null;

        const initializeAuth = async () => {
            try {
                setLoading(true);

                // Try to get existing session
                const { data: { session: existingSession }, error } = await supabase.auth.getSession();

                if (!mounted) return;

                if (existingSession?.user) {
                    console.log('Found existing session');
                    setSession(existingSession);
                    setUser(existingSession.user);
                    checkUserRole(existingSession.user);

                    // Set up session refresh every 30 minutes
                    refreshInterval = setInterval(refreshSession, 30 * 60 * 1000) as unknown as number;
                } else {
                    console.log('No existing session found');
                    setSession(null);
                    setUser(null);
                    setUserRole(null);
                }

            } catch (error) {
                console.log('Auth init error - proceeding without session');
                setSession(null);
                setUser(null);
                setUserRole(null);
            } finally {
                if (mounted) {
                    setLoading(false);
                    setInitialLoadComplete(true);
                }
            }
        };

        initializeAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: any, session: Session | null) => {
                if (!mounted) return;

                console.log('Auth state changed:', event);

                // Handle token refreshed events
                if (event === 'TOKEN_REFRESHED') {
                    console.log('Token refreshed automatically');
                    setSession(session);
                    return;
                }

                // Handle signed out events
                if (event === 'SIGNED_OUT') {
                    console.log('User signed out');
                    setSession(null);
                    setUser(null);
                    setUserRole(null);
                    // Clear secure storage
                    await SecureStore.deleteItemAsync('supabase.auth.token');
                    safeNavigate('/(auth)/welcome' as any);
                    return;
                }

                // Handle other auth events
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    checkUserRole(session.user);
                } else {
                    setUserRole(null);
                }
            }
        );

        return () => {
            mounted = false;
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (data?.session) {
                setSession(data.session);
                setUser(data.session.user);
            }

            return { error };
        } catch (error: any) {
            return { error };
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { role: 'user' } }
            });
            return { error };
        } catch (error: any) {
            return { error };
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setLoading(true);
            // Clear local state first
            setUser(null);
            setSession(null);
            setUserRole(null);
            // Clear secure storage
            await SecureStore.deleteItemAsync('supabase.auth.token');
            // Sign out from Supabase
            await supabase.auth.signOut();
            // Navigate to welcome
            safeNavigate('/(auth)/welcome' as any);
        } catch (error) {
            // Even if error, clear local state
            setUser(null);
            setSession(null);
            setUserRole(null);
            await SecureStore.deleteItemAsync('supabase.auth.token');
            safeNavigate('/(auth)/welcome' as any);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        session,
        loading: loading && !initialLoadComplete,
        signIn,
        signUp,
        signOut,
        userRole,
        isAuthenticated,
        refreshSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}