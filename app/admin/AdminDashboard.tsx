// app/admin/adminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface DashboardStats {
    totalUsers: number;
    totalAudio: number;
    totalPrayers: number;
    pendingPrayers: number;
    dailyStrengths: number;
}

export default function AdminDashboard() {
    const theme = useTheme();
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
            // Simulate API call
            setTimeout(() => {
                setStats({
                    totalUsers: 1247,
                    totalAudio: 89,
                    totalPrayers: 567,
                    pendingPrayers: 23,
                    dailyStrengths: 45,
                });
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            setLoading(false);
        }
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
                            5 new users joined today
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            2h ago
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm }}>
                        <Ionicons name="musical-notes" size={16} color={theme.colors.accentPrimary} />
                        <Text style={{ fontSize: 14, color: theme.colors.text, flex: 1 }}>
                            New audio "Evening Peace" added
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            5h ago
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm }}>
                        <Ionicons name="heart" size={16} color={theme.colors.error} />
                        <Text style={{ fontSize: 14, color: theme.colors.text, flex: 1 }}>
                            3 prayers awaiting approval
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            1d ago
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}