// app/(tabs)/HomeScreen.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Share,
    Alert
} from "react-native";
import { supabase } from "../../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../constants/theme";

interface DailyQuote {
    id: string;
    title?: string;
    message: string;
    author?: string;
    created_at: string;
    type?: 'quote' | 'prayer' | 'verse';
    is_favorited?: boolean;
}

export default function HomeScreen() {
    const theme = useTheme();
    const [quotes, setQuotes] = useState<DailyQuote[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        try {
            // Simple query without any RLS complications
            const { data, error } = await supabase
                .from("daily_strength")
                .select("id, title, message, author, created_at, type")
                .order("created_at", { ascending: false })
                .limit(10);

            if (error) {
                console.error("Error fetching quotes:", error);

                // If there's any error, use fallback data
                setQuotes(getFallbackData());
                return;
            }

            if (data && data.length > 0) {
                setQuotes(data);
            } else {
                // If no data in database, use fallback
                setQuotes(getFallbackData());
            }
        } catch (err) {
            console.error("Error fetching quotes:", err);
            // Use fallback data on error
            setQuotes(getFallbackData());
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fallback data in case database is empty or has issues
    const getFallbackData = (): DailyQuote[] => {
        return [
            {
                id: '1',
                title: 'Welcome to Her Quiet Place',
                message: 'This is your daily sanctuary for peace and strength. May you find comfort and inspiration here each day.',
                author: 'Her Quiet Place',
                created_at: new Date().toISOString(),
                type: 'quote'
            },
            {
                id: '2',
                title: 'Morning Blessing',
                message: 'May today bring you peace, may your heart be light, and may you feel Gods presence with every step.',
                author: 'Traditional Blessing',
                created_at: new Date().toISOString(),
                type: 'prayer'
            },
            {
                id: '3',
                message: 'The Lord is my strength and my shield; my heart trusts in him, and he helps me.',
                author: 'Psalm 28:7',
                created_at: new Date().toISOString(),
                type: 'verse'
            },
            {
                id: '4',
                title: 'Inner Peace',
                message: 'Peace is not the absence of trouble, but the presence of God.',
                author: 'Unknown',
                created_at: new Date().toISOString(),
                type: 'quote'
            },
            {
                id: '5',
                title: 'Daily Hope',
                message: 'Hope is being able to see that there is light despite all of the darkness.',
                author: 'Desmond Tutu',
                created_at: new Date().toISOString(),
                type: 'quote'
            }
        ];
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchQuotes();
    };

    const handleShare = async (quote: DailyQuote) => {
        try {
            await Share.share({
                message: `"${quote.message}" - ${quote.author || 'Unknown'}\n\nShared from Her Quiet Place App`,
                title: quote.title || 'Daily Strength'
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const toggleFavorite = async (quoteId: string) => {
        if (!user) {
            Alert.alert("Sign In Required", "Please sign in to save favorites");
            return;
        }

        Alert.alert("Feature Coming Soon", "Favorite functionality will be available soon!");
    };

    const navigateQuote = (direction: 'next' | 'prev') => {
        if (direction === 'next' && currentIndex < quotes.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else if (direction === 'prev' && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // FIXED: Use valid Ionicons names
    const getTypeIcon = (type: string = 'quote') => {
        switch (type) {
            case 'prayer': return 'heart-circle-outline'; // Valid Ionicons icon
            case 'verse': return 'book-outline';
            default: return 'chatbubble-outline'; // Changed from heart-outline
        }
    };

    const getTypeColor = (type: string = 'quote') => {
        switch (type) {
            case 'prayer': return theme.colors.accentSecondary;
            case 'verse': return theme.colors.info;
            default: return theme.colors.accentPrimary;
        }
    };

    if (loading) {
        return (
            <View style={[theme.screen, theme.center]}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                <Text style={[{
                    marginTop: theme.Spacing.md,
                    color: theme.colors.text,
                    fontSize: 16
                }]}>
                    Loading your daily strength...
                </Text>
            </View>
        );
    }

    const currentQuote = quotes[currentIndex];

    return (
        <View style={theme.screen}>
            {/* Header */}
            <View style={[theme.rowBetween, {
                paddingHorizontal: theme.Spacing.md,
                paddingVertical: theme.Spacing.lg
            }]}>
                <View>
                    <Text style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: theme.colors.text,
                        marginBottom: 4
                    }}>
                        Daily Strength
                    </Text>
                    <Text style={{
                        color: theme.colors.textSecondary,
                        fontSize: 14
                    }}>
                        {quotes.length > 0
                            ? `${currentIndex + 1} of ${quotes.length}`
                            : 'No content available'
                        }
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={handleRefresh}
                    style={{ padding: theme.Spacing.xs }}
                >
                    <Ionicons name="refresh" size={24} color={theme.colors.accentPrimary} />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            {quotes.length > 0 ? (
                <View style={{ flex: 1 }}>
                    {/* Navigation for larger collections */}
                    {quotes.length > 1 && (
                        <View style={[theme.rowBetween, {
                            paddingHorizontal: theme.Spacing.md,
                            paddingVertical: theme.Spacing.sm
                        }]}>
                            <TouchableOpacity
                                onPress={() => navigateQuote('prev')}
                                disabled={currentIndex === 0}
                                style={{
                                    padding: theme.Spacing.sm,
                                    opacity: currentIndex === 0 ? 0.3 : 1,
                                }}
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={24}
                                    color={theme.colors.accentPrimary}
                                />
                            </TouchableOpacity>

                            <Text style={{
                                color: theme.colors.textSecondary,
                                fontSize: 14,
                                fontWeight: '500'
                            }}>
                                {currentIndex + 1} / {quotes.length}
                            </Text>

                            <TouchableOpacity
                                onPress={() => navigateQuote('next')}
                                disabled={currentIndex === quotes.length - 1}
                                style={{
                                    padding: theme.Spacing.sm,
                                    opacity: currentIndex === quotes.length - 1 ? 0.3 : 1,
                                }}
                            >
                                <Ionicons
                                    name="chevron-forward"
                                    size={24}
                                    color={theme.colors.accentPrimary}
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Quote Card */}
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
                        contentContainerStyle={{ padding: theme.Spacing.md }}
                    >
                        <View style={theme.card}>
                            {/* Type Indicator */}
                            <View style={[theme.rowBetween, { marginBottom: theme.Spacing.md }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }}>
                                    <Ionicons
                                        name={getTypeIcon(currentQuote.type)}
                                        size={20}
                                        color={getTypeColor(currentQuote.type)}
                                    />
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: '600',
                                        color: getTypeColor(currentQuote.type),
                                        textTransform: 'uppercase'
                                    }}>
                                        {currentQuote.type || 'quote'}
                                    </Text>
                                </View>

                                <Text style={{
                                    color: theme.colors.textSecondary,
                                    fontSize: 12
                                }}>
                                    {new Date(currentQuote.created_at).toLocaleDateString()}
                                </Text>
                            </View>

                            {/* Title */}
                            {currentQuote.title && (
                                <Text style={{
                                    fontSize: 20,
                                    fontWeight: 'bold',
                                    color: theme.colors.text,
                                    marginBottom: theme.Spacing.md,
                                    textAlign: 'center'
                                }}>
                                    {currentQuote.title}
                                </Text>
                            )}

                            {/* Message */}
                            <Text style={{
                                fontSize: 18,
                                color: theme.colors.text,
                                fontStyle: "italic",
                                textAlign: "center",
                                marginBottom: theme.Spacing.md,
                                lineHeight: 28
                            }}>
                                "{currentQuote.message}"
                            </Text>

                            {/* Author */}
                            {currentQuote.author && (
                                <Text style={{
                                    fontSize: 16,
                                    color: theme.colors.textSecondary,
                                    textAlign: "center",
                                    marginBottom: theme.Spacing.lg,
                                    fontWeight: '500'
                                }}>
                                    — {currentQuote.author}
                                </Text>
                            )}

                            {/* Actions */}
                            <View style={[theme.rowBetween, {
                                paddingTop: theme.Spacing.md,
                                borderTopWidth: 1,
                                borderTopColor: theme.colors.border
                            }]}>
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }}
                                    onPress={() => handleShare(currentQuote)}
                                >
                                    <Ionicons name="share-outline" size={20} color={theme.colors.textSecondary} />
                                    <Text style={{
                                        color: theme.colors.textSecondary,
                                        fontSize: 12
                                    }}>
                                        Share
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }}
                                    onPress={() => toggleFavorite(currentQuote.id)}
                                >
                                    <Ionicons
                                        name={currentQuote.is_favorited ? "bookmark" : "bookmark-outline"}
                                        size={20}
                                        color={currentQuote.is_favorited ? theme.colors.accentPrimary : theme.colors.textSecondary}
                                    />
                                    <Text style={{
                                        color: currentQuote.is_favorited ? theme.colors.accentPrimary : theme.colors.textSecondary,
                                        fontSize: 12
                                    }}>
                                        {currentQuote.is_favorited ? "Saved" : "Save"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Daily Affirmation */}
                        <View style={{
                            backgroundColor: theme.colors.accentPrimary + '20',
                            borderRadius: theme.BorderRadius.lg,
                            padding: theme.Spacing.lg,
                            marginTop: theme.Spacing.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: theme.Spacing.md,
                        }}>
                            <Ionicons name="sparkles" size={24} color={theme.colors.accentPrimary} />
                            <Text style={{
                                fontSize: 14,
                                color: theme.colors.text,
                                fontStyle: 'italic',
                                flex: 1,
                                lineHeight: 20
                            }}>
                                You are stronger than you think, braver than you believe, and loved more than you know.
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            ) : (
                // Empty State
                <View style={[theme.screen, theme.center, { padding: theme.Spacing.xl }]}>
                    <Ionicons name="heart-dislike" size={64} color={theme.colors.textSecondary} />
                    <Text style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: theme.colors.text,
                        marginTop: theme.Spacing.lg,
                        textAlign: 'center'
                    }}>
                        No Content Available
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        color: theme.colors.textSecondary,
                        marginTop: theme.Spacing.sm,
                        textAlign: 'center',
                        lineHeight: 24
                    }}>
                        Check back later for new daily strength content.
                    </Text>
                </View>
            )}
        </View>
    );
}