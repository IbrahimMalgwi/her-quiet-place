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

interface Prayer {
    id: string;
    user_id: string;
    user_email: string;
    user_name?: string;
    title: string;
    content: string;
    category: string;
    is_public: boolean;
    is_approved: boolean;
    created_at: string;
    likes_count: number;
    comments_count: number;
    approved_at?: string;
    approved_by?: string;
}

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
    const [prayers, setPrayers] = useState<Prayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        loadPrayers();
    }, [filter]);

    const loadPrayers = async () => {
        try {
            setLoading(true);
            // Simulate API call
            setTimeout(() => {
                setPrayers([
                    {
                        id: '1',
                        user_id: 'user1',
                        user_email: 'user1@example.com',
                        user_name: 'John Doe',
                        title: 'Prayer for Healing',
                        content: 'Heavenly Father, I come before you today asking for your healing hand to touch my body. Please restore my health and give me strength during this difficult time.',
                        category: 'healing',
                        is_public: true,
                        is_approved: false,
                        created_at: '2024-03-20T10:30:00Z',
                        likes_count: 5,
                        comments_count: 2,
                    },
                    {
                        id: '2',
                        user_id: 'user2',
                        user_email: 'user2@example.com',
                        user_name: 'Jane Smith',
                        title: 'Strength for Family',
                        content: 'Lord, please give my family strength and unity as we face challenges together. Help us to support each other and grow closer through these trials.',
                        category: 'family',
                        is_public: true,
                        is_approved: false,
                        created_at: '2024-03-19T14:20:00Z',
                        likes_count: 12,
                        comments_count: 4,
                    },
                    {
                        id: '3',
                        user_id: 'user3',
                        user_email: 'user3@example.com',
                        user_name: 'Mike Johnson',
                        title: 'Guidance in Decisions',
                        content: 'Dear God, I seek your wisdom and guidance as I make important decisions in my life. Please show me the path you have planned for me.',
                        category: 'guidance',
                        is_public: true,
                        is_approved: true,
                        created_at: '2024-03-18T09:15:00Z',
                        likes_count: 8,
                        comments_count: 3,
                        approved_at: '2024-03-18T11:30:00Z',
                        approved_by: 'admin@herquietplace.com',
                    },
                    {
                        id: '4',
                        user_id: 'user4',
                        user_email: 'user4@example.com',
                        title: 'Peace in Anxiety',
                        content: 'Father, in moments of anxiety and worry, I ask for your peace that surpasses all understanding. Calm my heart and mind.',
                        category: 'peace',
                        is_public: false,
                        is_approved: false,
                        created_at: '2024-03-17T16:45:00Z',
                        likes_count: 3,
                        comments_count: 1,
                    }
                ]);
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error loading prayers:', error);
            Alert.alert('Error', 'Failed to load prayers');
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadPrayers();
    };

    const openPrayerDetails = (prayer: Prayer) => {
        setSelectedPrayer(prayer);
        setRejectionReason('');
        setModalVisible(true);
    };

    // Filter prayers based on current filter
    const filteredPrayers = prayers.filter(prayer => {
        if (filter === 'pending') return !prayer.is_approved;
        if (filter === 'approved') return prayer.is_approved;
        return false; // For rejected prayers (you might want to add a rejected status)
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

    const getStatusColor = (prayer: Prayer) => {
        if (prayer.is_approved) return theme.colors.success;
        return theme.colors.warning;
    };

    const getStatusText = (prayer: Prayer) => {
        if (prayer.is_approved) return 'Approved';
        return 'Pending Review';
    };

    const approvePrayer = async (prayer: Prayer) => {
        setActionLoading(prayer.id);
        try {
            // Simulate API call
            setTimeout(() => {
                const updatedPrayer = {
                    ...prayer,
                    is_approved: true,
                    approved_at: new Date().toISOString(),
                    approved_by: 'admin@herquietplace.com'
                };
                setPrayers(prayers.map(p => p.id === prayer.id ? updatedPrayer : p));
                setActionLoading(null);
                setModalVisible(false);
                Alert.alert('Success', 'Prayer approved and published to community!');
            }, 500);
        } catch (error) {
            console.error('Error approving prayer:', error);
            Alert.alert('Error', 'Failed to approve prayer');
            setActionLoading(null);
        }
    };

    const rejectPrayer = async (prayer: Prayer) => {
        if (!rejectionReason.trim()) {
            Alert.alert('Error', 'Please provide a reason for rejection');
            return;
        }

        setActionLoading(prayer.id);
        try {
            // Simulate API call
            setTimeout(() => {
                const updatedPrayer = {
                    ...prayer,
                    is_approved: false,
                    is_public: false // Make private when rejected
                };
                setPrayers(prayers.map(p => p.id === prayer.id ? updatedPrayer : p));
                setActionLoading(null);
                setModalVisible(false);
                Alert.alert('Success', 'Prayer rejected successfully');
            }, 500);
        } catch (error) {
            console.error('Error rejecting prayer:', error);
            Alert.alert('Error', 'Failed to reject prayer');
            setActionLoading(null);
        }
    };

    const makePrivate = async (prayer: Prayer) => {
        setActionLoading(prayer.id);
        try {
            // Simulate API call
            setTimeout(() => {
                const updatedPrayer = { ...prayer, is_public: false };
                setPrayers(prayers.map(p => p.id === prayer.id ? updatedPrayer : p));
                setActionLoading(null);
                Alert.alert('Success', 'Prayer made private');
            }, 500);
        } catch (error) {
            console.error('Error making prayer private:', error);
            Alert.alert('Error', 'Failed to update prayer visibility');
            setActionLoading(null);
        }
    };

    const deletePrayer = async (prayer: Prayer) => {
        Alert.alert(
            'Delete Prayer',
            `Are you sure you want to delete "${prayer.title}"? This action cannot be undone.`,
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
            // Simulate API call
            setTimeout(() => {
                setPrayers(prayers.filter(prayer => prayer.id !== prayerId));
                setActionLoading(null);
                setModalVisible(false);
                Alert.alert('Success', 'Prayer deleted successfully');
            }, 500);
        } catch (error) {
            console.error('Error deleting prayer:', error);
            Alert.alert('Error', 'Failed to delete prayer');
            setActionLoading(null);
        }
    };

    const PrayerCard = ({ prayer }: { prayer: Prayer }) => (
        <TouchableOpacity
            onPress={() => openPrayerDetails(prayer)}
            style={[
                theme.card,
                {
                    marginBottom: theme.Spacing.md,
                    borderLeftWidth: 4,
                    borderLeftColor: getCategoryColor(prayer.category),
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
                            backgroundColor: getCategoryColor(prayer.category) + '20',
                            paddingHorizontal: theme.Spacing.sm,
                            paddingVertical: 2,
                            borderRadius: theme.BorderRadius.round,
                        }}>
                            <Text style={{
                                fontSize: 10,
                                color: getCategoryColor(prayer.category),
                                fontWeight: '500' as '500',
                                textTransform: 'capitalize',
                            }}>
                                {prayer.category}
                            </Text>
                        </View>

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
                                    {prayer.likes_count}
                                </Text>
                            </View>

                            <View style={{
                                flexDirection: 'row' as 'row',
                                alignItems: 'center' as 'center'
                            }}>
                                <Ionicons name="chatbubble" size={12} color={theme.colors.textSecondary} />
                                <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginLeft: 2 }}>
                                    {prayer.comments_count}
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

                {!prayer.is_approved && (
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
                            { key: 'pending', label: 'Pending Review', count: prayers.filter(p => !p.is_approved).length },
                            { key: 'approved', label: 'Approved', count: prayers.filter(p => p.is_approved).length },
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
                            {filter === 'pending' ? 'No prayers pending review' : 'No approved prayers'}
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.textSecondary,
                            marginTop: theme.Spacing.sm,
                            textAlign: 'center' as 'center',
                        }}>
                            {filter === 'pending'
                                ? 'All prayers have been reviewed'
                                : 'Approved prayers will appear here'
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
                                            backgroundColor: getCategoryColor(selectedPrayer.category) + '20',
                                            paddingHorizontal: theme.Spacing.md,
                                            paddingVertical: theme.Spacing.sm,
                                            borderRadius: theme.BorderRadius.round,
                                        }}>
                                            <Text style={{
                                                fontSize: 12,
                                                color: getCategoryColor(selectedPrayer.category),
                                                fontWeight: '500' as '500',
                                                textTransform: 'capitalize',
                                            }}>
                                                {selectedPrayer.category}
                                            </Text>
                                        </View>

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
                                                {selectedPrayer.user_name || 'Not provided'}
                                            </Text>
                                        </View>
                                        <View style={createInfoRowStyle(theme)}>
                                            <Text style={createInfoLabelStyle(theme)}>Email</Text>
                                            <Text style={createInfoValueStyle(theme)}>
                                                {selectedPrayer.user_email}
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
                                                {selectedPrayer.likes_count}
                                            </Text>
                                            <Text style={createStatLabelStyle(theme)}>Likes</Text>
                                        </View>
                                        <View style={{ alignItems: 'center' as 'center' }}>
                                            <Ionicons name="chatbubble" size={24} color={theme.colors.accentPrimary} />
                                            <Text style={createStatNumberStyle(theme)}>
                                                {selectedPrayer.comments_count}
                                            </Text>
                                            <Text style={createStatLabelStyle(theme)}>Comments</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Approval Actions */}
                                {!selectedPrayer.is_approved && (
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