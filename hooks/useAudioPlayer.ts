// hooks/useAudioPlayer.ts
import { useState, useEffect, useRef, useCallback } from 'react';
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
    const playlistRef = useRef<AudioComfort[]>([]);
    const { user } = useAuth(); // Get user from AuthContext

    const disposeCurrentPlayer = useCallback(() => {
        statusSubscriptionRef.current?.remove();
        statusSubscriptionRef.current = null;

        const player = playerRef.current;
        if (!player) return;

        if (player.playing) player.pause();
        player.clearLockScreenControls();
        player.remove();
        playerRef.current = null;
    }, []);

    useEffect(() => {
        setAudioModeAsync({
            allowsRecording: false,
            shouldPlayInBackground: true,
            playsInSilentMode: true,
            interruptionMode: 'duckOthers',
            shouldRouteThroughEarpiece: false,
        }).catch(error => console.error('Error configuring audio:', error));

        return () => {
            disposeCurrentPlayer();
        };
    }, [disposeCurrentPlayer]);

    const loadAudio = async (audio: AudioComfort, shouldPlay = false) => {
        try {
            disposeCurrentPlayer();
            setPlaybackState({
                isPlaying: false,
                currentPosition: 0,
                duration: 0,
            });

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
                    if (user && !audio.is_storage_only && currentSecond > 0 && currentSecond % 10 === 0 && currentSecond !== lastSavedSecondRef.current) {
                        lastSavedSecondRef.current = currentSecond;
                        await audioService.saveProgress(
                            audio.id,
                            currentSecond,
                            user.id,
                            status.didJustFinish
                        ).catch(error => console.error('Error saving audio progress:', error));
                    }

                    // Save progress when finished (only if user is authenticated)
                    if (user && !audio.is_storage_only && status.didJustFinish) {
                        await audioService.saveProgress(
                            audio.id,
                            status.duration,
                            user.id,
                            true
                        ).catch(error => console.error('Error saving completed audio:', error));
                    }
                }
            );

            setCurrentAudio(audio);
            if (!audio.is_storage_only) {
                await audioService.incrementPlayCount(audio.id);
            }

            // Restore saved progress safely (only if user is authenticated)
            if (user && !audio.is_storage_only) {
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
                } else {
                    await audioService.saveProgress(audio.id, 0, user.id, false);
                }
            }

            if (shouldPlay) player.play();
        } catch (error) {
            console.error('Error loading audio:', error);
            throw error;
        }
    };

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
            await player.seekTo(Math.max(0, Math.min(position, player.duration || position)));
        }
    };

    const skipBy = async (seconds: number) => {
        const player = playerRef.current;
        if (!player?.isLoaded) return;

        await seekTo(player.currentTime + seconds);
    };

    const playAudio = async (audio: AudioComfort) => {
        if (currentAudio?.id === audio.id) {
            await playPause();
            return;
        }

        await loadAudio(audio, true);
    };

    const setPlaylist = useCallback((audios: AudioComfort[]) => {
        playlistRef.current = audios;
    }, []);

    const playAdjacent = async (direction: -1 | 1) => {
        if (!currentAudio) return;

        const playlist = playlistRef.current;
        const currentIndex = playlist.findIndex(audio => audio.id === currentAudio.id);
        const nextAudio = playlist[currentIndex + direction];

        if (nextAudio) await loadAudio(nextAudio, true);
    };

    const stop = async () => {
        disposeCurrentPlayer();

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
        playAudio,
        playPause,
        seekTo,
        skipBy,
        playPrevious: () => playAdjacent(-1),
        playNext: () => playAdjacent(1),
        setPlaylist,
        stop,
    };
};

export type AudioPlayerHook = ReturnType<typeof useAudioPlayer>;
