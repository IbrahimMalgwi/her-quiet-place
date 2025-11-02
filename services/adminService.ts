// services/adminService.ts - UPDATED
import { supabase } from '../lib/supabase';

export interface DashboardStats {
    totalUsers: number;
    totalAudio: number;
    totalPrayers: number;
    pendingPrayers: number;
    dailyStrengths: number;
}

export const adminService = {
    async getDashboardStats(): Promise<DashboardStats> {
        try {
            // Get total users count from profiles
            const { data: users, error: usersError } = await supabase
                .from('profiles')
                .select('id', { count: 'exact' });

            // Get audio content count
            const { data: audio, error: audioError } = await supabase
                .from('audio_comforts')
                .select('id', { count: 'exact' });

            // Get prayer counts
            const { data: prayers, error: prayersError } = await supabase
                .from('prayer_requests')
                .select('status');

            // Get daily strength count
            const { data: dailyStrengths, error: dsError } = await supabase
                .from('daily_strength')
                .select('id', { count: 'exact' });

            // Handle errors gracefully
            if (usersError) console.error('Error fetching users:', usersError);
            if (audioError) console.error('Error fetching audio:', audioError);
            if (prayersError) console.error('Error fetching prayers:', prayersError);
            if (dsError) console.error('Error fetching daily strengths:', dsError);

            const pendingPrayers = prayers?.filter(p => p.status === 'pending').length || 0;
            const totalPrayers = prayers?.length || 0;

            return {
                totalUsers: users?.length || 0,
                totalAudio: audio?.length || 0,
                totalPrayers: totalPrayers,
                pendingPrayers: pendingPrayers,
                dailyStrengths: dailyStrengths?.length || 0,
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Return default stats if there's an error
            return {
                totalUsers: 0,
                totalAudio: 0,
                totalPrayers: 0,
                pendingPrayers: 0,
                dailyStrengths: 0,
            };
        }
    }
};