// services/profileService.ts
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export interface Profile {
    id: string;
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    role: 'user' | 'admin';
    created_at: string;
    updated_at?: string;
}

export interface UpdateProfileData {
    full_name?: string;
    bio?: string;
    avatar_url?: string;
}

class ProfileService {
    async pickAvatar(): Promise<ImagePicker.ImagePickerAsset | null> {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            throw new Error('Photo library permission is required to choose a profile picture.');
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });

        if (result.canceled || !result.assets.length) return null;

        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
            throw new Error('Profile pictures must be smaller than 5MB.');
        }

        return asset;
    }

    async uploadAvatar(userId: string, asset: ImagePicker.ImagePickerAsset): Promise<Profile> {
        const contentType = asset.mimeType || 'image/jpeg';
        const fileBytes = asset.base64
            ? this.base64ToUint8Array(asset.base64)
            : new Uint8Array(await (await fetch(asset.uri)).arrayBuffer());
        const filePath = `${userId}/avatar`;

        const { error: uploadError } = await supabase.storage
            .from('profile-avatars')
            .upload(filePath, fileBytes, {
                contentType,
                upsert: true,
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('profile-avatars')
            .getPublicUrl(filePath);

        return this.updateProfile(userId, {
            avatar_url: `${data.publicUrl}?v=${Date.now()}`,
        });
    }

    async removeAvatar(userId: string): Promise<Profile> {
        const { error } = await supabase.storage
            .from('profile-avatars')
            .remove([`${userId}/avatar`]);

        if (error) throw error;
        return this.updateProfile(userId, { avatar_url: '' });
    }

    async getProfile(userId: string): Promise<Profile | null> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return await this.createProfile(userId);
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    }

    async createProfile(userId: string): Promise<Profile> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .insert([{ id: userId }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating profile:', error);
            throw error;
        }
    }

    async updateProfile(userId: string, updates: UpdateProfileData): Promise<Profile> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    private base64ToUint8Array(base64: string): Uint8Array {
        const binary = atob(base64);
        return Uint8Array.from(binary, character => character.charCodeAt(0));
    }
}

export const profileService = new ProfileService();
