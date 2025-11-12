import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';

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

    const isAuthenticated = !!user;

    const checkUserRole = async (user: User) => {
        try {
            // Try to get role from user_roles table first
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single();

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

        const initializeAuth = async () => {
            try {
                setLoading(true);

                // Get initial session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error getting session:', error);
                    // Don't throw - continue with null session
                }

                if (!mounted) return;

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await checkUserRole(session.user);
                } else {
                    setUserRole(null);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                // Continue with null session
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

                console.log('Auth state changed:', event);

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await checkUserRole(session.user);
                } else {
                    setUserRole(null);
                }

                setLoading(false);
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (data?.user && !error) {
                await checkUserRole(data.user);
            }

            return { error };
        } catch (error: any) {
            console.error('Sign in error:', error);
            return { error };
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            setLoading(true);

            // Remove emailRedirectTo for React Native to avoid origin issues
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: 'user' // Default role for new signups
                    }
                    // Removed emailRedirectTo to fix the origin error
                }
            });

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
            return { error };
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Sign out error:', error);
                throw error;
            }
            // State will be cleared by the auth state change listener
            console.log('Sign out successful');
        } catch (error: any) {
            console.error('Sign out error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        session,
        loading,
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