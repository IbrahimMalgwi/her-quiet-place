// app/(tabs)/PrayerRoomScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
    Animated,
    Easing,
    Dimensions,
    StatusBar,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { prayerService } from '../../services/prayerService';
import { PrayerRequest, CuratedPrayer, CreatePrayerRequest } from '../../types/prayer';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    | 'stats-chart-outline'
    | 'search-outline'
    | 'close-outline'
    | 'filter-outline'
    | 'sparkles'
    | 'lock-closed-outline'
    | 'lock-closed'
    | 'people';

type TabType = 'curated' | 'community' | 'my-prayers';

interface PrayerStats {
    prayedCount: number;
    pendingCount: number;
    approvedCount: number;
    personalPrayersCount: number;
}

export default function PrayerRoomScreen() {
    const theme = useTheme();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<TabType>('curated');
    const [communityPrayers, setCommunityPrayers] = useState<PrayerRequest[]>([]);
    const [curatedPrayers, setCuratedPrayers] = useState<CuratedPrayer[]>([]);
    const [myPrayers, setMyPrayers] = useState<PrayerRequest[]>([]);
    const [filteredPrayers, setFilteredPrayers] = useState<PrayerRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showPrayerModal, setShowPrayerModal] = useState(false);
    const [prayingFor, setPrayingFor] = useState<{ [key: string]: boolean }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Prayer submission state
    const [prayerTitle, setPrayerTitle] = useState('');
    const [prayerContent, setPrayerContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [prayerType, setPrayerType] = useState<'personal' | 'community'>('community'); // NEW

    // Track original values for modal close confirmation
    const [originalPrayerData, setOriginalPrayerData] = useState<{
        title: string;
        content: string;
        isAnonymous: boolean;
        prayerType: 'personal' | 'community';
    } | null>(null);

    // Stats
    const [stats, setStats] = useState<PrayerStats>({
        prayedCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        personalPrayersCount: 0,
    });

    // Animations
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(20))[0];
    const scaleAnim = useState(new Animated.Value(0.9))[0];
    const statsPulse = useState(new Animated.Value(1))[0];

    useEffect(() => {
        loadData();
    }, [activeTab]);

    useFocusEffect(
        useCallback(() => {
            if (communityPrayers.length > 0 || curatedPrayers.length > 0 || myPrayers.length > 0) {
                loadData();
            }
        }, [communityPrayers.length, curatedPrayers.length, myPrayers.length])
    );

    useEffect(() => {
        filterPrayers();
    }, [communityPrayers, myPrayers, searchQuery, activeTab]);

    const loadData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Load all data in parallel for better performance
            const [curatedData, communityData, myPrayersData, prayerStats] = await Promise.all([
                prayerService.getCuratedPrayers(),
                prayerService.getApprovedPrayers(),
                prayerService.getUserPrayers(),
                prayerService.getPrayerStats()
            ]);

            setCuratedPrayers(curatedData);
            setCommunityPrayers(communityData);
            setMyPrayers(myPrayersData);
            setStats({
                prayedCount: prayerStats.prayedCount,
                pendingCount: prayerStats.pendingCount,
                approvedCount: prayerStats.approvedCount,
                personalPrayersCount: prayerStats.personalPrayersCount,
            });

            // Animate in when data loads
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                })
            ]).start();

            // Pulse animation for stats when they update
            Animated.sequence([
                Animated.timing(statsPulse, {
                    toValue: 1.2,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(statsPulse, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();

        } catch (error) {
            console.error('Error loading prayer data:', error);
            Alert.alert('Error', 'Failed to load prayer data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterPrayers = () => {
        if (!searchQuery.trim()) {
            setFilteredPrayers(activeTab === 'community' ? communityPrayers : myPrayers);
            return;
        }

        const prayersToFilter = activeTab === 'community' ? communityPrayers : myPrayers;
        const filtered = prayersToFilter.filter(prayer =>
            prayer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            prayer.content.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setFilteredPrayers(filtered);
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

            // Update local state with animation
            setCommunityPrayers(prev =>
                prev.map(prayer =>
                    prayer.id === prayerId
                        ? { ...prayer, prayer_count: prayer.prayer_count + 1 }
                        : prayer
                )
            );

            // Update stats with animation
            setStats(prev => ({ ...prev, prayedCount: prev.prayedCount + 1 }));

            // Show success feedback
            Alert.alert('Thank You', 'Your prayer has been counted 🙏');
        } catch (error) {
            console.error('Error praying for request:', error);
            Alert.alert('Error', 'Failed to record your prayer');
        } finally {
            setPrayingFor(prev => ({ ...prev, [prayerId]: false }));
        }
    };

    const openPrayerModal = () => {
        setOriginalPrayerData({
            title: prayerTitle,
            content: prayerContent,
            isAnonymous,
            prayerType
        });
        setShowPrayerModal(true);
    };

    const closePrayerModal = (forceClose: boolean = false) => {
        if (submitting || forceClose) {
            setShowPrayerModal(false);
            resetPrayerForm();
            return;
        }

        const hasUnsavedChanges = checkForUnsavedPrayerChanges();

        if (hasUnsavedChanges) {
            Alert.alert(
                'Unsaved Changes',
                'You have unsaved changes. Are you sure you want to discard them?',
                [
                    { text: 'Keep Editing', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => {
                            setShowPrayerModal(false);
                            resetPrayerForm();
                        }
                    },
                ]
            );
        } else {
            setShowPrayerModal(false);
            resetPrayerForm();
        }
    };

    const checkForUnsavedPrayerChanges = (): boolean => {
        if (!originalPrayerData) return false;

        return prayerTitle !== originalPrayerData.title ||
            prayerContent !== originalPrayerData.content ||
            isAnonymous !== originalPrayerData.isAnonymous ||
            prayerType !== originalPrayerData.prayerType;
    };

    const resetPrayerForm = () => {
        setPrayerTitle('');
        setPrayerContent('');
        setIsAnonymous(true);
        setPrayerType('community'); // Reset to community by default
        setSubmitting(false);
        setOriginalPrayerData(null);
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
                prayer_type: prayerType, // NEW: personal or community
            };

            await prayerService.createPrayerRequest(prayerData);

            let message = '';
            if (prayerType === 'personal') {
                message = 'Your personal prayer has been saved. Only you can see this prayer.';
            } else {
                message = 'Your community prayer has been submitted for review. It will be visible to others once approved.';
            }

            Alert.alert('Prayer Submitted', message);
            closePrayerModal(true);
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

    const getPrayerTypeColor = (prayerType: 'personal' | 'community') => {
        return prayerType === 'personal' ? theme.colors.accentPrimary : theme.colors.success;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
            });
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const getDisplayName = (prayer: PrayerRequest) => {
        if (prayer.is_anonymous) return 'Anonymous';
        return prayer.profiles?.display_name || 'User';
    };

    const getWordCount = (text: string) => {
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    };

    const renderTabCard = (tab: TabType) => {
        const isActive = activeTab === tab;
        const getTabInfo = () => {
            switch (tab) {
                case 'curated':
                    return {
                        title: 'Curated Prayers',
                        subtitle: 'Inspirational prayers & scriptures',
                        icon: 'book-outline' as PrayerIconName,
                        color: '#8B5CF6',
                        count: curatedPrayers.length
                    };
                case 'community':
                    return {
                        title: 'Community Prayers',
                        subtitle: 'Pray for others in need',
                        icon: 'people-outline' as PrayerIconName,
                        color: '#10B981',
                        count: communityPrayers.length
                    };
                case 'my-prayers':
                    return {
                        title: 'My Prayers',
                        subtitle: 'Your prayer requests',
                        icon: 'heart-outline' as PrayerIconName,
                        color: '#3B82F6',
                        count: myPrayers.length
                    };
            }
        };

        const tabInfo = getTabInfo();

        return (
            <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                    flex: 1,
                    backgroundColor: isActive ? tabInfo.color + '15' : theme.colors.backgroundCard,
                    borderRadius: theme.BorderRadius.lg,
                    padding: theme.Spacing.md,
                    marginHorizontal: theme.Spacing.xs,
                    borderWidth: 2,
                    borderColor: isActive ? tabInfo.color : theme.colors.border,
                }}
            >
                <View style={{ alignItems: 'center' }}>
                    <View style={{
                        backgroundColor: tabInfo.color + '20',
                        padding: theme.Spacing.sm,
                        borderRadius: theme.BorderRadius.round,
                        marginBottom: theme.Spacing.sm,
                    }}>
                        <Ionicons
                            name={tabInfo.icon}
                            size={16}
                            color={isActive ? tabInfo.color : theme.colors.textSecondary}
                        />
                    </View>

                    <Text style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: isActive ? tabInfo.color : theme.colors.text,
                        textAlign: 'center',
                        marginBottom: 2,
                    }}>
                        {tabInfo.title}
                    </Text>

                    <Text style={{
                        fontSize: 10,
                        color: isActive ? tabInfo.color : theme.colors.textSecondary,
                        textAlign: 'center',
                        marginBottom: theme.Spacing.xs,
                        lineHeight: 12,
                    }}>
                        {tabInfo.subtitle}
                    </Text>

                    <View style={{
                        backgroundColor: isActive ? tabInfo.color : theme.colors.background,
                        paddingHorizontal: theme.Spacing.sm,
                        paddingVertical: 2,
                        borderRadius: theme.BorderRadius.round,
                    }}>
                        <Text style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: isActive ? theme.colors.textInverse : theme.colors.textSecondary,
                        }}>
                            {tabInfo.count}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderPrayerCard = (prayer: PrayerRequest, showPrayButton: boolean = true) => (
        <Animated.View
            key={prayer.id}
            style={[
                theme.card,
                {
                    marginBottom: theme.Spacing.md,
                    opacity: fadeAnim,
                    transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim }
                    ],
                    borderLeftWidth: 4,
                    borderLeftColor: getPrayerTypeColor(prayer.prayer_type),
                }
            ]}
        >
            <View style={[theme.rowBetween, { marginBottom: theme.Spacing.sm }]}>
                <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.colors.text,
                    flex: 1,
                }}>
                    {prayer.title}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }}>
                    {/* Prayer Type Badge */}
                    <View style={{
                        backgroundColor: getPrayerTypeColor(prayer.prayer_type) + '20',
                        paddingHorizontal: theme.Spacing.sm,
                        paddingVertical: 2,
                        borderRadius: theme.BorderRadius.round,
                    }}>
                        <Text style={{
                            fontSize: 10,
                            color: getPrayerTypeColor(prayer.prayer_type),
                            fontWeight: '600',
                        }}>
                            {prayer.prayer_type === 'personal' ? 'Personal' : 'Community'}
                        </Text>
                    </View>

                    {/* Status Badge (only show for community prayers that aren't approved) */}
                    {prayer.prayer_type === 'community' && prayer.status !== 'approved' && (
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
                <View>
                    <Text style={{
                        fontSize: 12,
                        color: theme.colors.textSecondary,
                        marginBottom: 2,
                    }}>
                        {getDisplayName(prayer)} • {formatDate(prayer.created_at)}
                    </Text>
                    <Text style={{
                        fontSize: 11,
                        color: theme.colors.textSecondary,
                    }}>
                        {formatTime(prayer.created_at)} • {getWordCount(prayer.content)} words
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }}>
                        <Ionicons name="heart" size={14} color={theme.colors.accentPrimary} />
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            {prayer.prayer_count}
                        </Text>
                    </View>

                    {showPrayButton && prayer.prayer_type === 'community' && prayer.status === 'approved' && (
                        <TouchableOpacity
                            onPress={() => handlePrayFor(prayer.id)}
                            disabled={prayingFor[prayer.id]}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: theme.Spacing.xs,
                                paddingHorizontal: theme.Spacing.sm,
                                paddingVertical: 4,
                                backgroundColor: theme.colors.accentPrimary + '15',
                                borderRadius: theme.BorderRadius.round,
                            }}
                        >
                            {prayingFor[prayer.id] ? (
                                <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
                            ) : (
                                <Ionicons name="hand-left-outline" size={14} color={theme.colors.accentPrimary} />
                            )}
                            <Text style={{ fontSize: 12, color: theme.colors.accentPrimary, fontWeight: '500' }}>
                                Pray
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Animated.View>
    );

    const renderCuratedPrayerCard = (prayer: CuratedPrayer) => (
        <Animated.View
            key={prayer.id}
            style={[
                theme.card,
                {
                    marginBottom: theme.Spacing.md,
                    opacity: fadeAnim,
                    transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim }
                    ],
                }
            ]}
        >
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
                        fontWeight: '500',
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
                marginBottom: theme.Spacing.sm,
            }}>
                {prayer.content}
            </Text>

            <View style={[theme.rowBetween, { marginTop: 'auto' }]}>
                <Text style={{
                    fontSize: 12,
                    color: theme.colors.textSecondary,
                    textTransform: 'capitalize',
                    fontWeight: '500',
                }}>
                    {prayer.type}
                </Text>
                <Text style={{
                    fontSize: 11,
                    color: theme.colors.textSecondary,
                }}>
                    {getWordCount(prayer.content)} words
                </Text>
            </View>
        </Animated.View>
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
            <StatusBar barStyle={theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header with Stats */}
            <View style={{
                paddingHorizontal: theme.Spacing.md,
                paddingVertical: theme.Spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}>
                <View style={[theme.rowBetween, { marginBottom: theme.Spacing.md }]}>
                    <Text style={{
                        fontSize: 28,
                        fontWeight: 'bold',
                        color: theme.colors.text,
                    }}>
                        Prayer Room
                    </Text>
                    <View style={{ flexDirection: 'row', gap: theme.Spacing.sm }}>
                        {(activeTab === 'community' || activeTab === 'my-prayers') && (
                            <TouchableOpacity
                                onPress={() => setShowSearch(!showSearch)}
                                style={{
                                    padding: theme.Spacing.sm,
                                    backgroundColor: theme.colors.accentPrimary + '15',
                                    borderRadius: theme.BorderRadius.round,
                                }}
                            >
                                <Ionicons name="search-outline" size={20} color={theme.colors.accentPrimary} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={openPrayerModal}
                            style={[theme.button, { flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }]}
                        >
                            <Ionicons name="add" size={16} color={theme.colors.textInverse} />
                            <Text style={[theme.buttonText, { fontSize: 14 }]}>Request Prayer</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                {showSearch && (activeTab === 'community' || activeTab === 'my-prayers') && (
                    <View style={{
                        marginBottom: theme.Spacing.md,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: theme.colors.backgroundCard,
                            borderRadius: theme.BorderRadius.md,
                            paddingHorizontal: theme.Spacing.md,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                        }}>
                            <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
                            <TextInput
                                style={{
                                    flex: 1,
                                    padding: theme.Spacing.md,
                                    fontSize: 16,
                                    color: theme.colors.text,
                                }}
                                placeholder={`Search ${activeTab === 'community' ? 'community' : 'my'} prayers...`}
                                placeholderTextColor={theme.colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            {searchQuery ? (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-outline" size={18} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                )}

                {/* Tab Cards Navigation */}
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: theme.Spacing.md,
                }}>
                    {(['curated', 'community', 'my-prayers'] as TabType[]).map(renderTabCard)}
                </View>

                {/* Stats */}
                <Animated.View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    transform: [{ scale: statsPulse }]
                }}>
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
                    <View style={{ alignItems: 'center' }}>
                        <Ionicons name="lock-closed-outline" size={20} color={theme.colors.accentPrimary} />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text, marginTop: 4 }}>
                            {stats.personalPrayersCount}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            Personal
                        </Text>
                    </View>
                </Animated.View>
            </View>

            {/* Content */}
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
                contentContainerStyle={{ padding: theme.Spacing.md, paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Curated Prayers */}
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
                                lineHeight: 20,
                            }}>
                                Check back later for inspirational prayers and scriptures
                            </Text>
                        </View>
                    ) : (
                        curatedPrayers.map(renderCuratedPrayerCard)
                    )
                )}

                {/* Community Prayers */}
                {activeTab === 'community' && (
                    filteredPrayers.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: theme.Spacing.xl }}>
                            <Ionicons
                                name={searchQuery ? "search-outline" : "people-outline"}
                                size={64}
                                color={theme.colors.textSecondary}
                            />
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: theme.colors.text,
                                marginTop: theme.Spacing.lg,
                                textAlign: 'center',
                            }}>
                                {searchQuery ? 'No matching prayers' : 'No community prayers yet'}
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: theme.colors.textSecondary,
                                marginTop: theme.Spacing.sm,
                                textAlign: 'center',
                                lineHeight: 20,
                            }}>
                                {searchQuery ? 'Try a different search term' : 'Be the first to submit a prayer request'}
                            </Text>
                        </View>
                    ) : (
                        filteredPrayers.map(prayer => renderPrayerCard(prayer, true))
                    )
                )}

                {/* My Prayers */}
                {activeTab === 'my-prayers' && (
                    filteredPrayers.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: theme.Spacing.xl }}>
                            <Ionicons
                                name={searchQuery ? "search-outline" : "heart-outline"}
                                size={64}
                                color={theme.colors.textSecondary}
                            />
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: theme.colors.text,
                                marginTop: theme.Spacing.lg,
                                textAlign: 'center',
                            }}>
                                {searchQuery ? 'No matching prayers' : 'No prayer requests yet'}
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: theme.colors.textSecondary,
                                marginTop: theme.Spacing.sm,
                                textAlign: 'center',
                                lineHeight: 20,
                            }}>
                                {searchQuery ? 'Try a different search term' : 'Submit your first prayer request'}
                            </Text>
                        </View>
                    ) : (
                        filteredPrayers.map(prayer => renderPrayerCard(prayer, false))
                    )
                )}
            </ScrollView>

            {/* Prayer Request Modal */}
            <Modal
                visible={showPrayerModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => closePrayerModal()}
            >
                <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                    {/* Modal Header */}
                    <View style={[theme.rowBetween, {
                        paddingHorizontal: theme.Spacing.md,
                        paddingVertical: theme.Spacing.lg,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                    }]}>
                        <TouchableOpacity
                            onPress={() => closePrayerModal()}
                            disabled={submitting}
                        >
                            <Text style={{
                                color: submitting ? theme.colors.textSecondary : theme.colors.text,
                                fontSize: 16
                            }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
                                Prayer Request
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>
                                {getWordCount(prayerContent)} words
                            </Text>
                        </View>

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
                                minHeight: 200,
                                textAlignVertical: 'top',
                                marginBottom: theme.Spacing.lg,
                                lineHeight: 20,
                            }]}
                            placeholder="Share your prayer request..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={prayerContent}
                            onChangeText={setPrayerContent}
                            multiline
                            numberOfLines={8}
                        />

                        {/* Prayer Type Selection */}
                        <View style={{ marginBottom: theme.Spacing.lg }}>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '500',
                                color: theme.colors.text,
                                marginBottom: theme.Spacing.sm,
                            }}>
                                Prayer Type
                            </Text>

                            <View style={{ flexDirection: 'row', gap: theme.Spacing.sm }}>
                                <TouchableOpacity
                                    onPress={() => setPrayerType('personal')}
                                    style={{
                                        flex: 1,
                                        padding: theme.Spacing.md,
                                        borderRadius: theme.BorderRadius.md,
                                        backgroundColor: prayerType === 'personal'
                                            ? theme.colors.accentPrimary
                                            : theme.colors.backgroundCard,
                                        borderWidth: 2,
                                        borderColor: prayerType === 'personal'
                                            ? theme.colors.accentPrimary
                                            : theme.colors.border,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={20}
                                        color={prayerType === 'personal'
                                            ? theme.colors.textInverse
                                            : theme.colors.textSecondary}
                                    />
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: prayerType === 'personal'
                                            ? theme.colors.textInverse
                                            : theme.colors.text,
                                        marginTop: theme.Spacing.xs,
                                        textAlign: 'center',
                                    }}>
                                        Personal
                                    </Text>
                                    <Text style={{
                                        fontSize: 10,
                                        color: prayerType === 'personal'
                                            ? theme.colors.textInverse + 'CC'
                                            : theme.colors.textSecondary,
                                        marginTop: 2,
                                        textAlign: 'center',
                                        lineHeight: 12,
                                    }}>
                                        Only you can see this
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setPrayerType('community')}
                                    style={{
                                        flex: 1,
                                        padding: theme.Spacing.md,
                                        borderRadius: theme.BorderRadius.md,
                                        backgroundColor: prayerType === 'community'
                                            ? theme.colors.success
                                            : theme.colors.backgroundCard,
                                        borderWidth: 2,
                                        borderColor: prayerType === 'community'
                                            ? theme.colors.success
                                            : theme.colors.border,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Ionicons
                                        name="people-outline"
                                        size={20}
                                        color={prayerType === 'community'
                                            ? theme.colors.textInverse
                                            : theme.colors.textSecondary}
                                    />
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: prayerType === 'community'
                                            ? theme.colors.textInverse
                                            : theme.colors.text,
                                        marginTop: theme.Spacing.xs,
                                        textAlign: 'center',
                                    }}>
                                        Community
                                    </Text>
                                    <Text style={{
                                        fontSize: 10,
                                        color: prayerType === 'community'
                                            ? theme.colors.textInverse + 'CC'
                                            : theme.colors.textSecondary,
                                        marginTop: 2,
                                        textAlign: 'center',
                                        lineHeight: 12,
                                    }}>
                                        Share with others
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

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
                            backgroundColor: prayerType === 'community' ? theme.colors.accentPrimary + '15' : theme.colors.success + '15',
                            padding: theme.Spacing.md,
                            borderRadius: theme.BorderRadius.md,
                            borderLeftWidth: 4,
                            borderLeftColor: prayerType === 'community' ? theme.colors.accentPrimary : theme.colors.success,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.Spacing.sm }}>
                                <Ionicons
                                    name={prayerType === 'community' ? "people" : "lock-closed"}
                                    size={20}
                                    color={prayerType === 'community' ? theme.colors.accentPrimary : theme.colors.success}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: prayerType === 'community' ? theme.colors.accentPrimary : theme.colors.success,
                                        marginBottom: 4,
                                    }}>
                                        {prayerType === 'community' ? 'Community Prayer' : 'Personal Prayer'}
                                    </Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: prayerType === 'community' ? theme.colors.accentPrimary : theme.colors.success,
                                        lineHeight: 16,
                                    }}>
                                        {prayerType === 'community'
                                            ? 'Your prayer will be reviewed before appearing publicly to ensure a safe and supportive environment for everyone.'
                                            : 'This prayer will remain private and only visible to you. No approval needed.'
                                        }
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}