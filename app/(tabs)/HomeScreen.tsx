// app/(tabs)/HomeScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Share,
    Alert,
    Animated,
    Dimensions,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../constants/theme";
import { useFocusEffect } from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

interface UserStreak {
    current_streak: number;
    longest_streak: number;
    total_visits: number;
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
    const [refreshing, setRefreshing] = useState(false);
    const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
    const [todaysAffirmation, setTodaysAffirmation] = useState<DailyAffirmation | null>(null);

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const streakPulse = useRef(new Animated.Value(1)).current;

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
                setTodaysAffirmation(null);
                setLoading(false);
            }
        }, [user])
    );

    // Fetch all data on component mount and when user changes
    useEffect(() => {
        console.log('HomeScreen mounted or user changed, fetching data...');
        if (user) {
            fetchAllData();
        } else {
            setLoading(false);
        }
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
                updateUserStreak()
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
                const itemIds = [quoteData?.id, verseData?.id, prayerData?.id].filter(Boolean) as string[];

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
                    .from('daily_affirmations')
                    .update({
                        used_count: (randomAffirmation.used_count || 0) + 1,
                        last_used_at: new Date().toISOString()
                    })
                    .eq('id', randomAffirmation.id)
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

    const updateUserStreak = async () => {
        if (!user) {
            console.log('No user, skipping streak update');
            return;
        }

        try {
            console.log('Updating user streak for user:', user.id);
            const { data, error } = await supabase
                .rpc('update_user_streak', { user_id: user.id });

            if (error) {
                console.error('Error updating streak:', error);
                throw error;
            }

            console.log('Streak update response:', data);

            if (data && data.length > 0) {
                const streakData = data[0];
                setUserStreak(streakData);
                console.log('Streak updated:', streakData);

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
            console.error('Error updating streak:', error);
        }
    };

    const handleRefresh = useCallback(() => {
        console.log('Manual refresh triggered');
        setRefreshing(true);
        fetchAllData().finally(() => {
            setRefreshing(false);
            console.log('Manual refresh completed');
        });
    }, [fetchAllData]);

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

        try {
            const currentItem = dailyItems[itemType];
            if (!currentItem) return;

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
            case 'prayer': return '#ef4444';
            case 'verse': return '#10b981';
            default: return theme.colors.accentPrimary;
        }
    };

    const getTypeBackground = (type: string) => {
        switch (type) {
            case 'prayer': return '#fef2f2';
            case 'verse': return '#f0fdf4';
            default: return theme.colors.accentPrimary + '15';
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
        if (!item) {
            console.log(`No ${type} item to render`);
            return null;
        }

        console.log(`Rendering ${type}:`, item);

        return (
            <View
                key={type}
                style={{
                    marginBottom: theme.Spacing.lg,
                }}
            >
                <View style={[
                    theme.card,
                    {
                        backgroundColor: getTypeBackground(type),
                        borderLeftWidth: 6,
                        borderLeftColor: getTypeColor(type),
                        padding: theme.Spacing.xl,
                    }
                ]}>
                    {/* Type Header */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: theme.Spacing.lg,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: theme.Spacing.xs,
                        }}>
                            <View style={{
                                backgroundColor: getTypeColor(type) + '30',
                                padding: theme.Spacing.xs,
                                borderRadius: theme.BorderRadius.round,
                            }}>
                                <Ionicons
                                    name={getTypeIcon(type)}
                                    size={16}
                                    color={getTypeColor(type)}
                                />
                            </View>
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '700',
                                color: getTypeColor(type),
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                            }}>
                                {getTypeTitle(type)}
                            </Text>
                        </View>
                    </View>

                    {/* Title */}
                    {item.title && (
                        <Text style={{
                            fontSize: 20,
                            fontWeight: 'bold',
                            color: theme.colors.text,
                            marginBottom: theme.Spacing.md,
                            textAlign: 'center',
                            lineHeight: 26,
                        }}>
                            {item.title}
                        </Text>
                    )}

                    {/* Message */}
                    <Text style={{
                        fontSize: 16,
                        color: theme.colors.text,
                        textAlign: "center",
                        marginBottom: theme.Spacing.md,
                        lineHeight: 24,
                        letterSpacing: 0.3,
                    }}>
                        {item.message}
                    </Text>

                    {/* Author */}
                    {item.author && (
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.textSecondary,
                            textAlign: "center",
                            marginBottom: theme.Spacing.lg,
                            fontWeight: '600',
                            fontStyle: 'italic',
                        }}>
                            — {item.author}
                        </Text>
                    )}

                    {/* Action Buttons */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                        paddingTop: theme.Spacing.md,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border + '40',
                    }}>
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: theme.Spacing.sm,
                                padding: theme.Spacing.sm,
                                flex: 1,
                                justifyContent: 'center',
                            }}
                            onPress={() => handleShare(item)}
                        >
                            <Ionicons name="share-outline" size={18} color={theme.colors.textSecondary} />
                            <Text style={{
                                color: theme.colors.textSecondary,
                                fontSize: 13,
                                fontWeight: '600',
                            }}>
                                Share
                            </Text>
                        </TouchableOpacity>

                        <View style={{
                            width: 1,
                            backgroundColor: theme.colors.border + '40',
                            marginHorizontal: theme.Spacing.sm,
                        }} />

                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: theme.Spacing.sm,
                                padding: theme.Spacing.sm,
                                flex: 1,
                                justifyContent: 'center',
                            }}
                            onPress={() => toggleFavorite(item.id, type)}
                        >
                            <Ionicons
                                name={item.is_favorited ? "bookmark" : "bookmark-outline"}
                                size={18}
                                color={item.is_favorited ? theme.colors.accentPrimary : theme.colors.textSecondary}
                            />
                            <Text style={{
                                color: item.is_favorited ? theme.colors.accentPrimary : theme.colors.textSecondary,
                                fontSize: 13,
                                fontWeight: '600',
                            }}>
                                {item.is_favorited ? "Saved" : "Save"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
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
            {/* Enhanced Header with Logout */}
            <View style={{
                paddingHorizontal: theme.Spacing.lg,
                paddingVertical: theme.Spacing.lg,
                backgroundColor: theme.colors.background,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{
                            fontSize: 28,
                            fontWeight: 'bold',
                            color: theme.colors.text,
                        }}>
                            Daily Strength
                        </Text>

                        {/* User info and streak */}
                        {user && userStreak && userStreak.current_streak > 0 && (
                            <Animated.View
                                style={[
                                    {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginTop: theme.Spacing.sm,
                                        backgroundColor: theme.colors.accentPrimary + '20',
                                        paddingHorizontal: theme.Spacing.sm,
                                        paddingVertical: theme.Spacing.xs,
                                        borderRadius: theme.BorderRadius.sm,
                                        alignSelf: 'flex-start',
                                    },
                                    { transform: [{ scale: streakPulse }] }
                                ]}
                            >
                                <Ionicons name="flame" size={14} color="#f59e0b" />
                                <Text style={{
                                    color: theme.colors.text,
                                    fontSize: 12,
                                    fontWeight: '600',
                                    marginLeft: 4
                                }}>
                                    {getStreakMessage(userStreak.current_streak)}
                                </Text>
                            </Animated.View>
                        )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm }}>
                        <TouchableOpacity
                            onPress={handleRefresh}
                            style={{
                                padding: theme.Spacing.sm,
                                backgroundColor: theme.colors.accentPrimary + '15',
                                borderRadius: theme.BorderRadius.round,
                            }}
                        >
                            <Ionicons name="refresh" size={20} color={theme.colors.accentPrimary} />
                        </TouchableOpacity>

                        {/* Logout button */}
                        {user && (
                            <TouchableOpacity
                                onPress={handleLogout}
                                style={{
                                    padding: theme.Spacing.sm,
                                    backgroundColor: theme.colors.error + '15',
                                    borderRadius: theme.BorderRadius.round,
                                }}
                            >
                                <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* Daily Content */}
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.accentPrimary]}
                        tintColor={theme.colors.accentPrimary}
                    />
                }
                contentContainerStyle={{
                    padding: theme.Spacing.lg,
                    paddingBottom: theme.Spacing.xl
                }}
            >
                {/* Daily Items */}
                {renderDailyItem(dailyItems.quote, 'quote')}
                {renderDailyItem(dailyItems.verse, 'verse')}
                {renderDailyItem(dailyItems.prayer, 'prayer')}

                {/* Daily Affirmation */}
                {todaysAffirmation && (
                    <TouchableOpacity
                        onPress={refreshAffirmation}
                        activeOpacity={0.7}
                    >
                        <View style={{
                            backgroundColor: theme.colors.accentPrimary + '10',
                            borderRadius: theme.BorderRadius.lg,
                            padding: theme.Spacing.xl,
                            marginTop: theme.Spacing.md,
                            borderLeftWidth: 4,
                            borderLeftColor: theme.colors.accentPrimary,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.Spacing.md }}>
                                <Ionicons
                                    name={getCategoryIcon(todaysAffirmation.category)}
                                    size={24}
                                    color={theme.colors.accentPrimary}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '700',
                                        color: theme.colors.accentPrimary,
                                        marginBottom: 4,
                                        textTransform: 'uppercase',
                                        letterSpacing: 1,
                                    }}>
                                        Daily Affirmation
                                    </Text>
                                    <Text style={{
                                        fontSize: 16,
                                        color: theme.colors.text,
                                        lineHeight: 24,
                                        fontStyle: 'italic',
                                    }}>
                                        {todaysAffirmation.affirmation_text}
                                    </Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: theme.colors.textSecondary,
                                        marginTop: theme.Spacing.sm,
                                    }}>
                                        Tap to refresh affirmation
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </View>
    );
}