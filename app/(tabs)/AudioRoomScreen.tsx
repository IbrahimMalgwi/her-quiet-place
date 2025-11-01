// app/(tabs)/AudioRoomScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { audioService } from '../../services/audioService';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { AudioComfort } from '../../types/audio';

type TabType = 'all' | 'favorites' | 'categories';

// Updated imports from root-level components folder
import AudioCard from '../../components/AudioCard';
import NowPlayingBar from '../../components/NowPlayingBar';

export default function AudioRoomScreen() {
    const theme = useTheme();
    const { user } = useAuth();
    const audioPlayer = useAudioPlayer();

    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [audios, setAudios] = useState<AudioComfort[]>([]);
    const [favorites, setFavorites] = useState<AudioComfort[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [togglingFavorites, setTogglingFavorites] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        loadData();
    }, [activeTab, selectedCategory]);

    const loadData = async () => {
        try {
            setLoading(true);

            const categoriesData = await audioService.getCategories();
            setCategories(categoriesData);

            switch (activeTab) {
                case 'all':
                    const audioData = selectedCategory
                        ? await audioService.getAudioByCategory(selectedCategory)
                        : await audioService.getAudioComforts();
                    setAudios(audioData);
                    break;
                case 'favorites':
                    const favoritesData = await audioService.getFavorites();
                    setFavorites(favoritesData);
                    break;
                case 'categories':
                    break;
            }
        } catch (error) {
            console.error('Error loading audio data:', error);
            Alert.alert('Error', 'Failed to load audio content');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleToggleFavorite = async (audioId: string) => {
        if (!user) {
            Alert.alert('Sign In Required', 'Please sign in to save favorites');
            return;
        }

        setTogglingFavorites(prev => ({ ...prev, [audioId]: true }));

        try {
            const isNowFavorited = await audioService.toggleFavorite(audioId);

            // Update local state
            setAudios(prev =>
                prev.map(audio =>
                    audio.id === audioId
                        ? { ...audio, is_favorited: isNowFavorited }
                        : audio
                )
            );

            setFavorites(prev =>
                isNowFavorited
                    ? [...prev, ...audios.filter(a => a.id === audioId)]
                    : prev.filter(a => a.id !== audioId)
            );

            Alert.alert(
                isNowFavorited ? 'Added to Favorites' : 'Removed from Favorites',
                isNowFavorited ? 'Audio added to your favorites!' : 'Audio removed from favorites.'
            );
        } catch (error) {
            console.error('Error toggling favorite:', error);
            Alert.alert('Error', 'Failed to update favorites');
        } finally {
            setTogglingFavorites(prev => ({ ...prev, [audioId]: false }));
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                <Text style={{ marginTop: theme.Spacing.md, color: theme.colors.text }}>
                    Loading audio comforts...
                </Text>
            </View>
        );
    }

    const currentList = activeTab === 'favorites' ? favorites : audios;

    return (
        <View style={theme.screen}>
            {/* Header */}
            <View style={{
                paddingHorizontal: theme.Spacing.md,
                paddingVertical: theme.Spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}>
                <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: theme.colors.text,
                    marginBottom: theme.Spacing.sm,
                }}>
                    Audio Comforts
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: theme.colors.textSecondary,
                }}>
                    Find peace and strength through guided audio devotionals
                </Text>
            </View>

            {/* Tab Navigation */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
                {(['all', 'favorites', 'categories'] as TabType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => { setActiveTab(tab); setSelectedCategory(null); }}
                        style={{
                            flex: 1,
                            paddingVertical: theme.Spacing.md,
                            alignItems: 'center',
                            borderBottomWidth: 2,
                            borderBottomColor: activeTab === tab ? theme.colors.accentPrimary : 'transparent',
                        }}
                    >
                        <Ionicons
                            name={tab === 'all' ? 'musical-notes-outline' :
                                tab === 'favorites' ? 'heart-outline' : 'list-outline'}
                            size={20}
                            color={activeTab === tab ? theme.colors.accentPrimary : theme.colors.textSecondary}
                        />
                        <Text style={{
                            fontSize: 12,
                            marginTop: 4,
                            color: activeTab === tab ? theme.colors.accentPrimary : theme.colors.textSecondary,
                        }}>
                            {tab === 'all' && 'All'}
                            {tab === 'favorites' && 'Favorites'}
                            {tab === 'categories' && 'Categories'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Category Filter (for All Audio tab) */}
            {activeTab === 'all' && categories.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                        paddingHorizontal: theme.Spacing.md,
                        paddingVertical: theme.Spacing.sm,
                    }}
                    contentContainerStyle={{ gap: theme.Spacing.sm }}
                >
                    <TouchableOpacity
                        onPress={() => setSelectedCategory(null)}
                        style={{
                            paddingHorizontal: theme.Spacing.md,
                            paddingVertical: theme.Spacing.sm,
                            borderRadius: theme.BorderRadius.round,
                            backgroundColor: selectedCategory === null
                                ? theme.colors.accentPrimary
                                : theme.colors.backgroundCard,
                            borderWidth: 1,
                            borderColor: selectedCategory === null
                                ? theme.colors.accentPrimary
                                : theme.colors.border,
                        }}
                    >
                        <Text style={{
                            fontSize: 12,
                            fontWeight: '500',
                            color: selectedCategory === null
                                ? theme.colors.textInverse
                                : theme.colors.textSecondary,
                        }}>
                            All
                        </Text>
                    </TouchableOpacity>

                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category}
                            onPress={() => setSelectedCategory(category)}
                            style={{
                                paddingHorizontal: theme.Spacing.md,
                                paddingVertical: theme.Spacing.sm,
                                borderRadius: theme.BorderRadius.round,
                                backgroundColor: selectedCategory === category
                                    ? theme.colors.accentPrimary
                                    : theme.colors.backgroundCard,
                                borderWidth: 1,
                                borderColor: selectedCategory === category
                                    ? theme.colors.accentPrimary
                                    : theme.colors.border,
                            }}
                        >
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '500',
                                color: selectedCategory === category
                                    ? theme.colors.textInverse
                                    : theme.colors.textSecondary,
                            }}>
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

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
                contentContainerStyle={{ padding: theme.Spacing.md }}
            >
                {activeTab === 'all' && (
                    audios.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: theme.Spacing.xl }}>
                            <Ionicons name="musical-notes-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: theme.colors.text,
                                marginTop: theme.Spacing.lg,
                                textAlign: 'center',
                            }}>
                                No audio content available
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: theme.colors.textSecondary,
                                marginTop: theme.Spacing.sm,
                                textAlign: 'center',
                            }}>
                                Check back later for new audio devotionals
                            </Text>
                        </View>
                    ) : (
                        audios.map(audio => (
                            <AudioCard
                                key={audio.id}
                                audio={audio}
                                audioPlayer={audioPlayer}
                                onToggleFavorite={handleToggleFavorite}
                                togglingFavorites={togglingFavorites}
                            />
                        ))
                    )
                )}

                {activeTab === 'favorites' && (
                    favorites.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: theme.Spacing.xl }}>
                            <Ionicons name="heart-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: theme.colors.text,
                                marginTop: theme.Spacing.lg,
                                textAlign: 'center',
                            }}>
                                No favorites yet
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: theme.colors.textSecondary,
                                marginTop: theme.Spacing.sm,
                                textAlign: 'center',
                            }}>
                                Tap the heart icon to save your favorite audio
                            </Text>
                        </View>
                    ) : (
                        favorites.map(audio => (
                            <AudioCard
                                key={audio.id}
                                audio={audio}
                                audioPlayer={audioPlayer}
                                onToggleFavorite={handleToggleFavorite}
                                togglingFavorites={togglingFavorites}
                            />
                        ))
                    )
                )}

                {activeTab === 'categories' && (
                    categories.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: theme.Spacing.xl }}>
                            <Ionicons name="list-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: theme.colors.text,
                                marginTop: theme.Spacing.lg,
                                textAlign: 'center',
                            }}>
                                No categories available
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: theme.colors.textSecondary,
                                marginTop: theme.Spacing.sm,
                                textAlign: 'center',
                            }}>
                                Audio content will be organized into categories soon
                            </Text>
                        </View>
                    ) : (
                        <View style={{ gap: theme.Spacing.md }}>
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category}
                                    onPress={() => {
                                        setActiveTab('all');
                                        setSelectedCategory(category);
                                    }}
                                    style={[theme.card, {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }]}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={{
                                            fontSize: 16,
                                            fontWeight: '600',
                                            color: theme.colors.text,
                                            marginBottom: 4,
                                        }}>
                                            {category}
                                        </Text>
                                        <Text style={{
                                            fontSize: 12,
                                            color: theme.colors.textSecondary,
                                        }}>
                                            Browse {category} audio content
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )
                )}
            </ScrollView>

            {/* Now Playing */}
            <NowPlayingBar audioPlayer={audioPlayer} />
        </View>
    );
}