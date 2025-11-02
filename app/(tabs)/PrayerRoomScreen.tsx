// app/(tabs)/PrayerRoomScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { prayerService } from '../../services/prayerService';
import { PrayerRequest, CuratedPrayer, CreatePrayerRequest } from '../../types/prayer';

// Define valid icon names
type PrayerIconName =
    | 'heart-outline'
    | 'heart'
    | 'add'
    | 'people-outline'
    | 'book-outline'
    | 'checkmark-circle-outline'
    | 'time-outline'
    | 'close-circle-outline'
    | 'hand-left-outline'
    | 'stats-chart-outline';

// Updated tab order: Curated first, then Community, then My Prayers
type TabType = 'curated' | 'community' | 'my-prayers';

export default function PrayerRoomScreen() {
    const theme = useTheme();
    const { user } = useAuth();

    // Updated default tab to 'curated'
    const [activeTab, setActiveTab] = useState<TabType>('curated');
    const [communityPrayers, setCommunityPrayers] = useState<PrayerRequest[]>([]);
    const [curatedPrayers, setCuratedPrayers] = useState<CuratedPrayer[]>([]);
    const [myPrayers, setMyPrayers] = useState<PrayerRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showPrayerModal, setShowPrayerModal] = useState(false);
    const [prayingFor, setPrayingFor] = useState<{ [key: string]: boolean }>({});

    // Prayer submission state
    const [prayerTitle, setPrayerTitle] = useState('');
    const [prayerContent, setPrayerContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        prayedCount: 0,
        pendingCount: 0,
        approvedCount: 0,
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Load data based on active tab - updated order
            switch (activeTab) {
                case 'curated':
                    const curatedData = await prayerService.getCuratedPrayers();
                    setCuratedPrayers(curatedData);
                    break;
                case 'community':
                    const communityData = await prayerService.getApprovedPrayers();
                    setCommunityPrayers(communityData);
                    break;
                case 'my-prayers':
                    const myPrayersData = await prayerService.getUserPrayers();
                    setMyPrayers(myPrayersData);
                    break;
            }

            // Load stats
            const prayerStats = await prayerService.getPrayerStats();
            setStats(prayerStats);
        } catch (error) {
            console.error('Error loading prayer data:', error);
            Alert.alert('Error', 'Failed to load prayer data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handlePrayFor = async (prayerId: string) => {
        if (!user) {
            Alert.alert('Sign In Required', 'Please sign in to pray for others');
            return;
        }

        setPrayingFor(prev => ({ ...prev, [prayerId]: true }));

        try {
            await prayerService.prayForRequest(prayerId);

            // Update local state
            setCommunityPrayers(prev =>
                prev.map(prayer =>
                    prayer.id === prayerId
                        ? { ...prayer, prayer_count: prayer.prayer_count + 1 }
                        : prayer
                )
            );

            // Update stats
            setStats(prev => ({ ...prev, prayedCount: prev.prayedCount + 1 }));

            Alert.alert('Thank You', 'Your prayer has been counted 🙏');
        } catch (error) {
            console.error('Error praying for request:', error);
            Alert.alert('Error', 'Failed to record your prayer');
        } finally {
            setPrayingFor(prev => ({ ...prev, [prayerId]: false }));
        }
    };

    const submitPrayerRequest = async () => {
        if (!prayerTitle.trim() || !prayerContent.trim()) {
            Alert.alert('Error', 'Please fill in both title and prayer content');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'Please sign in to submit prayer requests');
            return;
        }

        setSubmitting(true);
        try {
            const prayerData: CreatePrayerRequest = {
                title: prayerTitle.trim(),
                content: prayerContent.trim(),
                is_anonymous: isAnonymous,
            };

            await prayerService.createPrayerRequest(prayerData);

            Alert.alert(
                'Prayer Submitted',
                'Your prayer request has been submitted for review. It will be visible to others once approved.'
            );

            // Reset form
            setPrayerTitle('');
            setPrayerContent('');
            setIsAnonymous(true);
            setShowPrayerModal(false);

            // Refresh data
            loadData();
        } catch (error) {
            console.error('Error submitting prayer:', error);
            Alert.alert('Error', 'Failed to submit prayer request');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIcon = (status: string) => {
        const statusIcons: Record<string, PrayerIconName> = {
            pending: 'time-outline',
            approved: 'checkmark-circle-outline',
            rejected: 'close-circle-outline',
        };
        return statusIcons[status] || 'time-outline';
    };

    const getStatusColor = (status: string) => {
        const statusColors: Record<string, string> = {
            pending: theme.colors.warning,
            approved: theme.colors.success,
            rejected: theme.colors.error,
        };
        return statusColors[status] || theme.colors.textSecondary;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const getDisplayName = (prayer: PrayerRequest) => {
        if (prayer.is_anonymous) return 'Anonymous';
        return prayer.profiles?.display_name || 'User';
    };

    const renderPrayerCard = (prayer: PrayerRequest, showPrayButton: boolean = true) => (
        <View key={prayer.id} style={[theme.card, { marginBottom: theme.Spacing.md }]}>
            <View style={[theme.rowBetween, { marginBottom: theme.Spacing.sm }]}>
                <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.colors.text,
                    flex: 1,
                }}>
                    {prayer.title}
                </Text>
                {prayer.status !== 'approved' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }}>
                        <Ionicons
                            name={getStatusIcon(prayer.status)}
                            size={14}
                            color={getStatusColor(prayer.status)}
                        />
                        <Text style={{
                            fontSize: 12,
                            color: getStatusColor(prayer.status),
                            textTransform: 'capitalize',
                        }}>
                            {prayer.status}
                        </Text>
                    </View>
                )}
            </View>

            <Text style={{
                fontSize: 14,
                color: theme.colors.text,
                lineHeight: 20,
                marginBottom: theme.Spacing.sm,
            }}>
                {prayer.content}
            </Text>

            <View style={[theme.rowBetween, { marginTop: 'auto' }]}>
                <Text style={{
                    fontSize: 12,
                    color: theme.colors.textSecondary,
                }}>
                    {getDisplayName(prayer)} • {formatDate(prayer.created_at)}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }}>
                        <Ionicons name="heart" size={14} color={theme.colors.accentPrimary} />
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            {prayer.prayer_count}
                        </Text>
                    </View>

                    {showPrayButton && (
                        <TouchableOpacity
                            onPress={() => handlePrayFor(prayer.id)}
                            disabled={prayingFor[prayer.id]}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }}
                        >
                            {prayingFor[prayer.id] ? (
                                <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
                            ) : (
                                <Ionicons name="hand-left-outline" size={14} color={theme.colors.accentPrimary} />
                            )}
                            <Text style={{ fontSize: 12, color: theme.colors.accentPrimary }}>
                                Pray
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    const renderCuratedPrayerCard = (prayer: CuratedPrayer) => (
        <View key={prayer.id} style={[theme.card, { marginBottom: theme.Spacing.md }]}>
            <View style={{ marginBottom: theme.Spacing.sm }}>
                <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.colors.text,
                }}>
                    {prayer.title}
                </Text>
                {prayer.category && (
                    <Text style={{
                        fontSize: 12,
                        color: theme.colors.accentPrimary,
                        marginTop: 2,
                    }}>
                        {prayer.category}
                    </Text>
                )}
            </View>

            <Text style={{
                fontSize: 14,
                color: theme.colors.text,
                lineHeight: 20,
                fontStyle: prayer.type === 'scripture' ? 'normal' : 'italic',
            }}>
                {prayer.content}
            </Text>

            <Text style={{
                fontSize: 12,
                color: theme.colors.textSecondary,
                marginTop: theme.Spacing.sm,
                textTransform: 'capitalize',
            }}>
                {prayer.type}
            </Text>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                <Text style={{ marginTop: theme.Spacing.md, color: theme.colors.text }}>
                    Loading prayers...
                </Text>
            </View>
        );
    }

    return (
        <View style={theme.screen}>
            {/* Header with Stats */}
            <View style={{
                paddingHorizontal: theme.Spacing.md,
                paddingVertical: theme.Spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}>
                <View style={[theme.rowBetween, { marginBottom: theme.Spacing.md }]}>
                    <Text style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: theme.colors.text,
                    }}>
                        Prayer Room
                    </Text>
                    <TouchableOpacity
                        onPress={() => setShowPrayerModal(true)}
                        style={[theme.button, { flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }]}
                    >
                        <Ionicons name="add" size={16} color={theme.colors.textInverse} />
                        <Text style={[theme.buttonText, { fontSize: 14 }]}>Request Prayer</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <View style={{ alignItems: 'center' }}>
                        <Ionicons name="heart" size={20} color={theme.colors.accentPrimary} />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text, marginTop: 4 }}>
                            {stats.prayedCount}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            Prayed For
                        </Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <Ionicons name="time-outline" size={20} color={theme.colors.warning} />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text, marginTop: 4 }}>
                            {stats.pendingCount}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            Pending
                        </Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text, marginTop: 4 }}>
                            {stats.approvedCount}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            Approved
                        </Text>
                    </View>
                </View>
            </View>

            {/* Tab Navigation - Updated Order: Curated -> Community -> My Prayers */}
            <View style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}>
                {(['curated', 'community', 'my-prayers'] as TabType[]).map((tab) => (
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
                            {tab === 'curated' && 'Curated Prayers'}
                            {tab === 'community' && 'Community Prayers'}
                            {tab === 'my-prayers' && 'My Prayers'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content - Updated Order to Match Tabs */}
            <ScrollView
                style={{ flex: 1 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.accentPrimary]}
                        tintColor={theme.colors.accentPrimary}
                    />
                }
                contentContainerStyle={{ padding: theme.Spacing.md }}
            >
                {/* Curated Prayers First */}
                {activeTab === 'curated' && (
                    curatedPrayers.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: theme.Spacing.xl }}>
                            <Ionicons name="book-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: theme.colors.text,
                                marginTop: theme.Spacing.lg,
                                textAlign: 'center',
                            }}>
                                No curated prayers yet
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: theme.colors.textSecondary,
                                marginTop: theme.Spacing.sm,
                                textAlign: 'center',
                            }}>
                                Check back later for inspirational prayers
                            </Text>
                        </View>
                    ) : (
                        curatedPrayers.map(renderCuratedPrayerCard)
                    )
                )}

                {/* Community Prayers Second */}
                {activeTab === 'community' && (
                    communityPrayers.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: theme.Spacing.xl }}>
                            <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: theme.colors.text,
                                marginTop: theme.Spacing.lg,
                                textAlign: 'center',
                            }}>
                                No community prayers yet
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: theme.colors.textSecondary,
                                marginTop: theme.Spacing.sm,
                                textAlign: 'center',
                            }}>
                                Be the first to submit a prayer request
                            </Text>
                        </View>
                    ) : (
                        communityPrayers.map(prayer => renderPrayerCard(prayer, true))
                    )
                )}

                {/* My Prayers Third */}
                {activeTab === 'my-prayers' && (
                    myPrayers.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: theme.Spacing.xl }}>
                            <Ionicons name="heart-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: theme.colors.text,
                                marginTop: theme.Spacing.lg,
                                textAlign: 'center',
                            }}>
                                No prayer requests yet
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: theme.colors.textSecondary,
                                marginTop: theme.Spacing.sm,
                                textAlign: 'center',
                            }}>
                                Submit your first prayer request
                            </Text>
                        </View>
                    ) : (
                        myPrayers.map(prayer => renderPrayerCard(prayer, false))
                    )
                )}
            </ScrollView>

            {/* Prayer Request Modal */}
            <Modal
                visible={showPrayerModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowPrayerModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                    {/* Modal Header */}
                    <View style={[theme.rowBetween, {
                        paddingHorizontal: theme.Spacing.md,
                        paddingVertical: theme.Spacing.lg,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                    }]}>
                        <TouchableOpacity onPress={() => setShowPrayerModal(false)} disabled={submitting}>
                            <Text style={{
                                color: submitting ? theme.colors.textSecondary : theme.colors.text,
                                fontSize: 16
                            }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
                            Prayer Request
                        </Text>

                        <TouchableOpacity
                            onPress={submitPrayerRequest}
                            disabled={submitting || !prayerTitle.trim() || !prayerContent.trim()}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
                            ) : (
                                <Text style={{
                                    color: (prayerTitle.trim() && prayerContent.trim())
                                        ? theme.colors.accentPrimary
                                        : theme.colors.textSecondary,
                                    fontSize: 16,
                                    fontWeight: '600'
                                }}>
                                    Submit
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Modal Content */}
                    <ScrollView style={{ flex: 1, padding: theme.Spacing.md }}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: theme.colors.text,
                            marginBottom: theme.Spacing.sm,
                        }}>
                            Prayer Title
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
                            placeholder="Brief title for your prayer request"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={prayerTitle}
                            onChangeText={setPrayerTitle}
                            maxLength={100}
                        />

                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: theme.colors.text,
                            marginBottom: theme.Spacing.sm,
                        }}>
                            Prayer Content
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
                                minHeight: 150,
                                textAlignVertical: 'top',
                                marginBottom: theme.Spacing.lg,
                            }]}
                            placeholder="Share your prayer request... (will be reviewed before appearing publicly)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={prayerContent}
                            onChangeText={setPrayerContent}
                            multiline
                            numberOfLines={6}
                        />

                        <TouchableOpacity
                            onPress={() => setIsAnonymous(!isAnonymous)}
                            style={[theme.row, { marginBottom: theme.Spacing.lg }]}
                        >
                            <Ionicons
                                name={isAnonymous ? "checkbox-outline" : "square-outline"}
                                size={20}
                                color={isAnonymous ? theme.colors.accentPrimary : theme.colors.textSecondary}
                            />
                            <Text style={{
                                marginLeft: theme.Spacing.sm,
                                color: theme.colors.text,
                                fontSize: 14,
                            }}>
                                Post anonymously
                            </Text>
                        </TouchableOpacity>

                        <View style={{
                            backgroundColor: theme.colors.accentPrimary + '15',
                            padding: theme.Spacing.md,
                            borderRadius: theme.BorderRadius.md,
                        }}>
                            <Text style={{
                                fontSize: 12,
                                color: theme.colors.accentPrimary,
                                lineHeight: 16,
                            }}>
                                💫 Your prayer request will be reviewed before appearing publicly to ensure a safe and supportive environment for everyone.
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}