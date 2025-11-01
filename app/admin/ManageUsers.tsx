// app/admin/ManageUsers.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    Switch,
    RefreshControl,
    ViewStyle,
    TextStyle
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { adminUserService, AdminUser } from '../../services/adminUserService';

// Helper functions for proper typing
const createStatRowStyle = (theme: any): ViewStyle => ({
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    paddingVertical: theme.Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
});

const createStatLabelStyle = (theme: any): TextStyle => ({
    fontSize: 14,
    color: theme.colors.text,
});

const createStatValueStyle = (theme: any): TextStyle => ({
    fontSize: 14,
    fontWeight: '600' as '600',
    color: theme.colors.accentPrimary,
});

const createInfoRowStyle = (theme: any): ViewStyle => ({
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    paddingVertical: theme.Spacing.sm,
});

const createInfoLabelStyle = (theme: any): TextStyle => ({
    fontSize: 14,
    color: theme.colors.textSecondary,
});

const createInfoValueStyle = (theme: any): TextStyle => ({
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500' as '500',
});

const createActionButtonStyle = (theme: any): ViewStyle => ({
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    padding: theme.Spacing.md,
    borderRadius: theme.BorderRadius.md,
    gap: theme.Spacing.sm,
});

const createActionButtonTextStyle = (theme: any): TextStyle => ({
    fontSize: 14,
    fontWeight: '600' as '600',
});

