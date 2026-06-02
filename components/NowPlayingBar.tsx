import React, { useState } from 'react';
import { GestureResponderEvent, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../constants/theme';
import { AudioPlayerHook } from '../hooks/useAudioPlayer';

type Props = {
    audioPlayer: AudioPlayerHook;
};

export default function NowPlayingBar({ audioPlayer }: Props) {
    const theme = useTheme();
    const [progressWidth, setProgressWidth] = useState(0);

    if (!audioPlayer.currentAudio) return null;

    const progress =
        (audioPlayer.playbackState.currentPosition /
            (audioPlayer.playbackState.duration || 1)) *
        100 || 0;
    const formatTime = (seconds: number) => {
        const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
        return `${Math.floor(safeSeconds / 60)}:${Math.floor(safeSeconds % 60).toString().padStart(2, '0')}`;
    };
    const seekFromPress = (event: GestureResponderEvent) => {
        if (!progressWidth || !audioPlayer.playbackState.duration) return;

        const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / progressWidth));
        audioPlayer.seekTo(ratio * audioPlayer.playbackState.duration);
    };
    const controlButton = (
        icon: React.ComponentProps<typeof Ionicons>['name'],
        onPress: () => void,
        label: string,
        size = 22
    ) => (
        <TouchableOpacity
            accessibilityLabel={label}
            onPress={onPress}
            style={{ padding: theme.Spacing.sm }}
        >
            <Ionicons name={icon} size={size} color={theme.colors.text} />
        </TouchableOpacity>
    );

    return (
        <View
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: theme.colors.backgroundCard,
                padding: theme.Spacing.md,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: theme.Spacing.md }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }} numberOfLines={1}>
                        {audioPlayer.currentAudio.title}
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }} numberOfLines={1}>
                        {audioPlayer.currentAudio.speaker || audioPlayer.currentAudio.category || 'Audio comfort'}
                    </Text>
                </View>
                {controlButton('stop-circle-outline', audioPlayer.stop, 'Stop audio')}
            </View>

            <TouchableOpacity
                activeOpacity={0.8}
                accessibilityLabel="Seek audio position"
                onLayout={event => setProgressWidth(event.nativeEvent.layout.width)}
                onPress={seekFromPress}
                style={{
                    height: 18,
                    justifyContent: 'center',
                    marginTop: theme.Spacing.sm,
                }}
            >
                <View style={{ height: 4, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' }}>
                    <View
                        style={{
                            width: `${progress}%`,
                            height: '100%',
                            backgroundColor: theme.colors.accentPrimary,
                        }}
                    />
                </View>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                    {formatTime(audioPlayer.playbackState.currentPosition)}
                </Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                    {formatTime(audioPlayer.playbackState.duration)}
                </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
                {controlButton('play-skip-back', audioPlayer.playPrevious, 'Play previous audio')}
                {controlButton('play-back', () => audioPlayer.skipBy(-15), 'Rewind 15 seconds')}
                <TouchableOpacity
                    accessibilityLabel={audioPlayer.playbackState.isPlaying ? 'Pause audio' : 'Play audio'}
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
                {controlButton('play-forward', () => audioPlayer.skipBy(15), 'Forward 15 seconds')}
                {controlButton('play-skip-forward', audioPlayer.playNext, 'Play next audio')}
            </View>
        </View>
    );
}
