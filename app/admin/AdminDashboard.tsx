// app/admin/adminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { adminService, DashboardStats } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
    const theme = useTheme();
    const { signOut, user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalAudio: 0,
        totalPrayers: 0,
        pendingPrayers: 0,
        dailyStrengths: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardStats();
    }, []);

    const loadDashboardStats = async () => {
        try {
            const dashboardStats = await adminService.getDashboardStats();
            setStats(dashboardStats);
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            Alert.alert('Error', 'Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                            // FIX: Use the correct route format
                            router.replace('/(auth)/login'); // or whatever your auth route is
                        } catch (error) {
                            console.error('Error during logout:', error);
                            Alert.alert('Error', 'Failed to logout');
                        }
                    }
                }
            ]
        );
    };

    const StatCard = ({ title, value, icon, color, onPress }: any) => (
        <TouchableOpacity
            onPress={onPress}
            style={[
                theme.card,
                {
                    flex: 1,
                    minWidth: '45%',
                    alignItems: 'center',
                    padding: theme.Spacing.lg,
                    backgroundColor: color + '10',
                    borderLeftWidth: 4,
                    borderLeftColor: color,
                }
            ]}
        >
            <Ionicons name={icon} size={32} color={color} />
            <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: theme.colors.text,
                marginVertical: theme.Spacing.sm,
            }}>
                {value}
            </Text>
            <Text style={{
                fontSize: 12,
                color: theme.colors.textSecondary,
                textAlign: 'center',
            }}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    const QuickAction = ({ title, description, icon, route, color }: any) => (
        <TouchableOpacity
            onPress={() => router.push(route)}
            style={[
                theme.card,
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: theme.Spacing.lg,
                    marginBottom: theme.Spacing.md,
                    backgroundColor: color + '10',
                    borderLeftWidth: 4,
                    borderLeftColor: color,
                }
            ]}
        >
            <Ionicons name={icon} size={24} color={color} style={{ marginRight: theme.Spacing.md }} />
            <View style={{ flex: 1 }}>
                <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginBottom: 4,
                }}>
                    {title}
                </Text>
                <Text style={{
                    fontSize: 12,
                    color: theme.colors.textSecondary,
                }}>
                    {description}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                <Text style={{ marginTop: theme.Spacing.md, color: theme.colors.text }}>
                    Loading dashboard...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={theme.screen} contentContainerStyle={{ padding: theme.Spacing.md }}>
            {/* Header with Welcome and Logout */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: theme.Spacing.xl,
            }}>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: 28,
                        fontWeight: 'bold',
                        color: theme.colors.text,
                        marginBottom: theme.Spacing.xs,
                    }}>
                        Admin Dashboard
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary,
                    }}>
                        Welcome back, {user?.email || 'Admin'}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={handleLogout}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: theme.Spacing.md,
                        paddingVertical: theme.Spacing.sm,
                        backgroundColor: theme.colors.error + '15',
                        borderRadius: theme.BorderRadius.md,
                        borderWidth: 1,
                        borderColor: theme.colors.error + '30',
                    }}
                >
                    <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
                    <Text style={{
                        marginLeft: theme.Spacing.sm,
                        color: theme.colors.error,
                        fontWeight: '600',
                        fontSize: 14,
                    }}>
                        Logout
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Stats Grid */}
            <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: theme.colors.text,
                marginBottom: theme.Spacing.lg,
            }}>
                Overview
            </Text>

            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: theme.Spacing.md,
                marginBottom: theme.Spacing.xl,
            }}>
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon="people"
                    color="#6366f1"
                    onPress={() => router.push('/admin/ManageUsers')}
                />
                <StatCard
                    title="Audio Content"
                    value={stats.totalAudio}
                    icon="musical-notes"
                    color="#10b981"
                    onPress={() => router.push('/admin/ManageAudio')}
                />
                <StatCard
                    title="Total Prayers"
                    value={stats.totalPrayers}
                    icon="heart"
                    color="#ef4444"
                    onPress={() => router.push('/admin/ReviewPrayers')}
                />
                <StatCard
                    title="Pending Prayers"
                    value={stats.pendingPrayers}
                    icon="time"
                    color="#f59e0b"
                    onPress={() => router.push('/admin/ReviewPrayers')}
                />
            </View>

            {/* Quick Actions */}
            <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: theme.colors.text,
                marginBottom: theme.Spacing.lg,
            }}>
                Quick Actions
            </Text>

            <QuickAction
                title="Manage Audio Content"
                description="Add, edit, or remove audio comforts"
                icon="musical-notes"
                route="/admin/ManageAudio"
                color="#10b981"
            />

            <QuickAction
                title="Post Daily Strength"
                description="Create new daily inspiration"
                icon="calendar"
                route="/admin/ManageDailyStrength"
                color="#6366f1"
            />

            <QuickAction
                title="Review Prayers"
                description="Approve community prayers"
                icon="heart"
                route="/admin/ReviewPrayers"
                color="#ef4444"
            />

            <QuickAction
                title="Manage Users"
                description="View and manage user accounts"
                icon="people"
                route="/admin/ManageUsers"
                color="#8b5cf6"
            />

            {/* Recent Activity */}
            <View style={[theme.card, { marginTop: theme.Spacing.lg }]}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginBottom: theme.Spacing.md,
                }}>
                    Recent Activity
                </Text>

                <View style={{ gap: theme.Spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm }}>
                        <Ionicons name="person-add" size={16} color={theme.colors.success} />
                        <Text style={{ fontSize: 14, color: theme.colors.text, flex: 1 }}>
                            {stats.totalUsers} total users registered
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm }}>
                        <Ionicons name="musical-notes" size={16} color={theme.colors.accentPrimary} />
                        <Text style={{ fontSize: 14, color: theme.colors.text, flex: 1 }}>
                            {stats.totalAudio} audio files available
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm }}>
                        <Ionicons name="heart" size={16} color={theme.colors.error} />
                        <Text style={{ fontSize: 14, color: theme.colors.text, flex: 1 }}>
                            {stats.pendingPrayers} prayers awaiting approval
                        </Text>
                    </View>
                </View>
            </View>

            {/* Refresh Button */}
            <TouchableOpacity
                onPress={loadDashboardStats}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: theme.Spacing.md,
                    backgroundColor: theme.colors.accentPrimary + '15',
                    borderRadius: theme.BorderRadius.md,
                    marginTop: theme.Spacing.xl,
                    borderWidth: 1,
                    borderColor: theme.colors.accentPrimary + '30',
                }}
            >
                <Ionicons name="refresh" size={18} color={theme.colors.accentPrimary} />
                <Text style={{
                    marginLeft: theme.Spacing.sm,
                    color: theme.colors.accentPrimary,
                    fontWeight: '600',
                    fontSize: 14,
                }}>
                    Refresh Dashboard
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}