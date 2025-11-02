// app/(admin)/_layout.tsx
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLayout() {
    const { user, userRole, loading, signOut } = useAuth();
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

    // Redirect non-admin users to regular app
    if (!user || userRole !== 'admin') {
        return <Redirect href="/(tabs)" />;
    }

    return (
        <Stack screenOptions={{
            headerShown: true,
            headerStyle: {
                backgroundColor: theme.colors.accentPrimary || '#6366f1'
            },
            headerTintColor: theme.colors.textInverse || '#fff',
            headerTitleStyle: {
                fontWeight: '600',
            },
            headerRight: () => (
                <TouchableOpacity
                    onPress={signOut}
                    style={{ marginRight: 16 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name="log-out-outline"
                        size={24}
                        color={theme.colors.textInverse || '#fff'}
                    />
                </TouchableOpacity>
            )
        }}>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Admin Dashboard',
                }}
            />
            <Stack.Screen
                name="ManageAudio"
                options={{
                    title: 'Manage Audio Comforts',
                }}
            />
            <Stack.Screen
                name="ManageCuratedPrayers"
                options={{
                    title: 'Curated Prayers',
                }}
            />
            <Stack.Screen
                name="ManageDailyStrength"
                options={{
                    title: 'Daily Strength',
                }}
            />
            <Stack.Screen
                name="ManageUsers"
                options={{
                    title: 'Manage Users',
                }}
            />
            <Stack.Screen
                name="ReviewPrayers"
                options={{
                    title: 'Review Prayers',
                }}
            />
        </Stack>
    );
}