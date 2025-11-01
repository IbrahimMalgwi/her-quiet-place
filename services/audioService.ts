// services/audioService.ts
import { supabase } from '../lib/supabase';
import { AudioComfort, AudioProgress } from '../types/audio';

// Type guard to validate AudioComfort
const isValidAudioComfort = (audio: any): audio is AudioComfort => {
    return (
        audio &&
        typeof audio === 'object' &&
        'id' in audio &&
        'title' in audio &&
        'audio_url' in audio &&
        'duration' in audio
    );
};

// Enrich audios with user data: favorites and progress
const enrichAudioWithUserData = async (audios: any[], userId: string): Promise<AudioComfort[]> => {
    try {
        const validAudios = audios.filter(isValidAudioComfort);

        if (validAudios.length !== audios.length) {
            console.warn('Some audio items were filtered out due to invalid structure');
        }

        // Favorites
        const { data: favorites, error: favoritesError } = await supabase
            .from('user_audio_favorites')
            .select('audio_id')
            .eq('user_id', userId);

        if (favoritesError && favoritesError.code !== '42P01') {
            console.error('Error fetching favorites:', favoritesError);
        }

        const favoriteIds = new Set(favorites?.map(f => f.audio_id) || []);

        // Progress
        const { data: progress, error: progressError } = await supabase
            .from('user_audio_progress')
            .select('audio_id, progress_seconds, completed')
            .eq('user_id', userId);

        if (progressError && progressError.code !== '42P01') {
            console.error('Error fetching progress:', progressError);
        }

        const progressMap = new Map(progress?.map(p => [p.audio_id, p]) || []);

        return validAudios.map(audio => ({
            ...audio,
            is_favorited: favoriteIds.has(audio.id),
            progress: progressMap.get(audio.id) && audio.duration
                ? (progressMap.get(audio.id)!.progress_seconds / audio.duration) * 100
                : 0,
            current_position: progressMap.get(audio.id)?.progress_seconds || 0,
        }));
    } catch (error) {
        console.error('Error enriching audio data:', error);
        return [];
    }
};

export const audioService = {
    // Fetch all active audio comforts
    async getAudioComforts(): Promise<AudioComfort[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('audio_comforts')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                if (error.message.includes('is_active')) {
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('audio_comforts')
                        .select('*')
                        .order('created_at', { ascending: false });
                    if (fallbackError) throw fallbackError;
                    return user ? enrichAudioWithUserData(fallbackData || [], user.id) : (fallbackData || []);
                }
                throw error;
            }

            return user ? enrichAudioWithUserData(data || [], user.id) : (data || []);
        } catch (error) {
            console.error('Error fetching audio comforts:', error);
            return [];
        }
    },

    // Fetch audio by category
    async getAudioByCategory(category: string): Promise<AudioComfort[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('audio_comforts')
                .select('*')
                .eq('category', category)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return user ? enrichAudioWithUserData(data || [], user.id) : (data || []);
        } catch (error) {
            console.error('Error fetching audio by category:', error);
            return [];
        }
    },

    // Fetch user's favorite audios
    async getFavorites(): Promise<AudioComfort[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('user_audio_favorites')
                .select('audio_comforts(*)')
                .eq('user_id', user.id);

            if (error) {
                if (error.code === '42P01') return [];
                throw error;
            }

            // Flatten arrays and filter valid audios
            const favorites: AudioComfort[] = (data || [])
                .map(item => item.audio_comforts)
                .flat()
                .filter(isValidAudioComfort);

            return enrichAudioWithUserData(favorites, user.id);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            return [];
        }
    },

    // Toggle favorite
    async toggleFavorite(audioId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: existing, error: checkError } = await supabase
                .from('user_audio_favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('audio_id', audioId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') throw checkError;

            if (existing) {
                const { error } = await supabase.from('user_audio_favorites').delete().eq('id', existing.id);
                if (error) throw error;
                return false;
            } else {
                const { error } = await supabase.from('user_audio_favorites').insert([{ user_id: user.id, audio_id: audioId }]);
                if (error) throw error;
                return true;
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            throw error;
        }
    },

    // Save playback progress
    async saveProgress(audioId: string, progressSeconds: number, completed: boolean = false): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const progressSecondsInt = Math.floor(progressSeconds);

            const { error } = await supabase
                .from('user_audio_progress')
                .upsert({
                    user_id: user.id,
                    audio_id: audioId,
                    progress_seconds: progressSecondsInt,
                    completed: completed,
                    last_played_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id,audio_id' });

            if (error) throw error;

            if (progressSeconds < 10) {
                try {
                    const { error: rpcError } = await supabase.rpc('increment_play_count', { audio_id: audioId });
                    if (rpcError) console.error('RPC error incrementing play count:', rpcError);
                } catch (rpcError) {
                    console.error('RPC error:', rpcError);
                }
            }
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    },

    // Get progress for an audio
    async getProgress(audioId: string): Promise<AudioProgress | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('user_audio_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('audio_id', audioId)
                .single();

            if (error) {
                if (error.code === 'PGRST116' || error.code === '42P01') return null;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error fetching progress:', error);
            return null;
        }
    },

    // Get audio categories
    async getCategories(): Promise<string[]> {
        try {
            const { data, error } = await supabase
                .from('audio_comforts')
                .select('category')
                .not('category', 'is', null);

            if (error) throw error;

            return [...new Set((data || []).map(item => item.category).filter(Boolean) as string[])];
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    },
};
