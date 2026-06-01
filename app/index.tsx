// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../constants/theme';

export default function Index() {
    const { user, loading, userRole, passwordRecovery } = useAuth();
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

    if (passwordRecovery) {
        return <Redirect href="/(auth)/update-password" />;
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
