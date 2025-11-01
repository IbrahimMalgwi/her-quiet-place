import { supabase } from '../lib/supabase';
import { AudioComfort } from '../types/audio';

export const adminAudioService = {
    // Get all audio comforts (for admin - including inactive)
    async getAudioComforts(): Promise<AudioComfort[]> {
        const { data, error } = await supabase
            .from('audio_comforts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Create new audio comfort
    async createAudioComfort(audio: Omit<AudioComfort, 'id' | 'created_at' | 'updated_at' | 'download_count' | 'play_count'>): Promise<AudioComfort> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('audio_comforts')
            .insert([{
                ...audio,
                created_by: user.id
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update audio comfort
    async updateAudioComfort(id: string, updates: Partial<AudioComfort>): Promise<AudioComfort> {
        const { data, error } = await supabase
            .from('audio_comforts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete audio comfort
    async deleteAudioComfort(id: string): Promise<void> {
        const { error } = await supabase
            .from('audio_comforts')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Upload audio file to storage
    async uploadAudioFile(file: any, fileName: string): Promise<string> {
        const { data, error } = await supabase.storage
            .from('audio-files')
            .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('audio-files')
            .getPublicUrl(fileName);

        return publicUrl;
    },
};