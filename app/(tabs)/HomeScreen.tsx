// app/(tabs)/HomeScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    Share,
    Alert,
    Animated,
    Modal,
    StatusBar,
    Platform,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../constants/theme";
import { useFocusEffect } from "@react-navigation/native";
import { streakService, UserStreak } from "../../services/streakService";
import { router } from "expo-router";
import { profileService } from "../../services/profileService";

interface DailyItem {
    id: string;
    title?: string;
    message: string;
    author?: string;
    created_at: string;
    type: 'quote' | 'verse' | 'prayer';
    is_favorited?: boolean;
    favorite_id?: string;
}

interface DailyAffirmation {
    id: string;
    affirmation_text: string;
    category: string;
}

// Helper function to enhance items with favorite data
const enhanceItemWithFavorites = (item: any, favorites: any[]): DailyItem => {
    const favorite = favorites.find(fav => fav.quote_id === item.id);
    return {
        ...item,
        is_favorited: !!favorite,
        favorite_id: favorite?.id
    };
};

const isPersistedDailyItem = (item: DailyItem | null | undefined): item is DailyItem =>
    !!item && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id);

export default function HomeScreen() {
    const theme = useTheme();
    const { user, signOut } = useAuth();
    const [dailyItems, setDailyItems] = useState<{
        quote: DailyItem | null;
        verse: DailyItem | null;
        prayer: DailyItem | null;
    }>({
        quote: null,
        verse: null,
        prayer: null
    });
    const [loading, setLoading] = useState(true);
    const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
    const [profileName, setProfileName] = useState<string | null>(null);
    const [todaysAffirmation, setTodaysAffirmation] = useState<DailyAffirmation | null>(null);
    const [expandedContent, setExpandedContent] = useState<'quote' | 'verse' | 'prayer' | 'affirmation' | null>(null);

    // Animation refs
    const streakPulse = useRef(new Animated.Value(1)).current;

    const fetchUserProfile = useCallback(async () => {
        if (!user) {
            setProfileName(null);
            return;
        }

        try {
            const profile = await profileService.getProfile(user.id);
            setProfileName(profile?.full_name?.trim() || null);
        } catch (error) {
            console.error('Error fetching profile for greeting:', error);
            setProfileName(null);
        }
    }, [user]);

    // Reset data when user logs out
    useFocusEffect(
        useCallback(() => {
            if (!user) {
                console.log('User logged out, resetting home screen data');
                setDailyItems({
                    quote: null,
                    verse: null,
                    prayer: null
                });
                setUserStreak(null);
                setProfileName(null);
                setTodaysAffirmation(null);
                setLoading(false);
            } else {
                void fetchUserProfile();
            }
        }, [fetchUserProfile, user])
    );

    // Fetch all data on component mount and when user changes
    useEffect(() => {
        console.log('HomeScreen mounted or user changed, fetching data...');
        if (user) {
            fetchAllData();
        } else {
            setLoading(false);
        }
        // Fetch functions deliberately use the latest render's user and animation state.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchAllData = async () => {
        if (!user) {
            console.log('No user, skipping data fetch');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('Starting to fetch all data...');

            await Promise.all([
                fetchDailyItems(),
                fetchTodaysAffirmation(),
                fetchUserStreak(),
                fetchUserProfile(),
            ]);

            console.log('All data fetched successfully');
        } catch (error) {
            console.error('Error fetching all data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyItems = async () => {
        try {
            console.log('Fetching daily items...');

            // Get items from each category
            const quotePromise = supabase
                .from('daily_strength')
                .select('id, title, message, author, created_at, type')
                .eq('is_active', true)
                .eq('type', 'quote')
                .order('created_at', { ascending: false })
                .limit(1);

            const versePromise = supabase
                .from('daily_strength')
                .select('id, title, message, author, created_at, type')
                .eq('is_active', true)
                .eq('type', 'verse')
                .order('created_at', { ascending: false })
                .limit(1);

            const prayerPromise = supabase
                .from('daily_strength')
                .select('id, title, message, author, created_at, type')
                .eq('is_active', true)
                .eq('type', 'prayer')
                .order('created_at', { ascending: false })
                .limit(1);

            const [quoteResponse, verseResponse, prayerResponse] = await Promise.all([
                quotePromise,
                versePromise,
                prayerPromise
            ]);

            console.log('Quote response:', quoteResponse);
            console.log('Verse response:', verseResponse);
            console.log('Prayer response:', prayerResponse);

            // Handle responses and use fallbacks if needed
            let quoteData: DailyItem | null = quoteResponse.data && quoteResponse.data.length > 0
                ? quoteResponse.data[0]
                : getFallbackQuote();

            let verseData: DailyItem | null = verseResponse.data && verseResponse.data.length > 0
                ? verseResponse.data[0]
                : getFallbackVerse();

            let prayerData: DailyItem | null = prayerResponse.data && prayerResponse.data.length > 0
                ? prayerResponse.data[0]
                : getFallbackPrayer();

            // Check favorites if user is logged in
            if (user && (quoteData || verseData || prayerData)) {
                console.log('User is logged in, checking favorites...');
                const itemIds = [quoteData, verseData, prayerData]
                    .filter(isPersistedDailyItem)
                    .map(item => item.id);

                if (itemIds.length > 0) {
                    const { data: favorites, error: favoritesError } = await supabase
                        .from('user_favorites')
                        .select('id, quote_id')
                        .eq('user_id', user.id)
                        .in('quote_id', itemIds);

                    if (favoritesError) {
                        console.error('Error fetching favorites:', favoritesError);
                    } else {
                        console.log('Found favorites:', favorites);

                        if (quoteData) {
                            quoteData = enhanceItemWithFavorites(quoteData, favorites || []);
                        }
                        if (verseData) {
                            verseData = enhanceItemWithFavorites(verseData, favorites || []);
                        }
                        if (prayerData) {
                            prayerData = enhanceItemWithFavorites(prayerData, favorites || []);
                        }
                    }
                }
            }

            setDailyItems({
                quote: quoteData,
                verse: verseData,
                prayer: prayerData
            });

            console.log('Final daily items set:', {
                quote: quoteData,
                verse: verseData,
                prayer: prayerData
            });

        } catch (error) {
            console.error('Error fetching daily items:', error);
            // Set fallback data
            setDailyItems({
                quote: getFallbackQuote(),
                verse: getFallbackVerse(),
                prayer: getFallbackPrayer()
            });
        }
    };

    const fetchTodaysAffirmation = async () => {
        try {
            console.log('Fetching affirmations...');
            const { data, error } = await supabase
                .from('daily_affirmations')
                .select('id, affirmation_text, category, used_count')
                .eq('is_active', true)
                .limit(50);

            if (error) {
                console.error('Error fetching affirmations:', error);
                throw error;
            }

            console.log('Affirmations found:', data);

            if (data && data.length > 0) {
                const randomAffirmation = data[Math.floor(Math.random() * data.length)];
                console.log('Selected affirmation:', randomAffirmation);
                setTodaysAffirmation({
                    id: randomAffirmation.id,
                    affirmation_text: randomAffirmation.affirmation_text,
                    category: randomAffirmation.category
                });

                // Update used count
                supabase
                    .rpc('increment_affirmation_use', { target_affirmation_id: randomAffirmation.id })
                    .then(({ error }) => {
                        if (error) console.error('Error updating affirmation count:', error);
                    });
            } else {
                console.log('No affirmations found, using fallback');
                setTodaysAffirmation({
                    id: 'fallback',
                    affirmation_text: "You are stronger than you think, braver than you believe, and loved more than you know. Today, walk in that truth.",
                    category: 'general'
                });
            }
        } catch (error) {
            console.error('Error fetching affirmation:', error);
            setTodaysAffirmation({
                id: 'fallback',
                affirmation_text: "Your peace is precious. Protect it, nurture it, and let it guide your day.",
                category: 'general'
            });
        }
    };

    const getFallbackQuote = (): DailyItem => ({
        id: 'fallback-quote-1',
        title: 'Daily Inspiration',
        message: 'Every new day is a blank page in the diary of your life. Write a great story today.',
        author: 'Unknown',
        created_at: new Date().toISOString(),
        type: 'quote'
    });

    const getFallbackVerse = (): DailyItem => ({
        id: 'fallback-verse-1',
        message: 'The Lord is my strength and my shield; my heart trusts in him, and he helps me.',
        author: 'Psalm 28:7',
        created_at: new Date().toISOString(),
        type: 'verse'
    });

    const getFallbackPrayer = (): DailyItem => ({
        id: 'fallback-prayer-1',
        title: 'Morning Prayer',
        message: 'Lord, grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference.',
        author: 'Serenity Prayer',
        created_at: new Date().toISOString(),
        type: 'prayer'
    });

    const fetchUserStreak = async () => {
        if (!user) {
            console.log('No user, skipping streak fetch');
            return;
        }

        try {
            console.log('Fetching user streak for user:', user.id);
            const streakData = await streakService.recordLoginDay();

            if (streakData) {
                setUserStreak(streakData);
                console.log('Streak loaded:', streakData);

                if (streakData.current_streak > 0) {
                    if (streakData.current_streak % 7 === 0 || streakData.current_streak === 1) {
                        Animated.sequence([
                            Animated.timing(streakPulse, {
                                toValue: 1.3,
                                duration: 300,
                                useNativeDriver: true,
                            }),
                            Animated.timing(streakPulse, {
                                toValue: 1,
                                duration: 300,
                                useNativeDriver: true,
                            })
                        ]).start();
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching streak:', error);
        }
    };

    const handleRefresh = () => {
        console.log('Manual refresh triggered');
        void fetchAllData().finally(() => {
            console.log('Manual refresh completed');
        });
    };

    const refreshAffirmation = async () => {
        console.log('Refreshing affirmation...');
        await fetchTodaysAffirmation();
    };

    const handleShare = async (item: DailyItem) => {
        try {
            const shareMessage = item.title
                ? `"${item.message}"\n\n- ${item.author || 'Unknown'}\n\n${item.title}\n\nShared from Her Quiet Place App 🌸`
                : `"${item.message}"\n\n- ${item.author || 'Unknown'}\n\nShared from Her Quiet Place App 🌸`;

            await Share.share({
                message: shareMessage,
                title: item.title || 'Daily Strength'
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const toggleFavorite = async (itemId: string, itemType: 'quote' | 'verse' | 'prayer') => {
        if (!user) {
            Alert.alert("Sign In Required", "Please sign in to save favorites");
            return;
        }

        const currentItem = dailyItems[itemType];
        if (!isPersistedDailyItem(currentItem)) {
            Alert.alert("Unavailable", "Fallback content cannot be saved. Please try again after refreshing.");
            return;
        }

        try {
            if (currentItem.is_favorited && currentItem.favorite_id) {
                // Remove favorite
                await supabase
                    .from('user_favorites')
                    .delete()
                    .eq('id', currentItem.favorite_id);

                setDailyItems(prev => ({
                    ...prev,
                    [itemType]: {
                        ...currentItem,
                        is_favorited: false,
                        favorite_id: undefined
                    }
                }));
            } else {
                // Add favorite
                const { data, error } = await supabase
                    .from('user_favorites')
                    .insert([{ user_id: user.id, quote_id: itemId }])
                    .select()
                    .single();

                if (error) throw error;

                setDailyItems(prev => ({
                    ...prev,
                    [itemType]: {
                        ...currentItem,
                        is_favorited: true,
                        favorite_id: data.id
                    }
                }));
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            Alert.alert("Error", "Failed to update favorites");
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'prayer': return 'heart-outline';
            case 'verse': return 'book-outline';
            default: return 'chatbubble-outline';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'prayer': return theme.colors.accentPrimary;
            case 'verse': return theme.colors.accentDeep;
            default: return theme.colors.accentPrimary;
        }
    };

    const getTypeTitle = (type: string) => {
        switch (type) {
            case 'prayer': return 'Daily Prayer';
            case 'verse': return 'Daily Verse';
            default: return 'Daily Quote';
        }
    };

    const getStreakMessage = (streak: number) => {
        if (streak === 0) return "Start your journey!";
        if (streak === 1) return "Great start!";
        if (streak < 7) return `${streak} day streak`;
        if (streak < 30) return `${streak} days strong`;
        return `${streak} days amazing!`;
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'strength': return 'fitness-outline';
            case 'peace': return 'leaf-outline';
            case 'faith': return 'heart-outline';
            case 'hope': return 'sunny-outline';
            default: return 'sparkles-outline';
        }
    };

    // Add this function to handle manual logout from home screen if needed
    const handleLogout = async () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error) {
                            console.error('Error during logout:', error);
                        }
                    }
                }
            ]
        );
    };

    const renderDailyItem = (item: DailyItem | null, type: 'quote' | 'verse' | 'prayer') => {
        if (!item) return null;

        return (
            <TouchableOpacity
                key={type}
                activeOpacity={0.86}
                onPress={() => setExpandedContent(type)}
                style={{
                    backgroundColor: theme.colors.backgroundCard,
                    borderRadius: theme.BorderRadius.xl,
                    padding: theme.Spacing.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.white,
                    shadowColor: theme.colors.accentDeep,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.08,
                    shadowRadius: 18,
                    elevation: 3,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm }}>
                        <Ionicons name={getTypeIcon(type)} size={22} color={getTypeColor(type)} />
                        <Text style={{ color: theme.colors.text, fontSize: 19, fontWeight: '800' }}>
                            {getTypeTitle(type)}
                        </Text>
                    </View>
                    <Text style={{ color: getTypeColor(type), fontSize: 13, fontWeight: '700' }}>See All</Text>
                </View>

                <Text
                    numberOfLines={5}
                    style={{
                        color: theme.colors.text,
                        fontSize: 17,
                        lineHeight: 28,
                        marginTop: theme.Spacing.lg,
                    }}
                >
                    &ldquo;{item.message}&rdquo;
                </Text>

                {item.author && (
                    <Text style={{
                        color: theme.colors.accentDeep,
                        fontSize: 16,
                        fontWeight: '700',
                        marginTop: theme.Spacing.md,
                    }}>
                        - {item.author}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    const renderFeatureTile = (
        icon: React.ComponentProps<typeof Ionicons>['name'],
        title: string,
        subtitle: string,
        onPress: () => void,
    ) => (
        <TouchableOpacity
            activeOpacity={0.86}
            onPress={onPress}
            style={{
                width: '48%',
                minHeight: 132,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.backgroundCard,
                borderRadius: theme.BorderRadius.xl,
                padding: theme.Spacing.md,
                borderWidth: 1,
                borderColor: theme.colors.white,
                shadowColor: theme.colors.accentDeep,
                shadowOffset: { width: 0, height: 7 },
                shadowOpacity: 0.07,
                shadowRadius: 16,
                elevation: 2,
            }}
        >
            <Ionicons name={icon} size={46} color={theme.colors.accentPrimary} />
            <Text style={{
                color: theme.colors.text,
                fontSize: 19,
                fontWeight: '800',
                marginTop: theme.Spacing.sm,
                textAlign: 'center',
            }}>
                {title}
            </Text>
            <Text style={{
                color: theme.colors.textSecondary,
                fontSize: 13,
                marginTop: theme.Spacing.xs,
                textAlign: 'center',
            }}>
                {subtitle}
            </Text>
        </TouchableOpacity>
    );

    const getGreetingName = () => {
        const metadataName = user?.user_metadata?.full_name || user?.user_metadata?.name;
        const emailName = user?.email?.split('@')[0];
        const rawName = profileName || metadataName || emailName || 'Beautiful';
        return String(rawName).split(/[ ._-]/)[0] || 'Beautiful';
    };

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();

        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getStartOfLocalDay = (date: Date) =>
        new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const addDays = (date: Date, days: number) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + days);
        return getStartOfLocalDay(nextDate);
    };

    const parseStreakDate = (dateString?: string) => {
        if (!dateString) return getStartOfLocalDay(new Date());

        const [year, month, day] = dateString.split('-').map(Number);
        if (!year || !month || !day) return getStartOfLocalDay(new Date());

        return new Date(year, month - 1, day);
    };

    const getRecentStreakDays = () => {
        const today = getStartOfLocalDay(new Date());
        const currentStreak = userStreak?.current_streak || 0;
        const lastVisit = currentStreak > 0 ? parseStreakDate(userStreak?.last_visit_date) : null;
        const streakStart = lastVisit ? addDays(lastVisit, -(currentStreak - 1)) : null;

        return Array.from({ length: 7 }, (_, index) => {
            const date = addDays(today, index - 6);
            const isComplete = Boolean(
                streakStart &&
                lastVisit &&
                date.getTime() >= streakStart.getTime() &&
                date.getTime() <= lastVisit.getTime()
            );

            return {
                key: date.toISOString(),
                label: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
                isComplete,
                isToday: date.getTime() === today.getTime(),
            };
        });
    };

    const renderStreakCard = () => {
        const days = getRecentStreakDays();
        const currentStreak = userStreak?.current_streak || 0;

        return (
            <View style={{
                backgroundColor: theme.colors.backgroundCard,
                borderRadius: theme.BorderRadius.xl,
                padding: theme.Spacing.lg,
                borderWidth: 1,
                borderColor: theme.colors.white,
                shadowColor: theme.colors.accentDeep,
                shadowOffset: { width: 0, height: 7 },
                shadowOpacity: 0.07,
                shadowRadius: 16,
                elevation: 2,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.colors.text, fontSize: 19, fontWeight: '800' }}>Your Streak</Text>
                    <Text style={{ color: theme.colors.accentDeep, fontSize: 18, fontWeight: '700' }}>
                        {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
                    </Text>
                </View>
                <Text style={{
                    color: theme.colors.textSecondary,
                    fontSize: 12,
                    marginTop: theme.Spacing.xs,
                }}>
                    Longest: {userStreak?.longest_streak || 0} days | Total visits: {userStreak?.total_visits || 0}
                </Text>

                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: theme.Spacing.lg,
                }}>
                    {days.map(day => {
                        return (
                            <View key={day.key} style={{ alignItems: 'center', flex: 1 }}>
                                <View style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 17,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: day.isComplete ? theme.colors.accentPrimary : theme.colors.backgroundCard,
                                    borderWidth: 2,
                                    borderColor: day.isToday
                                        ? theme.colors.accentDeep
                                        : day.isComplete
                                            ? theme.colors.accentPrimary
                                            : theme.colors.accentSecondary,
                                }}>
                                    {day.isComplete && <Ionicons name="checkmark" size={20} color={theme.colors.white} />}
                                </View>
                                <Text style={{
                                    color: day.isToday ? theme.colors.accentDeep : theme.colors.textSecondary,
                                    fontSize: 13,
                                    fontWeight: '700',
                                    marginTop: theme.Spacing.sm,
                                }}>
                                    {day.label}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderExpandedContent = () => {
        if (!expandedContent) return null;

        const isAffirmation = expandedContent === 'affirmation';
        const dailyType = isAffirmation ? null : expandedContent;
        const item = dailyType ? dailyItems[dailyType] : null;

        if (dailyType && !item) return null;

        const color = isAffirmation ? theme.colors.accentPrimary : getTypeColor(expandedContent);
        const title = isAffirmation ? 'Daily Affirmation' : getTypeTitle(expandedContent);

        return (
            <Modal
                visible
                animationType="slide"
                transparent
                onRequestClose={() => setExpandedContent(null)}
            >
                <View style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    backgroundColor: theme.colors.overlay,
                }}>
                    <View style={{
                        maxHeight: '82%',
                        backgroundColor: theme.colors.backgroundModal,
                        borderTopLeftRadius: theme.BorderRadius.xl,
                        borderTopRightRadius: theme.BorderRadius.xl,
                        padding: theme.Spacing.lg,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: theme.Spacing.md,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm }}>
                                <Ionicons
                                    name={isAffirmation ? getCategoryIcon(todaysAffirmation?.category || 'general') : getTypeIcon(expandedContent)}
                                    size={22}
                                    color={color}
                                />
                                <Text style={{ color, fontSize: 16, fontWeight: '700' }}>{title}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setExpandedContent(null)}>
                                <Ionicons name="close" size={26} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {!isAffirmation && item?.title && (
                                <Text style={{
                                    color: theme.colors.text,
                                    fontSize: 22,
                                    fontWeight: '700',
                                    marginBottom: theme.Spacing.md,
                                }}>
                                    {item.title}
                                </Text>
                            )}

                            <Text style={{
                                color: theme.colors.text,
                                fontSize: 17,
                                lineHeight: 27,
                                fontStyle: isAffirmation ? 'italic' : 'normal',
                            }}>
                                {isAffirmation ? todaysAffirmation?.affirmation_text : item?.message}
                            </Text>

                            {!isAffirmation && item?.author && (
                                <Text style={{
                                    color: theme.colors.textSecondary,
                                    fontSize: 14,
                                    fontStyle: 'italic',
                                    fontWeight: '600',
                                    marginTop: theme.Spacing.md,
                                }}>
                                    - {item.author}
                                </Text>
                            )}

                            <View style={{
                                flexDirection: 'row',
                                gap: theme.Spacing.sm,
                                marginTop: theme.Spacing.lg,
                                paddingBottom: theme.Spacing.md,
                            }}>
                                {isAffirmation ? (
                                    <TouchableOpacity
                                        style={[theme.button, { flex: 1, flexDirection: 'row', gap: theme.Spacing.sm }]}
                                        onPress={() => {
                                            void refreshAffirmation();
                                            setExpandedContent(null);
                                        }}
                                    >
                                        <Ionicons name="refresh" size={18} color={theme.colors.textInverse} />
                                        <Text style={theme.buttonText}>New Affirmation</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            style={[theme.buttonOutline, { flex: 1, flexDirection: 'row', gap: theme.Spacing.sm }]}
                                            onPress={() => void handleShare(item!)}
                                        >
                                            <Ionicons name="share-outline" size={18} color={theme.colors.accentPrimary} />
                                            <Text style={theme.buttonTextOutline}>Share</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[theme.button, { flex: 1, flexDirection: 'row', gap: theme.Spacing.sm }]}
                                            onPress={() => void toggleFavorite(item!.id, dailyType!)}
                                            disabled={!isPersistedDailyItem(item)}
                                        >
                                            <Ionicons
                                                name={item!.is_favorited ? 'bookmark' : 'bookmark-outline'}
                                                size={18}
                                                color={theme.colors.textInverse}
                                            />
                                            <Text style={theme.buttonText}>
                                                {!isPersistedDailyItem(item) ? 'Unavailable' : item!.is_favorited ? 'Saved' : 'Save'}
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    if (loading) {
        return (
            <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                <Text style={{
                    marginTop: theme.Spacing.md,
                    color: theme.colors.text,
                    fontSize: 16
                }}>
                    Loading your daily strength...
                </Text>
            </View>
        );
    }

    console.log('Rendering HomeScreen with data:', { dailyItems, todaysAffirmation, userStreak });

    return (
        <View style={theme.screen}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
            <View style={{
                position: 'absolute',
                top: -120,
                right: -95,
                width: 250,
                height: 250,
                borderRadius: 125,
                backgroundColor: theme.colors.accentSecondary + '35',
            }} />
            <View style={{
                position: 'absolute',
                top: 260,
                left: -100,
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: theme.colors.white + '70',
            }} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: Platform.OS === 'ios' ? 70 : 48,
                    paddingHorizontal: theme.Spacing.lg,
                    paddingBottom: 128,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                        onPress={handleRefresh}
                        activeOpacity={0.8}
                        style={{ paddingVertical: theme.Spacing.sm, paddingRight: theme.Spacing.md }}
                    >
                        <Ionicons name="menu" size={34} color={theme.colors.accentPrimary} />
                    </TouchableOpacity>

                    {user && (
                        <TouchableOpacity
                            onPress={handleLogout}
                            activeOpacity={0.8}
                            style={{ padding: theme.Spacing.sm }}
                        >
                            <Ionicons name="log-out-outline" size={28} color={theme.colors.accentDeep} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ marginTop: theme.Spacing.xl, marginBottom: theme.Spacing.xl }}>
                    <Text style={{
                        color: theme.colors.text,
                        fontSize: 30,
                        fontWeight: '500',
                        letterSpacing: -0.4,
                    }}>
                        {getTimeBasedGreeting()},
                    </Text>
                    <Text style={{
                        color: theme.colors.accentPrimary,
                        fontSize: 44,
                        fontWeight: '400',
                        fontStyle: 'italic',
                        lineHeight: 52,
                        fontFamily: Platform.select({ ios: 'Snell Roundhand', web: 'cursive' }),
                    }}>
                        {getGreetingName()}
                    </Text>

                    {userStreak && userStreak.current_streak > 0 && (
                        <Animated.View
                            style={[
                                {
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    alignSelf: 'flex-start',
                                    backgroundColor: theme.colors.white + 'B8',
                                    paddingHorizontal: theme.Spacing.md,
                                    paddingVertical: theme.Spacing.sm,
                                    borderRadius: theme.BorderRadius.round,
                                    marginTop: theme.Spacing.sm,
                                },
                                { transform: [{ scale: streakPulse }] }
                            ]}
                        >
                            <Ionicons name="flame" size={15} color={theme.colors.gold} />
                            <Text style={{
                                color: theme.colors.accentDeep,
                                fontSize: 12,
                                fontWeight: '800',
                                marginLeft: theme.Spacing.xs,
                            }}>
                                {getStreakMessage(userStreak.current_streak)}
                            </Text>
                        </Animated.View>
                    )}
                </View>

                <View style={{ marginBottom: theme.Spacing.lg }}>
                    {renderDailyItem(dailyItems.verse || dailyItems.quote || dailyItems.prayer, dailyItems.verse ? 'verse' : dailyItems.quote ? 'quote' : 'prayer')}
                </View>

                <View style={{
                    position: 'absolute',
                    top: 275,
                    right: theme.Spacing.lg,
                    width: 122,
                    height: 122,
                    opacity: 0.18,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Ionicons name="flower-outline" size={74} color={theme.colors.accentPrimary} />
                    <Ionicons name="leaf-outline" size={44} color={theme.colors.gold} style={{ position: 'absolute', right: 8, bottom: 12, transform: [{ rotate: '24deg' }] }} />
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: theme.Spacing.md }}>
                    {renderFeatureTile('hand-left-outline', 'Prayer Room', 'Pray & be prayed for', () => router.push('/(tabs)/PrayerRoomScreen'))}
                    {renderFeatureTile('journal-outline', 'Journal', 'Write & reflect', () => router.push('/(tabs)/JournalScreen'))}
                    {renderFeatureTile('headset-outline', 'Audio Comfort', 'Listen & be encouraged', () => router.push('/(tabs)/AudioRoomScreen'))}
                    {renderFeatureTile('sunny-outline', 'Daily Strength', 'Verse, quotes & more', () => setExpandedContent(dailyItems.quote ? 'quote' : dailyItems.prayer ? 'prayer' : 'affirmation'))}
                </View>

                <View style={{ marginTop: theme.Spacing.lg }}>
                    {renderStreakCard()}
                </View>

                {todaysAffirmation && (
                    <TouchableOpacity
                        activeOpacity={0.86}
                        onPress={() => setExpandedContent('affirmation')}
                        style={{
                            marginTop: theme.Spacing.lg,
                            backgroundColor: theme.colors.accentSecondary + '35',
                            borderRadius: theme.BorderRadius.xl,
                            padding: theme.Spacing.lg,
                            borderWidth: 1,
                            borderColor: theme.colors.white,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm }}>
                            <Ionicons
                                name={getCategoryIcon(todaysAffirmation.category)}
                                size={20}
                                color={theme.colors.accentPrimary}
                            />
                            <Text style={{ color: theme.colors.accentDeep, fontSize: 16, fontWeight: '800' }}>
                                Daily Affirmation
                            </Text>
                        </View>
                        <Text
                            numberOfLines={3}
                            style={{
                                color: theme.colors.text,
                                fontSize: 15,
                                lineHeight: 23,
                                fontStyle: 'italic',
                                marginTop: theme.Spacing.sm,
                            }}
                        >
                            {todaysAffirmation.affirmation_text}
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
            {renderExpandedContent()}
        </View>
    );
}
