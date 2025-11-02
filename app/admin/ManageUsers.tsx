// app/admin/ManageUsers.tsx - Updated version
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { adminUserService, AdminUser } from '../../services/adminUserService';

export default function ManageUsers() {
    const theme = useTheme();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadUsers();
    };

    const toggleUserRole = async (user: AdminUser) => {
        setActionLoading(user.id);
        try {
            const newRole = user.role === 'admin' ? 'user' : 'admin';
            await adminUserService.updateUserRole(user.id, newRole);

            // Update local state
            setUsers(users.map(u =>
                u.id === user.id ? { ...u, role: newRole } : u
            ));

            Alert.alert('Success', `User role updated to ${newRole}`);
        } catch (error) {
            console.error('Error updating user role:', error);
            Alert.alert('Error', 'Failed to update user role');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // In your ManageUsers.tsx, update the UserCard component:
    const UserCard = ({ user }: { user: AdminUser }) => (
        <View style={[
            theme.card,
            {
                marginBottom: theme.Spacing.md,
                borderLeftWidth: 4,
                borderLeftColor: user.role === 'admin' ? theme.colors.accentPrimary : theme.colors.textSecondary,
                opacity: user.has_profile ? 1 : 0.7,
            }
        ]}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
            }}>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: theme.Spacing.xs,
                    }}>
                        {user.full_name || 'User (No Profile)'}
                    </Text>

                    <Text style={{
                        fontSize: 12,
                        color: theme.colors.textSecondary,
                        marginBottom: theme.Spacing.xs,
                    }}>
                        User ID: {user.id.substring(0, 8)}...
                        {!user.has_profile && ' • No Profile'}
                    </Text>

                    {/* ... rest of your UserCard code ... */}
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center' }]}>
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
                    fontWeight: 'bold',
                    color: theme.colors.text,
                    marginBottom: theme.Spacing.sm,
                }}>
                    Manage Users ({users.length})
                </Text>

                <Text style={{
                    fontSize: 12,
                    color: theme.colors.textSecondary,
                }}>
                    View and manage user accounts and permissions
                </Text>
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
                {users.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: theme.Spacing.xl }}>
                        <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginTop: theme.Spacing.lg,
                            textAlign: 'center',
                        }}>
                            No users found
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.textSecondary,
                            marginTop: theme.Spacing.sm,
                            textAlign: 'center',
                        }}>
                            Users will appear here once they register
                        </Text>
                    </View>
                ) : (
                    users.map(user => (
                        <UserCard key={user.id} user={user} />
                    ))
                )}
            </ScrollView>
        </View>
    );
}