// hooks/useAudioPlayer.ts
import { useState, useEffect, useRef } from 'react';
import {
    AudioPlayer,
    AudioStatus,
    createAudioPlayer,
    setAudioModeAsync,
} from 'expo-audio';
import { PlaybackState, AudioComfort } from '../types/audio';
import { audioService } from '../services/audioService';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

export const useAudioPlayer = () => {
    const [playbackState, setPlaybackState] = useState<PlaybackState>({
        isPlaying: false,
        currentPosition: 0,
        duration: 0,
    });

    const [currentAudio, setCurrentAudio] = useState<AudioComfort | null>(null);
    const playerRef = useRef<AudioPlayer | null>(null);
    const statusSubscriptionRef = useRef<{ remove: () => void } | null>(null);
    const lastSavedSecondRef = useRef(0);
    const { user } = useAuth(); // Get user from AuthContext

    useEffect(() => {
        setAudioModeAsync({
            allowsRecording: false,
            shouldPlayInBackground: true,
            playsInSilentMode: true,
            interruptionMode: 'duckOthers',
            shouldRouteThroughEarpiece: false,
        }).catch(error => console.error('Error configuring audio:', error));

        return () => {
            statusSubscriptionRef.current?.remove();
            playerRef.current?.remove();
            statusSubscriptionRef.current = null;
            playerRef.current = null;
        };
    }, []);

    const loadAudio = async (audio: AudioComfort) => {
        try {
            statusSubscriptionRef.current?.remove();
            playerRef.current?.remove();

            const player = createAudioPlayer(
                { uri: audio.audio_url },
                { updateInterval: 500 }
            );

            playerRef.current = player;
            lastSavedSecondRef.current = 0;

            statusSubscriptionRef.current = player.addListener(
                'playbackStatusUpdate',
                async (status: AudioStatus) => {
                    if (!status.isLoaded) return;

                    setPlaybackState({
                        isPlaying: status.playing,
                        currentPosition: status.currentTime,
                        duration: status.duration,
                    });

                    // Auto-save progress every 10 seconds (only if user is authenticated)
                    const currentSecond = Math.floor(status.currentTime);
                    if (user && currentSecond > 0 && currentSecond % 10 === 0 && currentSecond !== lastSavedSecondRef.current) {
                        lastSavedSecondRef.current = currentSecond;
                        await audioService.saveProgress(
                            audio.id,
                            currentSecond,
                            user.id,
                            status.didJustFinish
                        );
                    }

                    // Save progress when finished (only if user is authenticated)
                    if (user && status.didJustFinish) {
                        await audioService.saveProgress(
                            audio.id,
                            status.duration,
                            user.id,
                            true
                        );
                    }
                }
            );

            setCurrentAudio(audio);
            await audioService.incrementPlayCount(audio.id);

            // Restore saved progress safely (only if user is authenticated)
            if (user) {
                const progress = await audioService.getProgress(audio.id, user.id);
                if (progress && progress.progress_seconds > 0) {
                    let attempts = 0;
                    while (!player.isLoaded && attempts < 10) {
                        await new Promise(res => setTimeout(res, 100));
                        attempts++;
                    }
                    if (player.isLoaded) {
                        await player.seekTo(progress.progress_seconds);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading audio:', error);
            throw error;
        }
    };

    // ... rest of your useAudioPlayer methods remain the same
    const playPause = async () => {
        const player = playerRef.current;
        if (!player) return;

        if (player.playing) {
            player.pause();
        } else {
            player.play();
        }
    };

    const seekTo = async (position: number) => {
        const player = playerRef.current;
        if (player?.isLoaded) {
            await player.seekTo(position);
        }
    };

    const stop = async () => {
        if (!playerRef.current) return;

        statusSubscriptionRef.current?.remove();
        playerRef.current.remove();
        statusSubscriptionRef.current = null;
        playerRef.current = null;

        setPlaybackState({
            isPlaying: false,
            currentPosition: 0,
            duration: 0,
        });
        setCurrentAudio(null);
    };

    return {
        currentAudio,
        playbackState,
        loadAudio,
        playPause,
        seekTo,
        stop,
    };
};

export type AudioPlayerHook = ReturnType<typeof useAudioPlayer>;
