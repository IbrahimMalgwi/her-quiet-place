// contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Use the built-in User type and extend it properly
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

// Export AuthContext so it can be used in useAuth hook
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);

    // Add isAuthenticated computed property
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

            // Fallback: Check user_metadata
            const metadata = user.user_metadata as { role?: string };
            if (metadata?.role === 'admin') {
                console.log('Role from user_metadata:', metadata.role);
                setUserRole('admin');
                return;
            }

            // Final fallback: Check email (for development)
            const isAdmin = user.email?.includes('admin') ||
                user.email === 'admin@herquietplace.com';
            console.log('Role from email check:', isAdmin ? 'admin' : 'user');
            setUserRole(isAdmin ? 'admin' : 'user');

        } catch (error) {
            console.error('Error checking user role:', error);
            setUserRole('user'); // Default to user role
        }
    };

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Get initial session
                const { data: { session } } = await supabase.auth.getSession();

                if (!mounted) return;

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await checkUserRole(session.user);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
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
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (data.user && !error) {
                await checkUserRole(data.user);
            }

            return { error };
        } catch (error) {
            console.error('Sign in error:', error);
            return { error };
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: 'user' // Default role for new signups
                    }
                }
            });

            if (data.user && !error) {
                // Create a record in user_roles table for the new user
                try {
                    await supabase
                        .from('user_roles')
                        .insert([
                            {
                                user_id: data.user.id,
                                role: 'user'
                            }
                        ]);
                } catch (insertError) {
                    console.error('Error creating user role:', insertError);
                }

                await checkUserRole(data.user);
            }

            return { error };
        } catch (error) {
            console.error('Sign up error:', error);
            return { error };
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUserRole(null);
        } catch (error) {
            console.error('Sign out error:', error);
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