import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../constants/theme';
import { AudioPlayerHook } from '../hooks/useAudioPlayer';

type Props = {
    audioPlayer: AudioPlayerHook;
};

export default function NowPlayingBar({ audioPlayer }: Props) {
    const theme = useTheme();

    if (!audioPlayer.currentAudio) return null;

    const progress =
        (audioPlayer.playbackState.currentPosition /
            (audioPlayer.playbackState.duration || 1)) *
        100 || 0;

    return (
        <View
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: theme.colors.backgroundCard,
                padding: theme.Spacing.md,
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                    onPress={audioPlayer.playPause}
                    style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: theme.colors.accentPrimary,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons
                        name={audioPlayer.playbackState.isPlaying ? 'pause' : 'play'}
                        size={24}
                        color={theme.colors.textInverse}
                    />
                </TouchableOpacity>

                <View
                    style={{
                        flex: 1,
                        height: 4,
                        backgroundColor: theme.colors.border,
                        marginLeft: theme.Spacing.md,
                        borderRadius: 2,
                        overflow: 'hidden',
                    }}
                >
                    <View
                        style={{
                            width: `${progress}%`,
                            height: '100%',
                            backgroundColor: theme.colors.accentPrimary,
                        }}
                    />
                </View>
            </View>
        </View>
    );
}
