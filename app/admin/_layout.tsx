// app/admin/_layout.tsx
import { Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from 'expo-router';

export default function AdminLayout() {
    const { user } = useAuth();

    // Simple admin check - you might want to enhance this
    const isAdmin = user?.email?.includes('admin') || user?.email === 'admin@herquietplace.com';

    if (!isAdmin) {
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