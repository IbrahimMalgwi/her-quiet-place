// services/audioService.ts
import { AudioComfort, AudioProgress } from '../types/audio';
import { supabase } from '../lib/supabase';
import { audioStorageService } from './audioStorageService';

class AudioService {
    /**
     * Get active audio comforts and mark the current user's favorites.
     */
    async getAudioComforts(): Promise<AudioComfort[]> {
        const [{ data: audios, error }, { data: { user } }] = await Promise.all([
            supabase
                .from('audio_comforts')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false }),
            supabase.auth.getUser(),
        ]);

        if (error) throw error;

        const catalogAudios = audios || [];
        const storageAudios = await audioStorageService.getAudioFiles();
        const registeredStoragePaths = new Set(
            catalogAudios.flatMap(audio => audio.storage_path ? [audio.storage_path] : [])
        );
        const registeredUrls = new Set(catalogAudios.map(audio => audio.audio_url));
        const unregisteredStorageAudios = storageAudios.filter(audio =>
            !registeredUrls.has(audio.audio_url)
            && (!audio.storage_path || !registeredStoragePaths.has(audio.storage_path))
        );
        const availableAudios = [...catalogAudios, ...unregisteredStorageAudios];

        if (!user || !catalogAudios.length) return availableAudios;

        const { data: favorites, error: favoritesError } = await supabase
            .from('user_audio_favorites')
            .select('audio_id')
            .eq('user_id', user.id)
            .in('audio_id', catalogAudios.map(audio => audio.id));

        if (favoritesError) throw favoritesError;

        const favoriteIds = new Set((favorites || []).map(favorite => favorite.audio_id));
        return availableAudios.map(audio => ({
            ...audio,
            is_favorited: favoriteIds.has(audio.id),
        }));
    }

    /**
     * Get audio by category.
     */
    async getAudioByCategory(category: string): Promise<AudioComfort[]> {
        const audios = await this.getAudioComforts();
        return audios.filter(audio => audio.category?.toLowerCase() === category.toLowerCase());
    }

    /**
     * Get categories from active audio.
     */
    async getCategories(): Promise<string[]> {
        const audios = await this.getAudioComforts();
        return [...new Set(audios.map(audio => audio.category).filter(Boolean))].sort() as string[];
    }

    async getFavorites(userId: string): Promise<AudioComfort[]> {
        const { data, error } = await supabase
            .from('user_audio_favorites')
            .select('audio_comforts(*)')
            .eq('user_id', userId);

        if (error) throw error;
        return (data || []).flatMap(favorite => favorite.audio_comforts || []);
    }

    async toggleFavorite(audioId: string, userId: string): Promise<boolean> {
        const { data: favorite, error: fetchError } = await supabase
            .from('user_audio_favorites')
            .select('audio_id')
            .eq('audio_id', audioId)
            .eq('user_id', userId)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (favorite) {
            const { error } = await supabase
                .from('user_audio_favorites')
                .delete()
                .eq('audio_id', audioId)
                .eq('user_id', userId);

            if (error) throw error;
            return false;
        }

        const { error } = await supabase
            .from('user_audio_favorites')
            .insert({ audio_id: audioId, user_id: userId });

        if (error) throw error;
        return true;
    }

    async getProgress(audioId: string, userId: string): Promise<AudioProgress | null> {
        const { data, error } = await supabase
            .from('user_audio_progress')
            .select('*')
            .eq('audio_id', audioId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    async saveProgress(audioId: string, progressSeconds: number, userId: string, completed: boolean = false): Promise<void> {
        const { error } = await supabase
            .from('user_audio_progress')
            .upsert({
                audio_id: audioId,
                user_id: userId,
                progress_seconds: Math.floor(progressSeconds),
                completed,
                updated_at: new Date().toISOString(),
            });

        if (error) throw error;
    }

    async incrementPlayCount(audioId: string): Promise<void> {
        const { error } = await supabase
            .rpc('increment_audio_play_count', { target_audio_id: audioId });

        if (error) throw error;
    }
}

export const audioService = new AudioService();
