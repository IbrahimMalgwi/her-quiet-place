import React from 'react';
import { TouchableOpacity, View, Text, ActivityIndicator, DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioComfort } from '../types/audio';
import { useTheme } from '../constants/theme';
import { AudioPlayerHook } from '../hooks/useAudioPlayer';

type Props = {
    audio: AudioComfort;
    audioPlayer: AudioPlayerHook;
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
    const theme = useTheme();
    const isCurrentlyPlaying = audioPlayer.currentAudio?.id === audio.id;
    const isPlaying = isCurrentlyPlaying && audioPlayer.playbackState.isPlaying;

    const handlePlayPause = async () => {
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

    const getProgressWidth = (audio: AudioComfort): DimensionValue => {
        if (audio.progress && audio.progress > 0) {
            return `${Math.min(audio.progress, 100)}%` as DimensionValue;
        }
        return '0%' as DimensionValue;
    };

    return (
        <View style={[theme.card, { marginBottom: theme.Spacing.md }]}>
            {/* Progress Bar - FIXED: Using DimensionValue type */}
            {audio.progress && audio.progress > 0 && (
                <View style={{
                    height: 3,
                    backgroundColor: theme.colors.border,
                    borderRadius: theme.BorderRadius.round,
                    marginBottom: theme.Spacing.sm,
                    overflow: 'hidden',
                }}>
                    <View style={{
                        height: '100%',
                        backgroundColor: theme.colors.accentPrimary,
                        width: getProgressWidth(audio), // ✅ Now properly typed
                        borderRadius: theme.BorderRadius.round,
                    }} />
                </View>
            )}

            {/* Main Content */}
            <View style={[theme.rowBetween, { marginBottom: theme.Spacing.sm }]}>
                <View style={{ flex: 1 }}>
                    {/* Title */}
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 2,
                    }}>
                        {audio.title || 'Untitled Audio'}
                    </Text>

                    {/* Speaker */}
                    {audio.speaker && (
                        <Text style={{
                            fontSize: 12,
                            color: theme.colors.textSecondary,
                            marginBottom: 2,
                        }}>
                            by {audio.speaker}
                        </Text>
                    )}

                    {/* Description */}
                    {audio.description && (
                        <Text
                            style={{
                                fontSize: 12,
                                color: theme.colors.textSecondary,
                                lineHeight: 14,
                            }}
                            numberOfLines={2}
                        >
                            {audio.description}
                        </Text>
                    )}
                </View>

                {/* Play Button */}
                {showPlayButton && (
                    <TouchableOpacity
                        onPress={handlePlayPause}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: theme.colors.accentPrimary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginLeft: theme.Spacing.sm,
                        }}
                    >
                        <Ionicons
                            name={isPlaying ? "pause" : "play"}
                            size={20}
                            color={theme.colors.textInverse}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Bottom Row */}
            <View style={[theme.rowBetween, { marginTop: 'auto' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.md }}>
                    {/* Duration */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }}>
                        <Ionicons name="time-outline" size={12} color={theme.colors.textSecondary} />
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            {formatDuration(audio.duration || 0)}
                        </Text>
                    </View>

                    {/* Category */}
                    {audio.category && (
                        <View style={{
                            backgroundColor: theme.colors.accentPrimary + '20',
                            paddingHorizontal: theme.Spacing.sm,
                            paddingVertical: 2,
                            borderRadius: theme.BorderRadius.round,
                        }}>
                            <Text style={{
                                fontSize: 10,
                                color: theme.colors.accentPrimary,
                                fontWeight: '500',
                            }}>
                                {audio.category}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Play Count & Favorite */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.lg }}>
                    {/* Play Count */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.xs }}>
                        <Ionicons name="play-outline" size={12} color={theme.colors.textSecondary} />
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                            {audio.play_count || 0}
                        </Text>
                    </View>

                    {/* Favorite Button */}
                    {onToggleFavorite && (
                        <TouchableOpacity
                            onPress={() => onToggleFavorite(audio.id)}
                            disabled={togglingFavorites[audio.id]}
                            style={{ padding: theme.Spacing.xs }}
                        >
                            {togglingFavorites[audio.id] ? (
                                <ActivityIndicator size="small" color={theme.colors.accentPrimary} />
                            ) : (
                                <Ionicons
                                    name={audio.is_favorited ? "heart" : "heart-outline"}
                                    size={16}
                                    color={audio.is_favorited ? theme.colors.accentPrimary : theme.colors.textSecondary}
                                />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}