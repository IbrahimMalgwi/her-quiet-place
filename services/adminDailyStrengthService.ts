// services/adminDailyStrengthService.ts
import { supabase } from '../lib/supabase';

export interface DailyStrength {
    id: string;
    title?: string;
    message: string;
    created_at: string;
    created_by?: string;
    approved: boolean;
    author?: string;
    type: string;
    is_active: boolean;
}

export const adminDailyStrengthService = {
    async getDailyStrengths(): Promise<DailyStrength[]> {
        try {
            const { data: strengths, error } = await supabase
                .from('daily_strength')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return strengths || [];
        } catch (error) {
            console.error('Error fetching daily strengths:', error);
            throw error;
        }
    },

    async createDailyStrength(data: Omit<DailyStrength, 'id' | 'created_at'>): Promise<DailyStrength> {
        try {
            const { data: strength, error } = await supabase
                .from('daily_strength')
                .insert([data])
                .select()
                .single();

            if (error) throw error;
            return strength;
        } catch (error) {
            console.error('Error creating daily strength:', error);
            throw error;
        }
    },

    async updateDailyStrength(id: string, updates: Partial<DailyStrength>): Promise<DailyStrength> {
        try {
            const { data: strength, error } = await supabase
                .from('daily_strength')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return strength;
        } catch (error) {
            console.error('Error updating daily strength:', error);
            throw error;
        }
    },

    async deleteDailyStrength(id: string): Promise<void> {
        try {
            // First delete related favorites
            await supabase
                .from('user_favorites')
                .delete()
                .eq('quote_id', id);

            // Then delete the daily strength
            const { error } = await supabase
                .from('daily_strength')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting daily strength:', error);
            throw error;
        }
    }
};