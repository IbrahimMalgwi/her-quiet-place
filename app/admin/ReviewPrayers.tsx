// app/admin/ReviewPrayers.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    RefreshControl,
    ViewStyle,
    TextStyle
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { adminPrayerService, AdminPrayer } from '../../services/adminPrayerService';

// Helper functions for proper typing
const createInfoRowStyle = (theme: any): ViewStyle => ({
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    paddingVertical: theme.Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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

const createStatNumberStyle = (theme: any): TextStyle => ({
    fontSize: 20,
    fontWeight: 'bold' as 'bold',
    color: theme.colors.text,
    marginTop: theme.Spacing.xs,
});

const createStatLabelStyle = (theme: any): TextStyle => ({
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
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

const createLabelStyle = (theme: any): TextStyle => ({
    fontSize: 14,
    fontWeight: '500' as '500',
    color: theme.colors.text,
    marginBottom: theme.Spacing.sm,
});

export default function ReviewPrayers() {
    const theme = useTheme();
    const [prayers, setPrayers] = useState<AdminPrayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedPrayer, setSelectedPrayer] = useState<AdminPrayer | null>(null);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        loadPrayers();
    }, [filter]);

    const loadPrayers = async () => {
        try {
            setLoading(true);
            const prayersData = await adminPrayerService.getPrayers();
            setPrayers(prayersData);
        } catch (error) {
            console.error('Error loading prayers:', error);
            Alert.alert('Error', 'Failed to load prayers');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadPrayers();
    };

    const openPrayerDetails = (prayer: AdminPrayer) => {
        setSelectedPrayer(prayer);
        setRejectionReason('');
        setModalVisible(true);
    };

    // Filter prayers based on current filter
    const filteredPrayers = prayers.filter(prayer => {
        if (filter === 'pending') return prayer.status === 'pending';
        if (filter === 'approved') return prayer.status === 'approved';
        if (filter === 'rejected') return prayer.status === 'rejected';
        return false;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            healing: '#10b981',
            family: '#6366f1',
            guidance: '#f59e0b',
            peace: '#06b6d4',
            strength: '#ef4444',
            gratitude: '#8b5cf6',
            faith: '#ec4899',
            hope: '#dc2626',
        };
        return colors[category] || theme.colors.accentPrimary;
    };

    const getStatusColor = (prayer: AdminPrayer) => {
        if (prayer.status === 'approved') return theme.colors.success;
        if (prayer.status === 'rejected') return theme.colors.error;
        return theme.colors.warning;
    };

    const getStatusText = (prayer: AdminPrayer) => {
        if (prayer.status === 'approved') return 'Approved';
        if (prayer.status === 'rejected') return 'Rejected';
        return 'Pending Review';
    };

    const approvePrayer = async (prayer: AdminPrayer) => {
        setActionLoading(prayer.id);
        try {
            const updatedPrayer = await adminPrayerService.approvePrayer(prayer.id);
            setPrayers(prayers.map(p => p.id === prayer.id ? updatedPrayer : p));
            setActionLoading(null);
            setModalVisible(false);
            Alert.alert('Success', 'Prayer approved and published to community!');
        } catch (error) {
            console.error('Error approving prayer:', error);
            Alert.alert('Error', 'Failed to approve prayer');
            setActionLoading(null);
        }
    };

    const rejectPrayer = async (prayer: AdminPrayer) => {
        if (!rejectionReason.trim()) {
            Alert.alert('Error', 'Please provide a reason for rejection');
            return;
        }

        setActionLoading(prayer.id);
        try {
            const updatedPrayer = await adminPrayerService.rejectPrayer(prayer.id, rejectionReason);
            setPrayers(prayers.map(p => p.id === prayer.id ? updatedPrayer : p));
            setActionLoading(null);
            setModalVisible(false);
            Alert.alert('Success', 'Prayer rejected successfully');
        } catch (error) {
            console.error('Error rejecting prayer:', error);
            Alert.alert('Error', 'Failed to reject prayer');
            setActionLoading(null);
        }
    };

    // In ReviewPrayers.tsx - replace the makePrivate function
    const makePrivate = async (prayer: AdminPrayer) => {
        setActionLoading(prayer.id);
        try {
            const updatedPrayer = await adminPrayerService.updatePrayer(prayer.id, {
                status: 'rejected', // Rejecting makes it private
                rejection_reason: 'Made private by admin'
            });
            setPrayers(prayers.map(p => p.id === prayer.id ? updatedPrayer : p));
            setActionLoading(null);
            Alert.alert('Success', 'Prayer made private');
        } catch (error) {
            console.error('Error making prayer private:', error);
            Alert.alert('Error', 'Failed to update prayer visibility');
            setActionLoading(null);
        }
    };

    const deletePrayer = async (prayer: AdminPrayer) => {
        Alert.alert(
            'Delete Prayer',
            `Are you sure you want to delete "${prayer.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => confirmDelete(prayer.id)
                }
            ]
        );
    };

    const confirmDelete = async (prayerId: string) => {
        setActionLoading(prayerId);
        try {
            await adminPrayerService.deletePrayer(prayerId);
            setPrayers(prayers.filter(prayer => prayer.id !== prayerId));
            setActionLoading(null);
            setModalVisible(false);
            Alert.alert('Success', 'Prayer deleted successfully');
        } catch (error) {
            console.error('Error deleting prayer:', error);
            Alert.alert('Error', 'Failed to delete prayer');
            setActionLoading(null);
        }
    };

    const PrayerCard = ({ prayer }: { prayer: AdminPrayer }) => (
        <TouchableOpacity
            onPress={() => openPrayerDetails(prayer)}
            style={[
                theme.card,
                {
                    marginBottom: theme.Spacing.md,
                    borderLeftWidth: 4,
                    borderLeftColor: getStatusColor(prayer),
                }
            ]}
        >
            <View style={{
                flexDirection: 'row' as 'row',
                justifyContent: 'space-between' as 'space-between',
                alignItems: 'flex-start' as 'flex-start'
            }}>
                <View style={{ flex: 1 }}>
                    {/* Prayer Title and Status */}
                    <View style={{
                        flexDirection: 'row' as 'row',
                        justifyContent: 'space-between' as 'space-between',
                        alignItems: 'flex-start' as 'flex-start',
                        marginBottom: 8
                    }}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600' as '600',
                            color: theme.colors.text,
                            flex: 1,
                            marginRight: theme.Spacing.sm,
                        }}>
                            {prayer.title}
                        </Text>

                        <View style={{
                            backgroundColor: getStatusColor(prayer) + '20',
                            paddingHorizontal: theme.Spacing.sm,
                            paddingVertical: 2,
                            borderRadius: theme.BorderRadius.round,
                        }}>
                            <Text style={{
                                fontSize: 10,
                                color: getStatusColor(prayer),
                                fontWeight: '500' as '500',
                            }}>
                                {getStatusText(prayer)}
                            </Text>
                        </View>
                    </View>

                    {/* Prayer Content Preview */}
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary,
                        lineHeight: 20,
                        marginBottom: 8,
                    }} numberOfLines={3}>
                        {prayer.content}
                    </Text>

                    {/* Metadata */}
                    <View style={{
                        flexDirection: 'row' as 'row',
                        flexWrap: 'wrap' as 'wrap',
                        gap: theme.Spacing.sm,
                        marginBottom: 8
                    }}>
                        <View style={{
                            backgroundColor: prayer.is_public ? theme.colors.success + '20' : theme.colors.textSecondary + '20',
                            paddingHorizontal: theme.Spacing.sm,
                            paddingVertical: 2,
                            borderRadius: theme.BorderRadius.round,
                        }}>
                            <Text style={{
                                fontSize: 10,
                                color: prayer.is_public ? theme.colors.success : theme.colors.textSecondary,
                                fontWeight: '500' as '500',
                            }}>
                                {prayer.is_public ? 'Public' : 'Private'}
                            </Text>
                        </View>

                        <View style={{
                            backgroundColor: prayer.is_anonymous ? theme.colors.warning + '20' : theme.colors.accentPrimary + '20',
                            paddingHorizontal: theme.Spacing.sm,
                            paddingVertical: 2,
                            borderRadius: theme.BorderRadius.round,
                        }}>
                            <Text style={{
                                fontSize: 10,
                                color: prayer.is_anonymous ? theme.colors.warning : theme.colors.accentPrimary,
                                fontWeight: '500' as '500',
                            }}>
                                {prayer.is_anonymous ? 'Anonymous' : 'Public Name'}
                            </Text>
                        </View>
                    </View>

                    {/* User Info and Stats */}
                    <View style={{
                        flexDirection: 'row' as 'row',
                        justifyContent: 'space-between' as 'space-between',
                        alignItems: 'center' as 'center'
                    }}>
                        <Text style={{
                            fontSize: 12,
                            color: theme.colors.textSecondary,
                        }}>
                            by {prayer.user_name || prayer.user_email}
                        </Text>

                        <View style={{
                            flexDirection: 'row' as 'row',
                            alignItems: 'center' as 'center',
                            gap: theme.Spacing.lg
                        }}>
                            <View style={{
                                flexDirection: 'row' as 'row',
                                alignItems: 'center' as 'center'
                            }}>
                                <Ionicons name="heart" size={12} color={theme.colors.textSecondary} />
                                <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginLeft: 2 }}>
                                    {prayer.prayer_count}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Date */}
                    <Text style={{
                        fontSize: 10,
                        color: theme.colors.textSecondary,
                        marginTop: 4,
                    }}>
                        {formatDate(prayer.created_at)}
                    </Text>
                </View>

                {prayer.status === 'pending' && (
                    <View style={{
                        alignItems: 'flex-end' as 'flex-end',
                        gap: theme.Spacing.sm,
                        marginLeft: theme.Spacing.sm
                    }}>
                        {actionLoading === prayer.id ? (
                            <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
                        ) : (
                            <>
                                <TouchableOpacity
                                    onPress={() => approvePrayer(prayer)}
                                    style={{ padding: theme.Spacing.xs }}
                                >
                                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => openPrayerDetails(prayer)}
                                    style={{ padding: theme.Spacing.xs }}
                                >
                                    <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
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
                    Loading prayers...
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
                    Prayer Review ({filteredPrayers.length})
                </Text>

                {/* Filter Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{
                        flexDirection: 'row' as 'row',
                        gap: theme.Spacing.sm
                    }}>
                        {[
                            { key: 'pending', label: 'Pending Review', count: prayers.filter(p => p.status === 'pending').length },
                            { key: 'approved', label: 'Approved', count: prayers.filter(p => p.status === 'approved').length },
                            { key: 'rejected', label: 'Rejected', count: prayers.filter(p => p.status === 'rejected').length },
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

            {/* Prayers List */}
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
                {filteredPrayers.length === 0 ? (
                    <View style={{
                        alignItems: 'center' as 'center',
                        paddingVertical: theme.Spacing.xl
                    }}>
                        <Ionicons
                            name={filter === 'pending' ? "time-outline" : "checkmark-done-outline"}
                            size={64}
                            color={theme.colors.textSecondary}
                        />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600' as '600',
                            color: theme.colors.text,
                            marginTop: theme.Spacing.lg,
                            textAlign: 'center' as 'center',
                        }}>
                            {filter === 'pending' ? 'No prayers pending review' : `No ${filter} prayers`}
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.textSecondary,
                            marginTop: theme.Spacing.sm,
                            textAlign: 'center' as 'center',
                        }}>
                            {filter === 'pending'
                                ? 'All prayers have been reviewed'
                                : `${filter.charAt(0).toUpperCase() + filter.slice(1)} prayers will appear here`
                            }
                        </Text>
                    </View>
                ) : (
                    filteredPrayers.map(prayer => (
                        <PrayerCard key={prayer.id} prayer={prayer} />
                    ))
                )}
            </ScrollView>

            {/* Prayer Details Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                {selectedPrayer && (
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
                                Prayer Details
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
                                {/* Prayer Content */}
                                <View style={theme.card}>
                                    <Text style={{
                                        fontSize: 18,
                                        fontWeight: 'bold' as 'bold',
                                        color: theme.colors.text,
                                        marginBottom: theme.Spacing.md,
                                    }}>
                                        {selectedPrayer.title}
                                    </Text>

                                    <Text style={{
                                        fontSize: 14,
                                        color: theme.colors.text,
                                        lineHeight: 22,
                                        marginBottom: theme.Spacing.md,
                                    }}>
                                        {selectedPrayer.content}
                                    </Text>

                                    <View style={{
                                        flexDirection: 'row' as 'row',
                                        flexWrap: 'wrap' as 'wrap',
                                        gap: theme.Spacing.sm
                                    }}>
                                        <View style={{
                                            backgroundColor: getStatusColor(selectedPrayer) + '20',
                                            paddingHorizontal: theme.Spacing.md,
                                            paddingVertical: theme.Spacing.sm,
                                            borderRadius: theme.BorderRadius.round,
                                        }}>
                                            <Text style={{
                                                fontSize: 12,
                                                color: getStatusColor(selectedPrayer),
                                                fontWeight: '500' as '500',
                                            }}>
                                                {getStatusText(selectedPrayer)}
                                            </Text>
                                        </View>

                                        <View style={{
                                            backgroundColor: selectedPrayer.is_public ? theme.colors.success + '20' : theme.colors.textSecondary + '20',
                                            paddingHorizontal: theme.Spacing.md,
                                            paddingVertical: theme.Spacing.sm,
                                            borderRadius: theme.BorderRadius.round,
                                        }}>
                                            <Text style={{
                                                fontSize: 12,
                                                color: selectedPrayer.is_public ? theme.colors.success : theme.colors.textSecondary,
                                                fontWeight: '500' as '500',
                                            }}>
                                                {selectedPrayer.is_public ? 'Public' : 'Private'}
                                            </Text>
                                        </View>

                                        <View style={{
                                            backgroundColor: selectedPrayer.is_anonymous ? theme.colors.warning + '20' : theme.colors.accentPrimary + '20',
                                            paddingHorizontal: theme.Spacing.md,
                                            paddingVertical: theme.Spacing.sm,
                                            borderRadius: theme.BorderRadius.round,
                                        }}>
                                            <Text style={{
                                                fontSize: 12,
                                                color: selectedPrayer.is_anonymous ? theme.colors.warning : theme.colors.accentPrimary,
                                                fontWeight: '500' as '500',
                                            }}>
                                                {selectedPrayer.is_anonymous ? 'Anonymous' : 'Public Name'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* User Information */}
                                <View style={theme.card}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: '600' as '600',
                                        color: theme.colors.text,
                                        marginBottom: theme.Spacing.md,
                                    }}>
                                        Submitted By
                                    </Text>

                                    <View style={{ gap: theme.Spacing.sm }}>
                                        <View style={createInfoRowStyle(theme)}>
                                            <Text style={createInfoLabelStyle(theme)}>Name</Text>
                                            <Text style={createInfoValueStyle(theme)}>
                                                {selectedPrayer.user_name || (selectedPrayer.is_anonymous ? 'Anonymous' : 'Not provided')}
                                            </Text>
                                        </View>
                                        <View style={createInfoRowStyle(theme)}>
                                            <Text style={createInfoLabelStyle(theme)}>Email</Text>
                                            <Text style={createInfoValueStyle(theme)}>
                                                {selectedPrayer.is_anonymous ? 'Hidden' : selectedPrayer.user_email}
                                            </Text>
                                        </View>
                                        <View style={createInfoRowStyle(theme)}>
                                            <Text style={createInfoLabelStyle(theme)}>Submitted</Text>
                                            <Text style={createInfoValueStyle(theme)}>
                                                {formatDate(selectedPrayer.created_at)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Engagement Stats */}
                                <View style={theme.card}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: '600' as '600',
                                        color: theme.colors.text,
                                        marginBottom: theme.Spacing.md,
                                    }}>
                                        Community Engagement
                                    </Text>

                                    <View style={{
                                        flexDirection: 'row' as 'row',
                                        justifyContent: 'space-around' as 'space-around'
                                    }}>
                                        <View style={{ alignItems: 'center' as 'center' }}>
                                            <Ionicons name="heart" size={24} color={theme.colors.error} />
                                            <Text style={createStatNumberStyle(theme)}>
                                                {selectedPrayer.prayer_count}
                                            </Text>
                                            <Text style={createStatLabelStyle(theme)}>Prayers</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Approval Actions */}
                                {selectedPrayer.status === 'pending' && (
                                    <View style={theme.card}>
                                        <Text style={{
                                            fontSize: 16,
                                            fontWeight: '600' as '600',
                                            color: theme.colors.text,
                                            marginBottom: theme.Spacing.md,
                                        }}>
                                            Review Actions
                                        </Text>

                                        <View style={{ gap: theme.Spacing.sm }}>
                                            <TouchableOpacity
                                                style={[
                                                    createActionButtonStyle(theme),
                                                    { backgroundColor: theme.colors.success + '20' }
                                                ]}
                                                onPress={() => approvePrayer(selectedPrayer)}
                                                disabled={actionLoading === selectedPrayer.id}
                                            >
                                                {actionLoading === selectedPrayer.id ? (
                                                    <ActivityIndicator size="small" color={theme.colors.success} />
                                                ) : (
                                                    <>
                                                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                                                        <Text style={[
                                                            createActionButtonTextStyle(theme),
                                                            { color: theme.colors.success }
                                                        ]}>
                                                            Approve Prayer
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>

                                            {/* Rejection Reason Input */}
                                            <View style={{ marginTop: theme.Spacing.md }}>
                                                <Text style={createLabelStyle(theme)}>Rejection Reason (Optional)</Text>
                                                <TextInput
                                                    style={[theme.input, { height: 80, textAlignVertical: 'top' }]}
                                                    value={rejectionReason}
                                                    onChangeText={setRejectionReason}
                                                    placeholder="Provide reason for rejection..."
                                                    multiline
                                                />
                                            </View>

                                            <TouchableOpacity
                                                style={[
                                                    createActionButtonStyle(theme),
                                                    { backgroundColor: theme.colors.error + '20' }
                                                ]}
                                                onPress={() => rejectPrayer(selectedPrayer)}
                                                disabled={actionLoading === selectedPrayer.id}
                                            >
                                                {actionLoading === selectedPrayer.id ? (
                                                    <ActivityIndicator size="small" color={theme.colors.error} />
                                                ) : (
                                                    <>
                                                        <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                                                        <Text style={[
                                                            createActionButtonTextStyle(theme),
                                                            { color: theme.colors.error }
                                                        ]}>
                                                            Reject Prayer
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {/* Management Actions */}
                                <View style={theme.card}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: '600' as '600',
                                        color: theme.colors.text,
                                        marginBottom: theme.Spacing.md,
                                    }}>
                                        Management Actions
                                    </Text>

                                    <View style={{ gap: theme.Spacing.sm }}>
                                        {selectedPrayer.is_public && (
                                            <TouchableOpacity
                                                style={[
                                                    createActionButtonStyle(theme),
                                                    { backgroundColor: theme.colors.warning + '20' }
                                                ]}
                                                onPress={() => makePrivate(selectedPrayer)}
                                                disabled={actionLoading === selectedPrayer.id}
                                            >
                                                <Ionicons name="eye-off" size={20} color={theme.colors.warning} />
                                                <Text style={[
                                                    createActionButtonTextStyle(theme),
                                                    { color: theme.colors.warning }
                                                ]}>
                                                    Make Private
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        <TouchableOpacity
                                            style={[
                                                createActionButtonStyle(theme),
                                                { backgroundColor: theme.colors.error + '20' }
                                            ]}
                                            onPress={() => deletePrayer(selectedPrayer)}
                                            disabled={actionLoading === selectedPrayer.id}
                                        >
                                            <Ionicons name="trash" size={20} color={theme.colors.error} />
                                            <Text style={[
                                                createActionButtonTextStyle(theme),
                                                { color: theme.colors.error }
                                            ]}>
                                                Delete Prayer
                                            </Text>
                                        </TouchableOpacity>
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