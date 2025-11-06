import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../constants/theme';

function RootLayoutNav() {
    const { user, userRole, loading } = useAuth();
    const theme = useTheme();

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
        <Stack screenOptions={{ headerShown: false }}>
            {!user ? (
                // Not authenticated - show welcome and auth screens
                <Stack.Screen name="(auth)" />
            ) : userRole === 'admin' ? (
                // Admin user - show admin screens
                <Stack.Screen name="(admin)" />
            ) : (
                // Regular user - show user tabs
                <Stack.Screen name="(tabs)" />
            )}
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}