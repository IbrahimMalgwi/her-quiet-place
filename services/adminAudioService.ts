// services/adminAudioService.ts
import { supabase } from '../lib/supabase';
import { AudioComfort } from '../types/audio';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

export const adminAudioService = {
    // Get all audio comforts
    async getAudioComforts(): Promise<AudioComfort[]> {
        const { data, error } = await supabase
            .from('audio_comforts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Create new audio comfort
    async createAudioComfort(audio: {
        title: string;
        audio_url: string;
        is_premium?: boolean;
        is_active?: boolean;
        created_by: string;
    }): Promise<AudioComfort> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('audio_comforts')
            .insert([{
                ...audio,
                duration: 0,
                description: null,
                category: null,
                speaker: null,
                download_count: 0,
                play_count: 0,
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

    // Upload audio file
    async uploadAudioFile(fileUri: string, fileName: string): Promise<string> {
        try {
            // Read file as base64
            const base64Data = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Convert base64 to Uint8Array
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Upload to Supabase storage
            const { data, error } = await supabase.storage
                .from('audio-files')
                .upload(fileName, bytes, {
                    contentType: 'audio/mpeg',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('audio-files')
                .getPublicUrl(fileName);

            if (!urlData?.publicUrl) {
                throw new Error('Failed to get public URL');
            }

            return urlData.publicUrl;
        } catch (error) {
            console.error('Error uploading audio file:', error);
            throw error;
        }
    },

    // Pick audio file
    async pickAudioFile(): Promise<{ uri: string; name: string; size: number; mimeType: string | null }> {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                throw new Error('File selection canceled');
            }

            const file = result.assets[0];
            return {
                uri: file.uri,
                name: file.name || 'audio_file',
                size: file.size || 0,
                mimeType: file.mimeType || null,
            };
        } catch (error) {
            console.error('Error picking audio file:', error);
            throw error;
        }
    },

    // Validate audio file
    validateAudioFile(file: { size: number; mimeType: string | null }): { valid: boolean; message?: string } {
        const maxSize = 50 * 1024 * 1024; // 50MB limit
        const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg'];

        if (file.size > maxSize) {
            return { valid: false, message: 'File size must be less than 50MB' };
        }

        if (file.mimeType && !allowedTypes.includes(file.mimeType)) {
            return { valid: false, message: 'Only MP3, WAV, AAC, and OGG files are supported' };
        }

        return { valid: true };
    },

    // Get file size in readable format
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};