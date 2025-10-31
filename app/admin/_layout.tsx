// app/Admin/_layout.tsx
import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../../constants/theme';

export default function AdminLayout() {
    const { session, profile, loading } = useAuth();

    if (loading)
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator />
            </View>
        );

    if (!session) return <Redirect href="/(auth)/login" />;

    // If not admin, send them to user tabs
    if (profile?.role !== 'admin') return <Redirect href="/(tabs)" />;

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.accentPrimary,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarStyle: { backgroundColor: Colors.backgroundSecondary },
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
            <Tabs.Screen name="manage-daily-strength" options={{ title: 'Daily' }} />
            <Tabs.Screen name="manage-audio" options={{ title: 'Audio' }} />
            <Tabs.Screen name="review-prayers" options={{ title: 'Prayers' }} />
            <Tabs.Screen name="manage-users" options={{ title: 'Users' }} />
        </Tabs>
    );
}
