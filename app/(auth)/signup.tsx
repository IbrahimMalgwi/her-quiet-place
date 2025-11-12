import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../constants/theme';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
    const { signUp, user, loading: authLoading } = useAuth();
    const theme = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shouldRedirect, setShouldRedirect] = useState(false);

    // Use useEffect for navigation instead of during render
    useEffect(() => {
        if (user && !authLoading && !shouldRedirect) {
            setShouldRedirect(true);

            // Small delay to ensure component is mounted
            setTimeout(() => {
                router.replace('/(tabs)/HomeScreen');
            }, 100);
        }
    }, [user, authLoading, shouldRedirect]);

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
                <Text style={{ marginTop: theme.Spacing.md, color: theme.colors.text }}>
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
                <Text style={{ marginTop: theme.Spacing.md, color: theme.colors.text }}>
                    Redirecting...
                </Text>
            </View>
        );
    }

    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Attempting signup with:', email);
            const { error } = await signUp(email, password);

            if (error) {
                console.log('Signup error:', error);
                // Handle specific error cases
                if (error.message.includes('User already registered')) {
                    setError('An account with this email already exists');
                } else if (error.message.includes('Password should be at least')) {
                    setError('Password must be at least 6 characters long');
                } else {
                    setError(error.message);
                }
            } else {
                console.log('Signup successful');
                Alert.alert(
                    'Check Your Email',
                    'We sent you a confirmation email. Please verify your email address to continue.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.replace('/(auth)/login')
                        }
                    ]
                );
            }
        } catch (err: any) {
            console.error('Unexpected signup error:', err);
            setError('An unexpected error occurred. Please try again.');
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
                        Create Account
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        textAlign: 'center',
                        color: theme.colors.textSecondary,
                        lineHeight: 22
                    }}>
                        Join the Her Quiet Place community
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
                            style={[
                                theme.input,
                                error ? { borderColor: theme.colors.error } : {}
                            ]}
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
                            placeholder="Create a password (min. 6 characters)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                clearError();
                            }}
                            secureTextEntry
                            autoCapitalize="none"
                            editable={!loading}
                            returnKeyType="next"
                        />
                    </View>

                    {/* Confirm Password Input */}
                    <View>
                        <Text style={{
                            color: theme.colors.text,
                            fontSize: 16,
                            marginBottom: theme.Spacing.sm,
                            fontWeight: '500'
                        }}>
                            Confirm Password
                        </Text>
                        <TextInput
                            style={[
                                theme.input,
                                error ? { borderColor: theme.colors.error } : {}
                            ]}
                            placeholder="Confirm your password"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                clearError();
                            }}
                            secureTextEntry
                            autoCapitalize="none"
                            editable={!loading}
                            returnKeyType="done"
                            onSubmitEditing={handleSignUp}
                        />
                    </View>

                    {/* Password Requirements */}
                    <View style={{
                        backgroundColor: theme.colors.accentPrimary + '15',
                        padding: theme.Spacing.md,
                        borderRadius: theme.BorderRadius.md,
                    }}>
                        <Text style={{
                            color: theme.colors.accentPrimary,
                            fontSize: 12,
                            fontWeight: '500',
                            marginBottom: theme.Spacing.xs
                        }}>
                            Password Requirements:
                        </Text>
                        <Text style={{
                            color: theme.colors.textSecondary,
                            fontSize: 12,
                            lineHeight: 16
                        }}>
                            • At least 6 characters long
                        </Text>
                    </View>

                    {/* Sign Up Button */}
                    <TouchableOpacity
                        style={[
                            theme.button,
                            loading && { opacity: 0.7 },
                            { marginTop: theme.Spacing.md }
                        ]}
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.colors.textInverse} size="small" />
                        ) : (
                            <Text style={theme.buttonText}>
                                Create Account
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Sign In Link */}
                    <View style={[theme.row, {
                        justifyContent: 'center',
                        marginTop: theme.Spacing.xl
                    }]}>
                        <Text style={{
                            color: theme.colors.textSecondary,
                            fontSize: 14
                        }}>
                            Already have an account?{' '}
                        </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={{
                                    color: theme.colors.accentPrimary,
                                    fontSize: 14,
                                    fontWeight: '600'
                                }}>
                                    Sign In
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
                        textAlign: 'center',
                        lineHeight: 16
                    }}>
                        By creating an account, you agree to our Terms of Service and Privacy Policy
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}