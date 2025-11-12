import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const { signIn, user, userRole, loading: authLoading } = useAuth();
    const theme = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shouldRedirect, setShouldRedirect] = useState(false);

    // Use useEffect for navigation instead of during render
    useEffect(() => {
        if (user && !authLoading && !shouldRedirect) {
            console.log('User authenticated, role:', userRole);
            setShouldRedirect(true);

            // Small delay to ensure component is mounted
            setTimeout(() => {
                if (userRole === 'admin') {
                    router.replace('/admin' as any);
                } else {
                    // Navigate to specific tab screen, not the layout
                    router.replace('/(tabs)/HomeScreen' as any);
                }
            }, 100);
        }
    }, [user, userRole, authLoading, shouldRedirect]);

    // Show loading while checking auth state
    if (authLoading) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.colors.background
            }}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                <Text style={{
                    marginTop: theme.Spacing.md,
                    color: theme.colors.text
                }}>
                    Checking authentication...
                </Text>
            </View>
        );
    }

    // Show loading while redirecting
    if (shouldRedirect) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.colors.background
            }}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                <Text style={{
                    marginTop: theme.Spacing.md,
                    color: theme.colors.text
                }}>
                    Redirecting...
                </Text>
            </View>
        );
    }

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await signIn(email, password);

            if (error) {
                setError(error.message);
            }
            // Auth state change will handle redirect automatically via useEffect
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const clearError = () => {
        if (error) setError(null);
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'center',
                    padding: theme.Spacing.xl
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Back Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        position: 'absolute',
                        top: Platform.OS === 'ios' ? 60 : 40,
                        left: theme.Spacing.lg,
                        zIndex: 10,
                        padding: theme.Spacing.sm,
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>

                {/* Header Section */}
                <View style={{
                    marginBottom: theme.Spacing.xxl,
                    alignItems: 'center'
                }}>
                    <Text style={{
                        fontSize: 32,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: theme.colors.text,
                        marginBottom: theme.Spacing.sm
                    }}>
                        Welcome Back
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        textAlign: 'center',
                        color: theme.colors.textSecondary,
                        lineHeight: 22
                    }}>
                        Sign in to continue your spiritual journey
                    </Text>
                </View>

                {/* Error Message */}
                {error && (
                    <View style={{
                        backgroundColor: theme.colors.error + '20',
                        padding: theme.Spacing.md,
                        borderRadius: theme.BorderRadius.md,
                        marginBottom: theme.Spacing.lg,
                        borderLeftWidth: 4,
                        borderLeftColor: theme.colors.error,
                    }}>
                        <Text style={{
                            color: theme.colors.error,
                            fontSize: 14,
                            lineHeight: 18
                        }}>
                            {error}
                        </Text>
                    </View>
                )}

                {/* Form Section */}
                <View style={{ gap: theme.Spacing.lg }}>
                    {/* Email Input */}
                    <View>
                        <Text style={{
                            color: theme.colors.text,
                            fontSize: 16,
                            marginBottom: theme.Spacing.sm,
                            fontWeight: '500'
                        }}>
                            Email
                        </Text>
                        <TextInput
                            style={theme.input}
                            placeholder="Enter your email"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                clearError();
                            }}
                            autoCapitalize="none"
                            autoComplete="email"
                            keyboardType="email-address"
                            editable={!loading}
                            returnKeyType="next"
                        />
                    </View>

                    {/* Password Input */}
                    <View>
                        <Text style={{
                            color: theme.colors.text,
                            fontSize: 16,
                            marginBottom: theme.Spacing.sm,
                            fontWeight: '500'
                        }}>
                            Password
                        </Text>
                        <TextInput
                            style={[
                                theme.input,
                                error ? { borderColor: theme.colors.error } : {}
                            ]}
                            placeholder="Enter your password"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                clearError();
                            }}
                            secureTextEntry
                            autoCapitalize="none"
                            editable={!loading}
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                        />
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[
                            theme.button,
                            loading && { opacity: 0.7 },
                            { marginTop: theme.Spacing.md }
                        ]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.colors.textInverse} size="small" />
                        ) : (
                            <Text style={theme.buttonText}>
                                Sign In
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <View style={[theme.row, {
                        justifyContent: 'center',
                        marginTop: theme.Spacing.xl
                    }]}>
                        <Text style={{
                            color: theme.colors.textSecondary,
                            fontSize: 14
                        }}>
                            Don&#39;t have an account?{' '}
                        </Text>
                        <Link href="/(auth)/signup" asChild>
                            <TouchableOpacity>
                                <Text style={{
                                    color: theme.colors.accentPrimary,
                                    fontSize: 14,
                                    fontWeight: '600'
                                }}>
                                    Sign Up
                                </Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                {/* App Info Footer */}
                <View style={{
                    marginTop: theme.Spacing.xxl,
                    alignItems: 'center'
                }}>
                    <Text style={{
                        color: theme.colors.textSecondary,
                        fontSize: 12,
                        textAlign: 'center'
                    }}>
                        Her Quiet Place - Your spiritual sanctuary
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}