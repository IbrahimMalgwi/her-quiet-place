// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';

// Add this for OAuth to work properly in Expo
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
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const isAuthenticated = !!user;

    const checkUserRole = async (user: User) => {
        try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Role check timeout')), 10000)
            );

            const rolePromise = supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            const { data, error } = await Promise.race([rolePromise, timeoutPromise]) as any;

            if (data && !error) {
                console.log('Role from user_roles table:', data.role);
                setUserRole(data.role as 'user' | 'admin');
                return;
            }

            // If no role found in user_roles, create a default one
            if (error && error.code === 'PGRST116') { // No rows returned
                console.log('No role found, creating default user role');
                const { error: insertError } = await supabase
                    .from('user_roles')
                    .insert([
                        {
                            user_id: user.id,
                            role: 'user',
                            created_at: new Date().toISOString()
                        }
                    ]);

                if (!insertError) {
                    setUserRole('user');
                    return;
                }
            }

            // Fallback: Check user_metadata
            const metadata = user.user_metadata as { role?: string };
            if (metadata?.role === 'admin') {
                console.log('Role from user_metadata:', metadata.role);
                setUserRole('admin');
                return;
            }

            // Final fallback: Default to user role
            console.log('Defaulting to user role');
            setUserRole('user');

        } catch (error) {
            console.error('Error checking user role:', error);
            setUserRole('user'); // Default to user role on error
        }
    };

    useEffect(() => {
        let mounted = true;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const initializeAuth = async () => {
            try {
                setLoading(true);

                // Add timeout for initial session loading
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth initialization timeout')), 15000)
                );

                const sessionPromise = supabase.auth.getSession();

                const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;

                if (!mounted) return;

                if (error) {
                    console.error('Error getting session:', error);
                    // Don't throw - continue with null session
                }

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await checkUserRole(session.user);
                } else {
                    setUserRole(null);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                // Continue with null session - don't block the app
            } finally {
                if (mounted) {
                    setLoading(false);
                    setInitialLoadComplete(true);
                }
            }
        };

        initializeAuth();

        // Listen for auth changes with better error handling
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

                console.log('Auth state changed:', event);

                // Clear any existing timeouts
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                // Set a timeout for auth state changes
                timeoutId = setTimeout(() => {
                    if (mounted) {
                        console.warn('Auth state change taking too long, forcing completion');
                        setLoading(false);
                    }
                }, 10000);

                try {
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        await checkUserRole(session.user);
                    } else {
                        setUserRole(null);
                        // Redirect to welcome screen when signed out
                        if (event === 'SIGNED_OUT') {
                            console.log('User signed out, redirecting to welcome screen');
                            router.replace('/(auth)/welcome');
                        }
                    }
                } catch (error) {
                    console.error('Error in auth state change:', error);
                } finally {
                    if (mounted && timeoutId) {
                        setLoading(false);
                        clearTimeout(timeoutId);
                        timeoutId = null;
                    }
                }
            }
        );

        return () => {
            mounted = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);

            // Add timeout for sign in
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Sign in timeout')), 30000)
            );

            const signInPromise = supabase.auth.signInWithPassword({
                email,
                password,
            });

            const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;

            if (data?.user && !error) {
                await checkUserRole(data.user);
            }

            return { error };
        } catch (error: any) {
            console.error('Sign in error:', error);
            // Return a more user-friendly error message
            if (error.message === 'Sign in timeout') {
                return { error: { message: 'Sign in taking too long. Please check your connection and try again.' } };
            }
            return { error };
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            setLoading(true);

            // Add timeout for sign up
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Sign up timeout')), 30000)
            );

            const signUpPromise = supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: 'user' // Default role for new signups
                    }
                }
            });

            const { data, error } = await Promise.race([signUpPromise, timeoutPromise]) as any;

            if (data?.user && !error) {
                // Create a record in user_roles table for the new user
                try {
                    const { error: roleError } = await supabase
                        .from('user_roles')
                        .insert([
                            {
                                user_id: data.user.id,
                                role: 'user',
                                created_at: new Date().toISOString()
                            }
                        ]);

                    if (roleError) {
                        console.error('Error creating user role:', roleError);
                    } else {
                        await checkUserRole(data.user);
                    }
                } catch (insertError) {
                    console.error('Error creating user role:', insertError);
                }
            }

            return { error };
        } catch (error: any) {
            console.error('Sign up error:', error);
            // Return a more user-friendly error message
            if (error.message === 'Sign up timeout') {
                return { error: { message: 'Sign up taking too long. Please check your connection and try again.' } };
            }
            return { error };
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setLoading(true);

            // Add timeout for sign out
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Sign out timeout')), 10000)
            );

            const signOutPromise = supabase.auth.signOut();

            await Promise.race([signOutPromise, timeoutPromise]);

            console.log('Sign out successful');

            // Clear local state immediately
            setUser(null);
            setSession(null);
            setUserRole(null);

            // Navigate to welcome screen
            router.replace('/(auth)/welcome');

        } catch (error: any) {
            console.error('Sign out error:', error);
            // Even if there's an error, clear local state and redirect
            setUser(null);
            setSession(null);
            setUserRole(null);
            router.replace('/(auth)/welcome');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        session,
        loading: loading && !initialLoadComplete, // Only show loading during initial app start
        signIn,
        signUp,
        signOut,
        userRole,
        isAuthenticated,
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