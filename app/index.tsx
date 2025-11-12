// app/index.tsx
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, Text } from 'react-native'; // Added Text import
import { useTheme } from '../constants/theme';
import { useEffect, useState } from 'react';

export default function IndexScreen() {
    const { user, userRole, loading } = useAuth();
    const theme = useTheme();
    const router = useRouter();
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        // Only redirect once when auth state is determined
        if (!loading && !redirecting) {
            setRedirecting(true);

            // Small delay to ensure router is ready
            const timer = setTimeout(() => {
                if (user) {
                    console.log('User authenticated, redirecting to:', userRole);
                    if (userRole === 'admin') {
                        router.replace('/admin');
                    } else {
                        router.replace('/(tabs)/HomeScreen');
                    }
                } else {
                    console.log('No user, redirecting to welcome');
                    router.replace('/(auth)/welcome');
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [user, userRole, loading, redirecting, router]);

    // Show loading indicator during initial auth check
    if (loading || redirecting) {
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
                    color: theme.colors.text,
                    fontSize: 16
                }}>
                    {loading ? 'Checking authentication...' : 'Redirecting...'}
                </Text>
            </View>
        );
    }

    // Safety fallback - empty view
    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.colors.background
        }} />
    );
}