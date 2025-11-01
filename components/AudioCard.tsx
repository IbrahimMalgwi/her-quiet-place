import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioComfort } from '../types/audio';
import { useTheme } from '../constants/theme';
import { AudioPlayerHook } from '../hooks/useAudioPlayer';

type Props = {
    audio: AudioComfort;
    audioPlayer: AudioPlayerHook;
};

export default function AudioCard({ audio, audioPlayer }: Props) {
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

    return (
        <View style={{ marginBottom: theme.Spacing.md, alignItems: 'center' }}>
            <TouchableOpacity
                onPress={handlePlayPause}
                style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: theme.colors.accentPrimary,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={24}
                    color={theme.colors.textInverse}
                />
            </TouchableOpacity>
        </View>
    );
}
