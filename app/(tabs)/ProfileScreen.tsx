// app/(tabs)/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    Image,
    Switch,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { profileService, Profile } from '../../services/profileService';
import { settingsService, AppSettings } from '../../services/settingsService';

type ProfileStat = {
    label: string;
    value: number;
    icon: string;
};

type TabType = 'stats' | 'settings';

export default function ProfileScreen() {
    const theme = useTheme();
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState<ProfileStat[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('stats');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProfile, setEditingProfile] = useState<Partial<Profile>>({});
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    useEffect(() => {
        loadProfileData();
        loadSettings();
    }, []);

    const loadProfileData = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const [profileData, settingsData] = await Promise.all([
                profileService.getProfile(user.id),
                settingsService.getSettings(),
                loadProfileStats()
            ]);

            setProfile(profileData);
            setSettings(settingsData);
        } catch (error) {
            console.error('Error loading profile data:', error);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const settingsData = await settingsService.getSettings();
            setSettings(settingsData);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const loadProfileStats = async () => {
        // Simulate loading user stats - you can replace with actual data from your database
        setTimeout(() => {
            setStats([
                { label: 'Audio Listened', value: 24, icon: 'musical-notes' },
                { label: 'Favorites', value: 8, icon: 'heart' },
                { label: 'Minutes', value: 345, icon: 'time' },
                { label: 'Sessions', value: 42, icon: 'play' },
            ]);
        }, 500);
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

    const openEditModal = () => {
        setEditingProfile({
            full_name: profile?.full_name || '',
            bio: profile?.bio || '',
        });
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingProfile({});
        setSaving(false);
    };

    const handleSaveProfile = async () => {
        if (!user || !editingProfile) return;

        setSaving(true);
        try {
            const updatedProfile = await profileService.updateProfile(user.id, {
                full_name: editingProfile.full_name,
                bio: editingProfile.bio,
            });
            setProfile(updatedProfile);
            closeEditModal();
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleSettingChange = async (key: keyof AppSettings, value: boolean | string) => {
        if (!settings) return;

        try {
            const newSettings = await settingsService.updateSettings({ [key]: value });
            setSettings(newSettings);
        } catch (error) {
            console.error('Error updating setting:', error);
            Alert.alert('Error', 'Failed to update setting');
        }
    };

    const getInitials = (profile: Profile | null, email: string) => {
        if (profile?.full_name) {
            return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return email ? email.charAt(0).toUpperCase() : 'U';
    };

    const getDisplayName = (profile: Profile | null, email: string) => {
        if (profile?.full_name) return profile.full_name;
        return email ? email.split('@')[0] : 'User';
    };

    const renderStatsTab = () => (
        <View style={{ gap: theme.Spacing.md }}>
            {/* Stats Grid */}
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
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
                                alignItems: 'center',
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
                            textAlign: 'center',
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
                        flexDirection: 'row',
                        alignItems: 'center',
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
                        flexDirection: 'row',
                        alignItems: 'center',
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

    const renderSettingsTab = () => {
        if (!settings) return null;

        return (
            <View style={{ gap: theme.Spacing.md }}>
                {/* Preferences */}
                <View style={theme.card}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: theme.Spacing.md,
                    }}>
                        Preferences
                    </Text>

                    <View style={settingItemStyle(theme)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
                            <Text style={settingTextStyle(theme)}>Push Notifications</Text>
                        </View>
                        <Switch
                            value={settings.pushNotifications}
                            onValueChange={(value) => handleSettingChange('pushNotifications', value)}
                            trackColor={{ false: theme.colors.border, true: theme.colors.accentPrimary }}
                            thumbColor={theme.colors.backgroundCard}
                        />
                    </View>

                    <View style={settingItemStyle(theme)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Ionicons name="moon-outline" size={20} color={theme.colors.text} />
                            <Text style={settingTextStyle(theme)}>Dark Mode</Text>
                        </View>
                        <Switch
                            value={settings.darkMode}
                            onValueChange={(value) => handleSettingChange('darkMode', value)}
                            trackColor={{ false: theme.colors.border, true: theme.colors.accentPrimary }}
                            thumbColor={theme.colors.backgroundCard}
                        />
                    </View>

                    <View style={settingItemStyle(theme)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Ionicons name="play-circle-outline" size={20} color={theme.colors.text} />
                            <Text style={settingTextStyle(theme)}>Auto Play</Text>
                        </View>
                        <Switch
                            value={settings.autoPlay}
                            onValueChange={(value) => handleSettingChange('autoPlay', value)}
                            trackColor={{ false: theme.colors.border, true: theme.colors.accentPrimary }}
                            thumbColor={theme.colors.backgroundCard}
                        />
                    </View>

                    <View style={settingItemStyle(theme)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Ionicons name="wifi-outline" size={20} color={theme.colors.text} />
                            <Text style={settingTextStyle(theme)}>Download on Wi-Fi Only</Text>
                        </View>
                        <Switch
                            value={settings.downloadOverWifiOnly}
                            onValueChange={(value) => handleSettingChange('downloadOverWifiOnly', value)}
                            trackColor={{ false: theme.colors.border, true: theme.colors.accentPrimary }}
                            thumbColor={theme.colors.backgroundCard}
                        />
                    </View>
                </View>

                {/* Audio Quality */}
                <View style={theme.card}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: theme.Spacing.md,
                    }}>
                        Audio Quality
                    </Text>

                    {(['low', 'medium', 'high'] as const).map((quality) => (
                        <TouchableOpacity
                            key={quality}
                            style={settingItemStyle(theme)}
                            onPress={() => handleSettingChange('audioQuality', quality)}
                        >
                            <Text style={settingTextStyle(theme)}>
                                {quality.charAt(0).toUpperCase() + quality.slice(1)}
                            </Text>
                            <Ionicons
                                name={settings.audioQuality === quality ? "radio-button-on" : "radio-button-off"}
                                size={20}
                                color={settings.audioQuality === quality ? theme.colors.accentPrimary : theme.colors.textSecondary}
                            />
                        </TouchableOpacity>
                    ))}
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

                    <TouchableOpacity style={settingItemStyle(theme)}>
                        <Ionicons name="help-circle-outline" size={20} color={theme.colors.text} />
                        <Text style={settingTextStyle(theme)}>Help & Support</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={settingItemStyle(theme)}>
                        <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.text} />
                        <Text style={settingTextStyle(theme)}>Privacy Policy</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={settingItemStyle(theme)}>
                        <Ionicons name="document-text-outline" size={20} color={theme.colors.text} />
                        <Text style={settingTextStyle(theme)}>Terms of Service</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Reset Settings */}
                <TouchableOpacity
                    style={[
                        theme.button,
                        {
                            backgroundColor: 'transparent',
                            borderWidth: 1,
                            borderColor: theme.colors.warning,
                            marginTop: theme.Spacing.md,
                        }
                    ]}
                    onPress={async () => {
                        Alert.alert(
                            'Reset Settings',
                            'Are you sure you want to reset all settings to default?',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Reset',
                                    style: 'destructive',
                                    onPress: async () => {
                                        const defaultSettings = await settingsService.resetSettings();
                                        setSettings(defaultSettings);
                                        Alert.alert('Success', 'Settings reset to default');
                                    }
                                }
                            ]
                        );
                    }}
                >
                    <Ionicons name="refresh-outline" size={16} color={theme.colors.warning} />
                    <Text style={[theme.buttonText, { color: theme.colors.warning, marginLeft: theme.Spacing.sm }]}>
                        Reset to Default
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center' }]}>
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
                alignItems: 'center',
            }}>
                {/* Profile Avatar - Static for now */}
                <View style={{ position: 'relative', marginBottom: theme.Spacing.md }}>
                    <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: theme.colors.accentPrimary,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            fontSize: 32,
                            fontWeight: 'bold',
                            color: theme.colors.textInverse,
                        }}>
                            {getInitials(profile, user?.email || '')}
                        </Text>
                    </View>
                </View>

                <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: theme.colors.text,
                    marginBottom: theme.Spacing.xs,
                }}>
                    {getDisplayName(profile, user?.email || '')}
                </Text>

                {profile?.bio ? (
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary,
                        textAlign: 'center',
                        marginBottom: theme.Spacing.lg,
                        lineHeight: 20,
                    }}>
                        {profile.bio}
                    </Text>
                ) : (
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary,
                        marginBottom: theme.Spacing.lg,
                    }}>
                        {user?.email}
                    </Text>
                )}

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
                    onPress={openEditModal}
                >
                    <Text style={[theme.buttonText, { color: theme.colors.accentPrimary }]}>
                        Edit Profile
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <View style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
                marginTop: theme.Spacing.lg,
            }}>
                {(['stats', 'settings'] as TabType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={{
                            flex: 1,
                            paddingVertical: theme.Spacing.md,
                            alignItems: 'center',
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
                textAlign: 'center',
                fontSize: 12,
                color: theme.colors.textSecondary,
                marginBottom: theme.Spacing.xl,
                marginTop: theme.Spacing.md,
            }}>
                Version 1.0.0
            </Text>

            {/* Edit Profile Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeEditModal}
            >
                <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                    <View style={[{
                        paddingHorizontal: theme.Spacing.lg,
                        paddingVertical: theme.Spacing.xl,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                        backgroundColor: theme.colors.backgroundCard,
                    }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <TouchableOpacity onPress={closeEditModal} disabled={saving}>
                                <Text style={{
                                    color: saving ? theme.colors.textSecondary : theme.colors.text,
                                    fontSize: 16
                                }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
                                Edit Profile
                            </Text>

                            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
                                {saving ? (
                                    <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
                                ) : (
                                    <Text style={{
                                        color: theme.colors.accentPrimary,
                                        fontSize: 16,
                                        fontWeight: '600'
                                    }}>
                                        Save
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={{ flex: 1, padding: theme.Spacing.lg }} showsVerticalScrollIndicator={false}>
                        {/* Avatar Section - Disabled for now */}
                        <View style={{ alignItems: 'center', marginBottom: theme.Spacing.xl }}>
                            <View style={{
                                width: 100,
                                height: 100,
                                borderRadius: 50,
                                backgroundColor: theme.colors.accentPrimary,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: theme.Spacing.md,
                            }}>
                                <Text style={{
                                    fontSize: 36,
                                    fontWeight: 'bold',
                                    color: theme.colors.textInverse,
                                }}>
                                    {getInitials(profile, user?.email || '')}
                                </Text>
                            </View>
                            <Text style={{
                                color: theme.colors.textSecondary,
                                fontSize: 14,
                                textAlign: 'center',
                            }}>
                                Avatar upload coming soon
                            </Text>
                        </View>

                        {/* Name Input */}
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginBottom: theme.Spacing.sm,
                        }}>
                            Full Name
                        </Text>
                        <TextInput
                            style={[{
                                backgroundColor: theme.colors.backgroundCard,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                borderRadius: theme.BorderRadius.md,
                                padding: theme.Spacing.md,
                                fontSize: 16,
                                color: theme.colors.text,
                                marginBottom: theme.Spacing.lg,
                            }]}
                            placeholder="Enter your full name"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={editingProfile.full_name || ''}
                            onChangeText={(text) => setEditingProfile(prev => ({ ...prev, full_name: text }))}
                        />

                        {/* Bio Input */}
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginBottom: theme.Spacing.sm,
                        }}>
                            Bio
                        </Text>
                        <TextInput
                            style={[{
                                backgroundColor: theme.colors.backgroundCard,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                borderRadius: theme.BorderRadius.md,
                                padding: theme.Spacing.md,
                                fontSize: 16,
                                color: theme.colors.text,
                                minHeight: 100,
                                textAlignVertical: 'top',
                                marginBottom: theme.Spacing.lg,
                            }]}
                            placeholder="Tell us about yourself..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={editingProfile.bio || ''}
                            onChangeText={(text) => setEditingProfile(prev => ({ ...prev, bio: text }))}
                            multiline
                            numberOfLines={4}
                        />
                    </ScrollView>
                </View>
            </Modal>
        </ScrollView>
    );
}

// Helper styles
const settingItemStyle = (theme: any) => ({
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    paddingVertical: theme.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
});

const settingTextStyle = (theme: any) => ({
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.Spacing.sm,
});