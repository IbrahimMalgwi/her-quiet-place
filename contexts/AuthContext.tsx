// contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<{ error: any }>;
    clearError: () => void;
    error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Get initial session
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
            } catch (err) {
                console.error('Error initializing auth:', err);
                setError('Failed to initialize authentication');
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);

                // Clear any previous errors on successful auth events
                if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                    setError(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) setError(error.message);
            return { error };
        } catch (err: any) {
            const errorMessage = err.message || 'An unexpected error occurred during sign in';
            setError(errorMessage);
            return { error: err };
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    // Optional: Add email redirect URL for email confirmation
                    // emailRedirectTo: 'your-app-scheme://auth/callback'
                }
            });
            if (error) setError(error.message);
            return { error };
        } catch (err: any) {
            const errorMessage = err.message || 'An unexpected error occurred during sign up';
            setError(errorMessage);
            return { error: err };
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) setError(error.message);
            return { error };
        } catch (err: any) {
            const errorMessage = err.message || 'An unexpected error occurred during sign out';
            setError(errorMessage);
            return { error: err };
        } finally {
            setLoading(false);
        }
    };

    const clearError = () => {
        setError(null);
    };

    const value = {
        user,
        session,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Export the hook directly from here to avoid circular dependencies
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}