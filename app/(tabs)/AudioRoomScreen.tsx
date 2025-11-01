// app/(tabs)/AudioRoomScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
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

    if (loading && !refreshing) {
        return (
            <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
            </View>
        );
    }

    const currentList = activeTab === 'favorites' ? favorites : audios;

    return (
        <View style={theme.screen}>
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
                    </TouchableOpacity>
                ))}
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
                contentContainerStyle={{ padding: theme.Spacing.md }}
            >
                {currentList.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: theme.Spacing.xl }}>
                        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.textSecondary} />
                    </View>
                ) : (
                    currentList.map(audio => (
                        <AudioCard key={audio.id} audio={audio} audioPlayer={audioPlayer} />
                    ))
                )}
            </ScrollView>

            {/* Now Playing */}
            <NowPlayingBar audioPlayer={audioPlayer} />
        </View>
    );
}
