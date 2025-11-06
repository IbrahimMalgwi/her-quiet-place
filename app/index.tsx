import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../constants/theme';
import { useEffect } from 'react';

export default function IndexScreen() {
    const { user, userRole, loading } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (user) {
                if (userRole === 'admin') {
                    router.replace('/admin');
                } else {
                    // Use type assertion for route groups
                    router.replace('/(tabs)' as any);
                }
            } else {
                // Redirect to welcome page when no user
                router.replace('/(auth)/welcome' as any);
            }
        }
    }, [user, userRole, loading, router]);

    // Show loading indicator
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

    // Return empty view while redirecting
    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.colors.background
        }} />
    );
}