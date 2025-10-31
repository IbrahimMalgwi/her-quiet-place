// app/index.tsx
import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../constants/theme';

export default function IndexScreen() {
    const { user, loading } = useAuth();
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

    // Redirect based on authentication status
    if (user) {
        return <Redirect href="/(tabs)" />;
    } else {
        return <Redirect href="/(auth)/login" />;
    }
}