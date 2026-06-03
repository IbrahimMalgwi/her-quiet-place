// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, useTheme } from '../constants/theme';
import ErrorBoundary from '../components/ErrorBoundary';
import InactivitySessionManager from '../components/InactivitySessionManager';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutContent() {
    const { user, loading, userRole, passwordRecovery } = useAuth();
    const theme = useTheme();

    useEffect(() => {
        async function hideSplash() {
            if (!loading) {
                try {
                    await SplashScreen.hideAsync();
                } catch (error) {
                    console.warn('Error hiding splash screen:', error);
                }
            }
        }

        hideSplash();
    }, [loading]);

    // Show loading indicator while checking auth state
    if (loading) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.colors.background
            }}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
            </View>
        );
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'fade',
            }}
        >
            {!user || passwordRecovery ? (
                // User is not authenticated - show auth flow
                <Stack.Screen
                    name="(auth)"
                    options={{ animation: 'fade' }}
                />
            ) : userRole === 'admin' ? (
                // User is admin - show admin flow
                <Stack.Screen
                    name="admin"
                    options={{ animation: 'fade' }}
                />
            ) : (
                // User is regular user - show tabs flow
                <Stack.Screen
                    name="(tabs)"
                    options={{ animation: 'fade' }}
                />
            )}

            {/* Keep these for unmatched routes and index */}
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="[...unmatched]" options={{ animation: 'none' }} />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <ErrorBoundary>
                <AuthProvider>
                    <InactivitySessionManager>
                        <RootLayoutContent />
                    </InactivitySessionManager>
                </AuthProvider>
            </ErrorBoundary>
        </ThemeProvider>
    );
}
