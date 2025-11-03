// components/AudioCard.simple.tsx
import React from 'react';
import { TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioComfort } from '../types/audio';
import { AudioPlayerHook } from '../hooks/useAudioPlayer';

type Props = {
    audio: AudioComfort;
    audioPlayer?: AudioPlayerHook;
    onToggleFavorite?: (audioId: string) => void;
    togglingFavorites?: { [key: string]: boolean };
    showPlayButton?: boolean;
};

export default function AudioCard({
                                      audio,
                                      audioPlayer,
                                      onToggleFavorite,
                                      togglingFavorites = {},
                                      showPlayButton = true
                                  }: Props) {
    // Safe access to audioPlayer properties
    const isCurrentlyPlaying = audioPlayer?.currentAudio?.id === audio.id;
    const isPlaying = isCurrentlyPlaying && audioPlayer?.playbackState?.isPlaying;

    const handlePlayPause = async () => {
        if (!audioPlayer) {
            console.warn('Audio player not available');
            return;
        }

        try {
            if (audioPlayer.currentAudio?.id === audio.id) {
                await audioPlayer.playPause();
            } else {
                await audioPlayer.loadAudio(audio);
                await audioPlayer.playPause();
            }
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    };

    const formatDuration = (seconds: number) => {
        if (!seconds || seconds <= 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E2E8F0',
        }}>
            {/* Main Content */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                    {/* Title */}
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 2 }}>
                        {audio.title || 'Untitled Audio'}
                    </Text>

                    {/* Speaker */}
                    {audio.speaker && (
                        <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>
                            by {audio.speaker}
                        </Text>
                    )}

                    {/* Description */}
                    {audio.description && (
                        <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 14 }} numberOfLines={2}>
                            {audio.description}
                        </Text>
                    )}
                </View>

                {/* Play Button */}
                {showPlayButton && audioPlayer && (
                    <TouchableOpacity
                        onPress={handlePlayPause}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: '#A8C1B4',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginLeft: 8,
                        }}
                    >
                        <Ionicons
                            name={isPlaying ? "pause" : "play"}
                            size={20}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Bottom Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    {/* Duration */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="time-outline" size={12} color="#64748B" />
                        <Text style={{ fontSize: 12, color: '#64748B' }}>
                            {formatDuration(audio.duration || 0)}
                        </Text>
                    </View>

                    {/* Category */}
                    {audio.category && (
                        <View style={{
                            backgroundColor: '#A8C1B420',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 12,
                        }}>
                            <Text style={{ fontSize: 10, color: '#A8C1B4', fontWeight: '500' }}>
                                {audio.category}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Play Count & Favorite */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                    {/* Play Count */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="play-outline" size={12} color="#64748B" />
                        <Text style={{ fontSize: 12, color: '#64748B' }}>
                            {audio.play_count || 0}
                        </Text>
                    </View>

                    {/* Favorite Button */}
                    {onToggleFavorite && (
                        <TouchableOpacity
                            onPress={() => onToggleFavorite(audio.id)}
                            disabled={togglingFavorites[audio.id]}
                            style={{ padding: 4 }}
                        >
                            {togglingFavorites[audio.id] ? (
                                <ActivityIndicator size="small" color="#A8C1B4" />
                            ) : (
                                <Ionicons
                                    name={audio.is_favorited ? "heart" : "heart-outline"}
                                    size={16}
                                    color={audio.is_favorited ? '#A8C1B4' : '#64748B'}
                                />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}