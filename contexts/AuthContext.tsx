// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { getQueryParams } from 'expo-auth-session/build/QueryParams';
import { Platform } from 'react-native';
import { streakService } from '../services/streakService';

// Add this for OAuth to work properly in Expo
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    requestPasswordReset: (email: string) => Promise<{ error: any }>;
    updatePassword: (password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
    userRole: 'user' | 'admin' | null;
    isAuthenticated: boolean;
    passwordRecovery: boolean;
    passwordRecoveryError: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
    const [passwordRecovery, setPasswordRecovery] = useState(false);
    const [passwordRecoveryError, setPasswordRecoveryError] = useState<string | null>(null);

    const isAuthenticated = !!user;

    const checkUserRole = useCallback(async (user: User) => {
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (error) {
                throw error;
            }

            setUserRole(data.role === 'admin' ? 'admin' : 'user');
        } catch (error) {
            console.error('Error checking user role:', error);
            setUserRole('user');
        }
    }, []);

    const recordLoginDay = useCallback(async () => {
        try {
            await streakService.recordLoginDay();
        } catch (error) {
            console.error('Error recording login streak:', error);
        }
    }, []);

    const handleAuthUrl = useCallback(async (url: string) => {
        if (!url.includes('update-password')) return;

        setPasswordRecovery(true);
        setPasswordRecoveryError(null);

        try {
            const { params, errorCode } = getQueryParams(url);

            if (errorCode || params.error) {
                throw new Error(params.error_description || params.error || 'Password reset link is invalid or expired.');
            }

            if (params.code) {
                const { error } = await supabase.auth.exchangeCodeForSession(params.code);
                if (error) throw error;
                return;
            }

            if (params.access_token && params.refresh_token) {
                const { error } = await supabase.auth.setSession({
                    access_token: params.access_token,
                    refresh_token: params.refresh_token,
                });
                if (error) throw error;
                return;
            }

            throw new Error('Password reset link is invalid or expired.');
        } catch (error: any) {
            console.error('Password recovery link error:', error);
            setPasswordRecoveryError(error.message || 'Password reset link is invalid or expired.');
        }
    }, []);

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
                    await Promise.all([
                        checkUserRole(session.user),
                        recordLoginDay(),
                    ]);
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

                if (event === 'PASSWORD_RECOVERY') {
                    setPasswordRecovery(true);
                    setPasswordRecoveryError(null);
                }

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await checkUserRole(session.user);
                    if (event === 'SIGNED_IN') {
                        await recordLoginDay();
                    }
                } else {
                    setUserRole(null);
                }

                setLoading(false);
            }
        );

        Linking.getInitialURL().then(url => {
            if (url && mounted) {
                handleAuthUrl(url);
            }
        });

        const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
            if (mounted) {
                handleAuthUrl(url);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            linkingSubscription.remove();
        };
    }, [checkUserRole, handleAuthUrl, recordLoginDay]);

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (data?.user && !error) {
                await Promise.all([
                    checkUserRole(data.user),
                    recordLoginDay(),
                ]);
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

            const { error } = await supabase.auth.signUp({
                email,
                password,
            });

            return { error };
        } catch (error: any) {
            console.error('Sign up error:', error);
            return { error };
        } finally {
            setLoading(false);
        }
    };

    const requestPasswordReset = async (email: string) => {
        try {
            const redirectTo = Platform.OS === 'web'
                ? Linking.createURL('/update-password')
                : 'herquietplace://update-password';

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo,
            });

            return { error };
        } catch (error: any) {
            console.error('Password reset request error:', error);
            return { error };
        }
    };

    const updatePassword = async (password: string) => {
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) return { error };

            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) return { error: signOutError };

            setPasswordRecovery(false);
            setPasswordRecoveryError(null);
            return { error: null };
        } catch (error: any) {
            console.error('Password update error:', error);
            return { error };
        }
    };

    const refreshSession = async () => {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
            await checkUserRole(data.session.user);
        } else {
            setUserRole(null);
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
        requestPasswordReset,
        updatePassword,
        signOut,
        refreshSession,
        userRole,
        isAuthenticated,
        passwordRecovery,
        passwordRecoveryError,
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
