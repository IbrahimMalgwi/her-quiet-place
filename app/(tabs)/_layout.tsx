// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';


export default function TabsLayout() {
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


    // Redirect to auth if not logged in, or to admin if admin user
    if (!user) {
        return <Redirect href="/(auth)/login" />;
    }

    if (userRole === 'admin') {
        return <Redirect href="/admin" />;
    }

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.colors.accentPrimary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderTopColor: theme.colors.border,
                    borderTopWidth: 1,
                },
                headerStyle: {
                    backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.text,
                headerTitleStyle: {
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="HomeScreen"
                options={{
                    title: 'Daily',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "home" : "home-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                    headerTitle: 'Daily Strength',
                }}
            />
            <Tabs.Screen
                name="JournalScreen"
                options={{
                    title: 'Journal',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "book" : "book-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                    headerTitle: 'My Journal',
                }}
            />
            <Tabs.Screen
                name="PrayerRoomScreen"
                options={{
                    title: 'Prayer',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "heart" : "heart-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                    headerTitle: 'Prayer Room',
                }}
            />
            <Tabs.Screen
                name="AudioRoomScreen"
                options={{
                    title: 'Audio',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "musical-notes" : "musical-notes-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                    headerTitle: 'Audio Comforts',
                }}
            />
            <Tabs.Screen
                name="ProfileScreen"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "person" : "person-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                    headerTitle: 'My Profile',
                }}
            />
        </Tabs>
    );
}