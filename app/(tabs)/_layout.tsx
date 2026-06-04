// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';

import { useTheme } from '../../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
    const theme = useTheme();


    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.white,
                tabBarInactiveTintColor: theme.colors.white + 'D0',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                    marginTop: 2,
                },
                tabBarItemStyle: {
                    paddingTop: 8,
                },
                tabBarStyle: {
                    height: 86,
                    paddingTop: 8,
                    paddingBottom: 12,
                    paddingHorizontal: 6,
                    backgroundColor: theme.colors.accentPrimary,
                    borderTopWidth: 0,
                    borderTopLeftRadius: 30,
                    borderTopRightRadius: 30,
                    position: 'absolute',
                    shadowColor: theme.colors.accentDeep,
                    shadowOffset: { width: 0, height: -6 },
                    shadowOpacity: 0.14,
                    shadowRadius: 18,
                    elevation: 16,
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
                name="HomeScreen"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "home" : "home-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="AudioRoomScreen"
                options={{
                    title: 'Audio',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "headset" : "headset-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="PrayerRoomScreen"
                options={{
                    title: 'Prayer',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="hands-pray"
                            size={size}
                            color={color}
                        />
                    ),
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
                }}
            />
            <Tabs.Screen
                name="FavoritesScreen"
                options={{
                    href: null,
                    title: 'Saved',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "bookmark" : "bookmark-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                    headerTitle: 'My Favorites',
                }}
            />
        </Tabs>
    );
}
