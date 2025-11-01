// app/admin/_layout.tsx
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../constants/theme';



export default function AdminLayout() {
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



    // Redirect non-admin users to regular app
    if (!user || userRole !== 'admin') {
        return <Redirect href="/(tabs)" />;
    }

    return (
        <Stack screenOptions={{ headerShown: true }}>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Admin Dashboard',
                    headerStyle: { backgroundColor: '#6366f1' },
                    headerTintColor: '#fff',
                }}
            />
            <Stack.Screen
                name="adminDashboard"
                options={{
                    title: 'Dashboard Overview',
                    headerStyle: { backgroundColor: '#6366f1' },
                    headerTintColor: '#fff',
                }}
            />
            <Stack.Screen
                name="ManageAudio"
                options={{
                    title: 'Manage Audio',
                    headerStyle: { backgroundColor: '#6366f1' },
                    headerTintColor: '#fff',
                }}
            />
            <Stack.Screen
                name="ManageDailyStrength"
                options={{
                    title: 'Daily Strength',
                    headerStyle: { backgroundColor: '#6366f1' },
                    headerTintColor: '#fff',
                }}
            />
            <Stack.Screen
                name="ManageUsers"
                options={{
                    title: 'Manage Users',
                    headerStyle: { backgroundColor: '#6366f1' },
                    headerTintColor: '#fff',
                }}
            />
            <Stack.Screen
                name="ReviewPrayers"
                options={{
                    title: 'Review Prayers',
                    headerStyle: { backgroundColor: '#6366f1' },
                    headerTintColor: '#fff',
                }}
            />
        </Stack>
    );
}