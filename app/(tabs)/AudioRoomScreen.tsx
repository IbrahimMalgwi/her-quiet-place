// app/(tabs)/AudioRoomScreen.tsx - Final clean version
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { audioService } from '../../services/audioService';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { AudioComfort } from '../../types/audio';
import AudioCard from '../../components/AudioCard';
import NowPlayingBar from '../../components/NowPlayingBar';

export default function AudioRoomScreen() {
    const theme = useTheme();
    const { user, isAuthenticated } = useAuth();
    const audioPlayer = useAudioPlayer();

    const [audios, setAudios] = useState<AudioComfort[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [togglingFavorites, setTogglingFavorites] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        loadAudios();
    }, []);

    const loadAudios = async () => {
        try {
            setLoading(true);
            const data = await audioService.getAudioComforts();
            setAudios(data);
        } catch (error) {
            console.error('Error loading audios:', error);
            Alert.alert('Error', 'Unable to load audio comforts.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadAudios();
    };

    const handleToggleFavorite = async (audioId: string) => {
        if (!user) {
            Alert.alert('Sign In Required', 'Please sign in to save favorites.');
            return;
        }

        setTogglingFavorites(prev => ({ ...prev, [audioId]: true }));

        try {
            const isNowFavorited = await audioService.toggleFavorite(audioId, user.id);
            setAudios(prev =>
                prev.map(audio =>
                    audio.id === audioId ? { ...audio, is_favorited: isNowFavorited } : audio
                )
            );
        } catch (error) {
            console.error('Error toggling favorite:', error);
            Alert.alert('Error', 'Failed to update favorites.');
        } finally {
            setTogglingFavorites(prev => ({ ...prev, [audioId]: false }));
        }
    };

    if (loading) {
        return (
            <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.accentPrimary} />
                <Text style={{ marginTop: theme.Spacing.md, color: theme.colors.text }}>
                    Loading audio comforts...
                </Text>
            </View>
        );
    }

    return (
        <View style={theme.screen}>
            {/* Header */}
            <View
                style={{
                    padding: theme.Spacing.lg,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                }}
            >
                <Text
                    style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: theme.colors.text,
                    }}
                >
                    Audio Comforts
                </Text>
                <Text
                    style={{
                        fontSize: 14,
                        color: theme.colors.textSecondary,
                        marginTop: 4,
                    }}
                >
                    Find peace and strength through guided devotionals
                </Text>
            </View>

            {/* Content */}
            <ScrollView
                style={{ flex: 1 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.accentPrimary]}
                    />
                }
                contentContainerStyle={{ padding: theme.Spacing.md }}
            >
                {audios.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: theme.Spacing.xl }}>
                        <Ionicons name="musical-notes-outline" size={64} color={theme.colors.textSecondary} />
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: theme.colors.text,
                                marginTop: theme.Spacing.lg,
                                textAlign: 'center',
                            }}
                        >
                            No audio content available
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                color: theme.colors.textSecondary,
                                marginTop: theme.Spacing.sm,
                                textAlign: 'center',
                            }}
                        >
                            Check back later for new audio devotionals
                        </Text>
                    </View>
                ) : (
                    audios.map(audio => (
                        <AudioCard
                            key={audio.id}
                            audio={audio}
                            audioPlayer={audioPlayer}
                            onToggleFavorite={isAuthenticated ? handleToggleFavorite : undefined}
                            togglingFavorites={togglingFavorites}
                        />
                    ))
                )}
            </ScrollView>

            {/* Now Playing Bar */}
            <NowPlayingBar audioPlayer={audioPlayer} />
        </View>
    );
}