// app/(tabs)/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    StyleSheet,
    ViewStyle,
    TextStyle
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

type ProfileStat = {
    label: string;
    value: number;
    icon: string;
};

// Helper function for setting items with proper typing
const createSettingItemStyle = (theme: any): ViewStyle => ({
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    paddingVertical: theme.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
});

const createSettingTextStyle = (theme: any): TextStyle => ({
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.Spacing.sm,
});

export default function ProfileScreen() {
    const theme = useTheme();
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<ProfileStat[]>([]);
    const [activeTab, setActiveTab] = useState<'stats' | 'settings'>('stats');

    useEffect(() => {
        loadProfileStats();
    }, []);

    const loadProfileStats = async () => {
        setLoading(true);
        try {
            // Simulate loading user stats
            setTimeout(() => {
                setStats([
                    { label: 'Audio Listened', value: 24, icon: 'musical-notes' },
                    { label: 'Favorites', value: 8, icon: 'heart' },
                    { label: 'Minutes', value: 345, icon: 'time' },
                    { label: 'Sessions', value: 42, icon: 'play' },
                ]);
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error loading profile stats:', error);
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                    }
                }
            ]
        );
    };

    const handleEditProfile = () => {
        Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
    };

    const getInitials = (email: string) => {
        return email ? email.charAt(0).toUpperCase() : 'U';
    };

    const getDisplayName = (email: string) => {
        if (!email) return 'User';
        return email.split('@')[0];
    };

    const renderStatsTab = () => (
        <View style={{ gap: theme.Spacing.md }}>
            {/* Stats Grid */}
            <View style={{
                flexDirection: 'row' as 'row',
                flexWrap: 'wrap' as 'wrap',
                gap: theme.Spacing.sm,
                marginBottom: theme.Spacing.lg,
            }}>
                {stats.map((stat) => (
                    <View
                        key={stat.label}
                        style={[
                            theme.card,
                            {
                                flex: 1,
                                minWidth: '45%',
                                alignItems: 'center' as 'center',
                                padding: theme.Spacing.md,
                            }
                        ]}
                    >
                        <Ionicons
                            name={stat.icon as any}
                            size={24}
                            color={theme.colors.accentPrimary}
                        />
                        <Text style={{
                            fontSize: 20,
                            fontWeight: 'bold',
                            color: theme.colors.text,
                            marginVertical: theme.Spacing.xs,
                        }}>
                            {stat.value}
                        </Text>
                        <Text style={{
                            fontSize: 12,
                            color: theme.colors.textSecondary,
                            textAlign: 'center' as 'center',
                        }}>
                            {stat.label}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Recent Activity */}
            <View style={theme.card}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginBottom: theme.Spacing.md,
                }}>
                    Recent Activity
                </Text>
                <View style={{ gap: theme.Spacing.sm }}>
                    <View style={{
                        flexDirection: 'row' as 'row',
                        alignItems: 'center' as 'center',
                        gap: theme.Spacing.sm
                    }}>
                        <Ionicons name="play-circle" size={16} color={theme.colors.success} />
                        <Text style={{ fontSize: 14, color: theme.colors.text, flex: 1 }}>
                            Completed Morning Peace
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            2h ago
                        </Text>
                    </View>
                    <View style={{
                        flexDirection: 'row' as 'row',
                        alignItems: 'center' as 'center',
                        gap: theme.Spacing.sm
                    }}>
                        <Ionicons name="heart" size={16} color={theme.colors.accentPrimary} />
                        <Text style={{ fontSize: 14, color: theme.colors.text, flex: 1 }}>
                            Added to favorites
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            1d ago
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderSettingsTab = () => (
        <View style={{ gap: theme.Spacing.md }}>
            {/* Settings Options */}
            <View style={theme.card}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginBottom: theme.Spacing.md,
                }}>
                    Preferences
                </Text>

                <TouchableOpacity style={createSettingItemStyle(theme)}>
                    <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
                    <Text style={createSettingTextStyle(theme)}>Push Notifications</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={createSettingItemStyle(theme)}>
                    <Ionicons name="volume-medium-outline" size={20} color={theme.colors.text} />
                    <Text style={createSettingTextStyle(theme)}>Audio Quality</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={createSettingItemStyle(theme)}>
                    <Ionicons name="moon-outline" size={20} color={theme.colors.text} />
                    <Text style={createSettingTextStyle(theme)}>Dark Mode</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Support */}
            <View style={theme.card}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginBottom: theme.Spacing.md,
                }}>
                    Support
                </Text>

                <TouchableOpacity style={createSettingItemStyle(theme)}>
                    <Ionicons name="help-circle-outline" size={20} color={theme.colors.text} />
                    <Text style={createSettingTextStyle(theme)}>Help & Support</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={createSettingItemStyle(theme)}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.text} />
                    <Text style={createSettingTextStyle(theme)}>Privacy Policy</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={createSettingItemStyle(theme)}>
                    <Ionicons name="document-text-outline" size={20} color={theme.colors.text} />
                    <Text style={createSettingTextStyle(theme)}>Terms of Service</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[theme.screen, { justifyContent: 'center' as 'center', alignItems: 'center' as 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                <Text style={{ marginTop: theme.Spacing.md, color: theme.colors.text }}>
                    Loading profile...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={theme.screen} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={{
                backgroundColor: theme.colors.accentPrimary + '20',
                padding: theme.Spacing.xl,
                alignItems: 'center' as 'center',
            }}>
                {/* Profile Avatar */}
                <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: theme.colors.accentPrimary,
                    justifyContent: 'center' as 'center',
                    alignItems: 'center' as 'center',
                    marginBottom: theme.Spacing.md,
                }}>
                    <Text style={{
                        fontSize: 32,
                        fontWeight: 'bold',
                        color: theme.colors.textInverse,
                    }}>
                        {getInitials(user?.email || '')}
                    </Text>
                </View>

                <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: theme.colors.text,
                    marginBottom: theme.Spacing.xs,
                }}>
                    {getDisplayName(user?.email || '')}
                </Text>

                <Text style={{
                    fontSize: 14,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.Spacing.lg,
                }}>
                    {user?.email}
                </Text>

                <TouchableOpacity
                    style={[
                        theme.button,
                        {
                            backgroundColor: 'transparent',
                            borderWidth: 1,
                            borderColor: theme.colors.accentPrimary,
                            paddingHorizontal: theme.Spacing.lg,
                        }
                    ]}
                    onPress={handleEditProfile}
                >
                    <Text style={[theme.buttonText, { color: theme.colors.accentPrimary }]}>
                        Edit Profile
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <View style={{
                flexDirection: 'row' as 'row',
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
                marginTop: theme.Spacing.lg,
            }}>
                {(['stats', 'settings'] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={{
                            flex: 1,
                            paddingVertical: theme.Spacing.md,
                            alignItems: 'center' as 'center',
                            borderBottomWidth: 2,
                            borderBottomColor: activeTab === tab ? theme.colors.accentPrimary : 'transparent',
                        }}
                    >
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: activeTab === tab ? theme.colors.accentPrimary : theme.colors.textSecondary,
                        }}>
                            {tab === 'stats' ? 'Statistics' : 'Settings'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            <View style={{ padding: theme.Spacing.md }}>
                {activeTab === 'stats' ? renderStatsTab() : renderSettingsTab()}
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
                style={[
                    theme.button,
                    {
                        margin: theme.Spacing.md,
                        marginTop: theme.Spacing.xl,
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: theme.colors.error,
                    }
                ]}
                onPress={handleSignOut}
            >
                <Ionicons name="log-out-outline" size={16} color={theme.colors.error} />
                <Text style={[theme.buttonText, { color: theme.colors.error, marginLeft: theme.Spacing.sm }]}>
                    Sign Out
                </Text>
            </TouchableOpacity>

            {/* App Version */}
            <Text style={{
                textAlign: 'center' as 'center',
                fontSize: 12,
                color: theme.colors.textSecondary,
                marginBottom: theme.Spacing.xl,
                marginTop: theme.Spacing.md,
            }}>
                Version 1.0.0
            </Text>
        </ScrollView>
    );
}