export default function ManageUsers() {
    const theme = useTheme();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'admin'>('all');

    // User actions state
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const usersData = await adminUserService.getUsers();
            setUsers(usersData);
        } catch (error) {
            console.error('Error loading users:', error);
            Alert.alert('Error', 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadUsers();
    };

    const openUserDetails = (user: AdminUser) => {
        setSelectedUser(user);
        setModalVisible(true);
    };

    // Filter and search users
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter =
            filter === 'all' ? true :
                filter === 'active' ? user.is_active :
                    filter === 'inactive' ? !user.is_active :
                        filter === 'admin' ? user.is_admin : true;

        return matchesSearch && matchesFilter;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatLastSeen = (dateString?: string) => {
        if (!dateString) return 'Never';

        const now = new Date();
        const lastSeen = new Date(dateString);
        const diffDays = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    const toggleUserStatus = async (user: AdminUser) => {
        setActionLoading(user.id);
        try {
            await adminUserService.setUserActiveStatus(user.id, !user.is_active);
            const updatedUsers = await adminUserService.getUsers();
            setUsers(updatedUsers);
            setActionLoading(null);
            Alert.alert(
                'Success',
                !user.is_active
                    ? 'User activated successfully!'
                    : 'User deactivated successfully!'
            );
        } catch (error) {
            console.error('Error toggling user status:', error);
            Alert.alert('Error', 'Failed to update user status');
            setActionLoading(null);
        }
    };

    const toggleAdminStatus = async (user: AdminUser) => {
        if (user.email === 'admin@herquietplace.com') {
            Alert.alert('Error', 'Cannot modify primary admin account');
            return;
        }

        setActionLoading(user.id);
        try {
            await adminUserService.updateUserRole(user.id, user.is_admin ? 'user' : 'admin');
            const updatedUsers = await adminUserService.getUsers();
            setUsers(updatedUsers);
            setActionLoading(null);
            Alert.alert(
                'Success',
                !user.is_admin
                    ? 'User granted admin privileges!'
                    : 'Admin privileges removed!'
            );
        } catch (error) {
            console.error('Error toggling admin status:', error);
            Alert.alert('Error', 'Failed to update admin status');
            setActionLoading(null);
        }
    };

    const handleDeleteUser = (user: AdminUser) => {
        if (user.email === 'admin@herquietplace.com') {
            Alert.alert('Error', 'Cannot delete primary admin account');
            return;
        }

        Alert.alert(
            'Delete User',
            `Are you sure you want to delete ${user.profile?.full_name || user.email}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteUser(user.id)
                }
            ]
        );
    };

    const deleteUser = async (userId: string) => {
        setActionLoading(userId);
        try {
            await adminUserService.deleteUser(userId);
            const updatedUsers = await adminUserService.getUsers();
            setUsers(updatedUsers);
            setActionLoading(null);
            setModalVisible(false);
            Alert.alert('Success', 'User deleted successfully!');
        } catch (error) {
            console.error('Error deleting user:', error);
            Alert.alert('Error', 'Failed to delete user');
            setActionLoading(null);
        }
    };

    const UserCard = ({ user }: { user: AdminUser }) => (
        <TouchableOpacity
            onPress={() => openUserDetails(user)}
            style={[
                theme.card,
                {
                    marginBottom: theme.Spacing.md,
                    opacity: user.is_active ? 1 : 0.6,
                }
            ]}
        >
            <View style={{
                flexDirection: 'row' as 'row',
                justifyContent: 'space-between' as 'space-between',
                alignItems: 'flex-start' as 'flex-start'
            }}>
                <View style={{ flex: 1 }}>
                    {/* User Info */}
                    <View style={{
                        flexDirection: 'row' as 'row',
                        alignItems: 'center' as 'center',
                        marginBottom: 8
                    }}>
                        <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: theme.colors.accentPrimary,
                            justifyContent: 'center' as 'center',
                            alignItems: 'center' as 'center',
                            marginRight: theme.Spacing.sm,
                        }}>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: 'bold' as 'bold',
                                color: theme.colors.textInverse,
                            }}>
                                {(user.profile?.full_name || user.email).charAt(0).toUpperCase()}
                            </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600' as '600',
                                color: theme.colors.text,
                                marginBottom: 2,
                            }}>
                                {user.profile?.full_name || 'No Name'}
                            </Text>
                            <Text style={{
                                fontSize: 12,
                                color: theme.colors.textSecondary,
                            }}>
                                {user.email}
                            </Text>
                        </View>
                    </View>

                    {/* Status Badges */}
                    <View style={{
                        flexDirection: 'row' as 'row',
                        gap: theme.Spacing.sm,
                        marginBottom: 8
                    }}>
                        <View style={{
                            backgroundColor: user.is_active ? theme.colors.success + '20' : theme.colors.error + '20',
                            paddingHorizontal: theme.Spacing.sm,
                            paddingVertical: 2,
                            borderRadius: theme.BorderRadius.round,
                        }}>
                            <Text style={{
                                fontSize: 10,
                                color: user.is_active ? theme.colors.success : theme.colors.error,
                                fontWeight: '500' as '500',
                            }}>
                                {user.is_active ? 'Active' : 'Inactive'}
                            </Text>
                        </View>

                        {user.is_admin && (
                            <View style={{
                                backgroundColor: theme.colors.warning + '20',
                                paddingHorizontal: theme.Spacing.sm,
                                paddingVertical: 2,
                                borderRadius: theme.BorderRadius.round,
                            }}>
                                <Text style={{
                                    fontSize: 10,
                                    color: theme.colors.warning,
                                    fontWeight: '500' as '500',
                                }}>
                                    Admin
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Stats */}
                    <View style={{
                        flexDirection: 'row' as 'row',
                        justifyContent: 'space-between' as 'space-between',
                        marginBottom: 4
                    }}>
                        <View style={{ alignItems: 'center' as 'center' }}>
                            <Ionicons name="musical-notes" size={12} color={theme.colors.textSecondary} />
                            <Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 }}>
                                {user.stats?.audio_listened || 0}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'center' as 'center' }}>
                            <Ionicons name="heart" size={12} color={theme.colors.textSecondary} />
                            <Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 }}>
                                {user.stats?.favorites_count || 0}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'center' as 'center' }}>
                            <Ionicons name="chatbubble" size={12} color={theme.colors.textSecondary} />
                            <Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 }}>
                                {user.stats?.prayers_posted || 0}
                            </Text>
                        </View>
                    </View>

                    {/* Last Seen */}
                    <Text style={{
                        fontSize: 10,
                        color: theme.colors.textSecondary,
                    }}>
                        Joined {formatDate(user.created_at)} • Last seen {formatLastSeen(user.last_sign_in_at)}
                    </Text>
                </View>

                <View style={{
                    alignItems: 'flex-end' as 'flex-end',
                    gap: theme.Spacing.sm
                }}>
                    {actionLoading === user.id ? (
                        <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
                    ) : (
                        <>
                            <TouchableOpacity
                                onPress={() => toggleUserStatus(user)}
                                style={{ padding: theme.Spacing.xs }}
                            >
                                <Ionicons
                                    name={user.is_active ? "pause-circle" : "play-circle"}
                                    size={20}
                                    color={user.is_active ? theme.colors.warning : theme.colors.success}
                                />
                            </TouchableOpacity>

                            {!user.is_admin && (
                                <TouchableOpacity
                                    onPress={() => toggleAdminStatus(user)}
                                    style={{ padding: theme.Spacing.xs }}
                                >
                                    <Ionicons
                                        name="shield-outline"
                                        size={20}
                                        color={theme.colors.accentPrimary}
                                    />
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[theme.screen, {
                justifyContent: 'center' as 'center',
                alignItems: 'center' as 'center'
            }]}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                <Text style={{ marginTop: theme.Spacing.md, color: theme.colors.text }}>
                    Loading users...
                </Text>
            </View>
        );
    }

    return (
        <View style={theme.screen}>
            {/* Header */}
            <View style={{
                padding: theme.Spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: 'bold' as 'bold',
                    color: theme.colors.text,
                    marginBottom: theme.Spacing.sm,
                }}>
                    User Management ({filteredUsers.length})
                </Text>

                {/* Search Bar */}
                <View style={{
                    flexDirection: 'row' as 'row',
                    alignItems: 'center' as 'center',
                    backgroundColor: theme.colors.backgroundCard,
                    borderRadius: theme.BorderRadius.md,
                    paddingHorizontal: theme.Spacing.md,
                    marginBottom: theme.Spacing.md,
                }}>
                    <Ionicons name="search" size={16} color={theme.colors.textSecondary} />
                    <TextInput
                        style={{
                            flex: 1,
                            padding: theme.Spacing.md,
                            color: theme.colors.text,
                            fontSize: 14,
                        }}
                        placeholder="Search users by name or email..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={16} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Filter Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{
                        flexDirection: 'row' as 'row',
                        gap: theme.Spacing.sm
                    }}>
                        {[
                            { key: 'all', label: 'All Users', count: users.length },
                            { key: 'active', label: 'Active', count: users.filter(u => u.is_active).length },
                            { key: 'inactive', label: 'Inactive', count: users.filter(u => !u.is_active).length },
                            { key: 'admin', label: 'Admins', count: users.filter(u => u.is_admin).length },
                        ].map(({ key, label, count }) => (
                            <TouchableOpacity
                                key={key}
                                onPress={() => setFilter(key as any)}
                                style={{
                                    paddingHorizontal: theme.Spacing.md,
                                    paddingVertical: theme.Spacing.sm,
                                    borderRadius: theme.BorderRadius.round,
                                    backgroundColor: filter === key
                                        ? theme.colors.accentPrimary
                                        : theme.colors.backgroundCard,
                                    borderWidth: 1,
                                    borderColor: filter === key
                                        ? theme.colors.accentPrimary
                                        : theme.colors.border,
                                }}
                            >
                                <Text style={{
                                    fontSize: 12,
                                    fontWeight: '500' as '500',
                                    color: filter === key
                                        ? theme.colors.textInverse
                                        : theme.colors.textSecondary,
                                }}>
                                    {label} ({count})
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Users List */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: theme.Spacing.md }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.accentPrimary]}
                    />
                }
            >
                {filteredUsers.length === 0 ? (
                    <View style={{
                        alignItems: 'center' as 'center',
                        paddingVertical: theme.Spacing.xl
                    }}>
                        <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600' as '600',
                            color: theme.colors.text,
                            marginTop: theme.Spacing.lg,
                            textAlign: 'center' as 'center',
                        }}>
                            No users found
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.textSecondary,
                            marginTop: theme.Spacing.sm,
                            textAlign: 'center' as 'center',
                        }}>
                            {searchQuery ? 'Try adjusting your search' : 'No users match the current filter'}
                        </Text>
                    </View>
                ) : (
                    filteredUsers.map(user => (
                        <UserCard key={user.id} user={user} />
                    ))
                )}
            </ScrollView>

            {/* User Details Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                {selectedUser && (
                    <View style={[theme.screen, { padding: theme.Spacing.md }]}>
                        <View style={{
                            flexDirection: 'row' as 'row',
                            justifyContent: 'space-between' as 'space-between',
                            alignItems: 'center' as 'center',
                            marginBottom: theme.Spacing.lg,
                        }}>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: 'bold' as 'bold',
                                color: theme.colors.text,
                            }}>
                                User Details
                            </Text>

                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={{ padding: theme.Spacing.sm }}
                            >
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                            <View style={{ gap: theme.Spacing.lg }}>
                                {/* User Profile */}
                                <View style={[theme.card, {
                                    alignItems: 'center' as 'center',
                                    padding: theme.Spacing.lg
                                }]}>
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
                                            fontWeight: 'bold' as 'bold',
                                            color: theme.colors.textInverse,
                                        }}>
                                            {(selectedUser.profile?.full_name || selectedUser.email).charAt(0).toUpperCase()}
                                        </Text>
                                    </View>

                                    <Text style={{
                                        fontSize: 20,
                                        fontWeight: 'bold' as 'bold',
                                        color: theme.colors.text,
                                        marginBottom: 4,
                                    }}>
                                        {selectedUser.profile?.full_name || 'No Name'}
                                    </Text>

                                    <Text style={{
                                        fontSize: 14,
                                        color: theme.colors.textSecondary,
                                        marginBottom: theme.Spacing.md,
                                    }}>
                                        {selectedUser.email}
                                    </Text>

                                    <View style={{
                                        flexDirection: 'row' as 'row',
                                        gap: theme.Spacing.md
                                    }}>
                                        <View style={{
                                            backgroundColor: selectedUser.is_active ? theme.colors.success + '20' : theme.colors.error + '20',
                                            paddingHorizontal: theme.Spacing.md,
                                            paddingVertical: theme.Spacing.sm,
                                            borderRadius: theme.BorderRadius.round,
                                        }}>
                                            <Text style={{
                                                fontSize: 12,
                                                color: selectedUser.is_active ? theme.colors.success : theme.colors.error,
                                                fontWeight: '500' as '500',
                                            }}>
                                                {selectedUser.is_active ? 'Active' : 'Inactive'}
                                            </Text>
                                        </View>

                                        {selectedUser.is_admin && (
                                            <View style={{
                                                backgroundColor: theme.colors.warning + '20',
                                                paddingHorizontal: theme.Spacing.md,
                                                paddingVertical: theme.Spacing.sm,
                                                borderRadius: theme.BorderRadius.round,
                                            }}>
                                                <Text style={{
                                                    fontSize: 12,
                                                    color: theme.colors.warning,
                                                    fontWeight: '500' as '500',
                                                }}>
                                                    Admin
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* User Stats */}
                                <View style={theme.card}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: '600' as '600',
                                        color: theme.colors.text,
                                        marginBottom: theme.Spacing.md,
                                    }}>
                                        Activity Stats
                                    </Text>

                                    <View style={{ gap: theme.Spacing.sm }}>
                                        <View style={createStatRowStyle(theme)}>
                                            <Text style={createStatLabelStyle(theme)}>Audio Listened</Text>
                                            <Text style={createStatValueStyle(theme)}>
                                                {selectedUser.stats?.audio_listened || 0}
                                            </Text>
                                        </View>
                                        <View style={createStatRowStyle(theme)}>
                                            <Text style={createStatLabelStyle(theme)}>Favorites</Text>
                                            <Text style={createStatValueStyle(theme)}>
                                                {selectedUser.stats?.favorites_count || 0}
                                            </Text>
                                        </View>
                                        <View style={createStatRowStyle(theme)}>
                                            <Text style={createStatLabelStyle(theme)}>Prayers Posted</Text>
                                            <Text style={createStatValueStyle(theme)}>
                                                {selectedUser.stats?.prayers_posted || 0}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Account Info */}
                                <View style={theme.card}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: '600' as '600',
                                        color: theme.colors.text,
                                        marginBottom: theme.Spacing.md,
                                    }}>
                                        Account Information
                                    </Text>

                                    <View style={{ gap: theme.Spacing.sm }}>
                                        <View style={createInfoRowStyle(theme)}>
                                            <Text style={createInfoLabelStyle(theme)}>Joined</Text>
                                            <Text style={createInfoValueStyle(theme)}>
                                                {formatDate(selectedUser.created_at)}
                                            </Text>
                                        </View>
                                        <View style={createInfoRowStyle(theme)}>
                                            <Text style={createInfoLabelStyle(theme)}>Last Active</Text>
                                            <Text style={createInfoValueStyle(theme)}>
                                                {formatLastSeen(selectedUser.last_sign_in_at)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Actions */}
                                <View style={theme.card}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: '600' as '600',
                                        color: theme.colors.text,
                                        marginBottom: theme.Spacing.md,
                                    }}>
                                        User Actions
                                    </Text>

                                    <View style={{ gap: theme.Spacing.sm }}>
                                        <TouchableOpacity
                                            style={[
                                                createActionButtonStyle(theme),
                                                { backgroundColor: selectedUser.is_active ? theme.colors.warning + '20' : theme.colors.success + '20' }
                                            ]}
                                            onPress={() => toggleUserStatus(selectedUser)}
                                            disabled={actionLoading === selectedUser.id}
                                        >
                                            {actionLoading === selectedUser.id ? (
                                                <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
                                            ) : (
                                                <>
                                                    <Ionicons
                                                        name={selectedUser.is_active ? "pause-circle" : "play-circle"}
                                                        size={20}
                                                        color={selectedUser.is_active ? theme.colors.warning : theme.colors.success}
                                                    />
                                                    <Text style={[
                                                        createActionButtonTextStyle(theme),
                                                        { color: selectedUser.is_active ? theme.colors.warning : theme.colors.success }
                                                    ]}>
                                                        {selectedUser.is_active ? 'Deactivate User' : 'Activate User'}
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>

                                        {!selectedUser.is_admin && (
                                            <TouchableOpacity
                                                style={[
                                                    createActionButtonStyle(theme),
                                                    { backgroundColor: theme.colors.accentPrimary + '20' }
                                                ]}
                                                onPress={() => toggleAdminStatus(selectedUser)}
                                                disabled={actionLoading === selectedUser.id}
                                            >
                                                {actionLoading === selectedUser.id ? (
                                                    <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
                                                ) : (
                                                    <>
                                                        <Ionicons
                                                            name="shield"
                                                            size={20}
                                                            color={theme.colors.accentPrimary}
                                                        />
                                                        <Text style={[
                                                            createActionButtonTextStyle(theme),
                                                            { color: theme.colors.accentPrimary }
                                                        ]}>
                                                            {selectedUser.is_admin ? 'Remove Admin' : 'Make Admin'}
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}

                                        {selectedUser.email !== 'admin@herquietplace.com' && (
                                            <TouchableOpacity
                                                style={[
                                                    createActionButtonStyle(theme),
                                                    { backgroundColor: theme.colors.error + '20' }
                                                ]}
                                                onPress={() => handleDeleteUser(selectedUser)}
                                                disabled={actionLoading === selectedUser.id}
                                            >
                                                <Ionicons name="trash" size={20} color={theme.colors.error} />
                                                <Text style={[
                                                    createActionButtonTextStyle(theme),
                                                    { color: theme.colors.error }
                                                ]}>
                                                    Delete User
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                )}
            </Modal>
        </View>
    );
}