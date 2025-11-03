// hooks/useAudioPlayer.ts
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
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
    const soundRef = useRef<Audio.Sound | null>(null);
    const { user } = useAuth(); // Get user from AuthContext

    useEffect(() => {
        // Configure audio mode
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });

        return () => {
            // Cleanup
            if (soundRef.current) {
                soundRef.current.unloadAsync();
                soundRef.current = null;
            }
        };
    }, []);

    const loadAudio = async (audio: AudioComfort) => {
        try {
            // Unload previous audio
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            // Create new audio
            const { sound, status } = await Audio.Sound.createAsync(
                { uri: audio.audio_url },
                { shouldPlay: false }
            );

            soundRef.current = sound;

            // Wait until fully loaded
            const loadedStatus = await sound.getStatusAsync();
            if (!loadedStatus.isLoaded) {
                console.warn('Audio not fully loaded yet');
            }

            // Set up playback listener
            sound.setOnPlaybackStatusUpdate(async (status: any) => {
                if (!status.isLoaded) return;

                setPlaybackState({
                    isPlaying: status.isPlaying,
                    currentPosition: status.positionMillis / 1000,
                    duration: status.durationMillis ? status.durationMillis / 1000 : 0,
                });

                // Auto-save progress every 10 seconds (only if user is authenticated)
                if (user && status.positionMillis && status.positionMillis % 10000 < 100) {
                    await audioService.saveProgress(
                        audio.id,
                        status.positionMillis / 1000,
                        user.id,
                        status.didJustFinish
                    );
                }

                // Save progress when finished (only if user is authenticated)
                if (user && status.didJustFinish) {
                    await audioService.saveProgress(
                        audio.id,
                        status.durationMillis / 1000,
                        user.id,
                        true
                    );
                }
            });

            setCurrentAudio(audio);

            // Restore saved progress safely (only if user is authenticated)
            if (user) {
                const progress = await audioService.getProgress(audio.id, user.id);
                if (progress && progress.progress_seconds > 0) {
                    let attempts = 0;
                    let status = await sound.getStatusAsync();
                    while (!status.isLoaded && attempts < 10) {
                        await new Promise(res => setTimeout(res, 100));
                        status = await sound.getStatusAsync();
                        attempts++;
                    }
                    if (status.isLoaded) {
                        await sound.setPositionAsync(progress.progress_seconds * 1000);
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
        if (!soundRef.current) return;

        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
            if (status.isPlaying) {
                await soundRef.current.pauseAsync();
            } else {
                await soundRef.current.playAsync();
            }
        }
    };

    const seekTo = async (position: number) => {
        if (!soundRef.current) return;

        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
            await soundRef.current.setPositionAsync(position * 1000);
        }
    };

    const stop = async () => {
        if (!soundRef.current) return;

        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;

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