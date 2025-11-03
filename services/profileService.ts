// services/profileService.ts
import { supabase } from '../lib/supabase';

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
}

export const profileService = new ProfileService();