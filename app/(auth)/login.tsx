import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const logoImage = require('../../assets/images/icon-1024-1024.png');

export default function LoginScreen() {
    const { signIn, user, userRole, loading: authLoading } = useAuth();
    const theme = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || authLoading) return;

        router.replace(userRole === 'admin' ? '/admin' : '/(tabs)/HomeScreen');
    }, [authLoading, user, userRole]);

    if (user && !authLoading) return null;

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
                const isInvalidCredentials =
                    error.code === 'invalid_credentials'
                    || error.message?.toLowerCase().includes('invalid login credentials');
                const message = isInvalidCredentials
                    ? 'Incorrect email or password. Please try again.'
                    : error.message;

                setError(message);

                if (isInvalidCredentials) {
                    Alert.alert('Unable to Sign In', message);
                }
            }
            // Auth state change will handle redirect automatically
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
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
            <View style={{
                position: 'absolute',
                top: -120,
                right: -90,
                width: 250,
                height: 250,
                borderRadius: 125,
                backgroundColor: theme.colors.accentSecondary + '45',
            }} />
            <View style={{
                position: 'absolute',
                bottom: -130,
                left: -100,
                width: 280,
                height: 280,
                borderRadius: 140,
                backgroundColor: theme.colors.white + '70',
            }} />
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
                    <Ionicons name="arrow-back" size={24} color={theme.colors.accentDeep} />
                </TouchableOpacity>

                {/* Header Section */}
                <View style={{
                    alignItems: 'center'
                }}>
                    <View style={{
                        width: 104,
                        height: 104,
                        borderRadius: 32,
                        backgroundColor: theme.colors.backgroundCard,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: theme.colors.white,
                        shadowColor: theme.colors.accentDeep,
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.12,
                        shadowRadius: 20,
                        elevation: 5,
                        marginBottom: theme.Spacing.lg,
                    }}>
                        <Image
                            source={logoImage}
                            resizeMode="contain"
                            accessibilityLabel="Her Quiet Place logo"
                            style={{
                                width: 86,
                                height: 86,
                                borderRadius: 24,
                            }}
                        />
                    </View>
                    <Text style={{
                        fontSize: 44,
                        fontWeight: '400',
                        textAlign: 'center',
                        color: theme.colors.accentPrimary,
                        marginBottom: theme.Spacing.xs,
                        fontStyle: 'italic',
                        fontFamily: Platform.select({ ios: 'Snell Roundhand', web: 'cursive' }),
                    }}>
                        Her Quiet Place
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        textAlign: 'center',
                        color: theme.colors.textSecondary,
                        lineHeight: 22,
                        marginBottom: theme.Spacing.xl,
                    }}>
                        Sign in to continue your quiet spiritual rhythm
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
                <View style={{
                    gap: theme.Spacing.lg,
                    backgroundColor: theme.colors.backgroundCard + 'F2',
                    borderRadius: theme.BorderRadius.xl,
                    padding: theme.Spacing.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.white,
                    shadowColor: theme.colors.accentDeep,
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.09,
                    shadowRadius: 22,
                    elevation: 4,
                }}>
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
                        <View style={{ position: 'relative' }}>
                            <Ionicons
                                name="mail-outline"
                                size={18}
                                color={theme.colors.accentPrimary}
                                style={{ position: 'absolute', left: theme.Spacing.md, top: 17, zIndex: 1 }}
                            />
                            <TextInput
                                style={[theme.input, { paddingLeft: 46 }]}
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
                        <View style={{ position: 'relative' }}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={18}
                                color={theme.colors.accentPrimary}
                                style={{ position: 'absolute', left: theme.Spacing.md, top: 17, zIndex: 1 }}
                            />
                            <TextInput
                                style={[
                                    theme.input,
                                    { paddingLeft: 46 },
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
                    </View>

                    <Link href="/(auth)/forgot-password" asChild>
                        <TouchableOpacity style={{ alignSelf: 'flex-end' }}>
                            <Text style={{
                                color: theme.colors.accentPrimary,
                                fontSize: 14,
                                fontWeight: '600'
                            }}>
                                Forgot Password?
                            </Text>
                        </TouchableOpacity>
                    </Link>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[
                            theme.button,
                            loading && { opacity: 0.7 },
                            { marginTop: theme.Spacing.md, minHeight: 54 }
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
                        marginTop: theme.Spacing.md
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
                    marginTop: theme.Spacing.xl,
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
