// app/index.tsx
import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../constants/theme';

export default function Index() {
    const { user, loading, userRole } = useAuth();
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

    // Redirect based on auth state
    if (!user) {
        return <Redirect href="/(auth)/welcome" />;
    }

    if (userRole === 'admin') {
        return <Redirect href="/admin" />;
    }

    return <Redirect href="/(tabs)/HomeScreen" />;
}