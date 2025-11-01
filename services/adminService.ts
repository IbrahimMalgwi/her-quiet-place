// services/adminService.ts
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
            // Get total users
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const totalUsers = users?.length || 0;

            // Get audio count
            const { count: totalAudio } = await supabase
                .from('audio_comforts')
                .select('*', { count: 'exact', head: true });

            // Get prayer counts
            const { data: prayers } = await supabase
                .from('prayer_requests')
                .select('status');

            const totalPrayers = prayers?.length || 0;
            const pendingPrayers = prayers?.filter(p => p.status === 'pending').length || 0;

            // Get daily strengths count
            const { count: dailyStrengths } = await supabase
                .from('daily_strength')
                .select('*', { count: 'exact', head: true });

            return {
                totalUsers,
                totalAudio: totalAudio || 0,
                totalPrayers,
                pendingPrayers,
                dailyStrengths: dailyStrengths || 0
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    }
};