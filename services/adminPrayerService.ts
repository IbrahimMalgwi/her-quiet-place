// services/adminPrayerService.ts
import { supabase } from '../lib/supabase';

export interface AdminPrayer {
    id: string;
    title: string;
    content: string;
    category?: string;
    status: 'pending' | 'approved' | 'rejected';
    is_anonymous: boolean;
    is_public: boolean; // Based on status
    user_id: string;
    user_name?: string;
    user_email: string;
    prayer_count: number;
    created_at: string;
    updated_at: string;
    rejection_reason?: string;
    approved_by?: string;
    approved_at?: string;
}

export const adminPrayerService = {
    async getPrayers(): Promise<AdminPrayer[]> {
        try {
            // Get prayer requests with user profiles
            const { data: prayers, error } = await supabase
                .from('prayer_requests')
                .select(`
                    *,
                    profiles!prayer_requests_user_id_fkey (
                        full_name
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Get prayer counts - FIXED VERSION
            const { data: prayedPrayers } = await supabase
                .from('user_prayed_prayers')
                .select('prayer_id');

            // Create prayer count mapping
            const prayerCounts: Record<string, number> = {};
            prayedPrayers?.forEach(item => {
                prayerCounts[item.prayer_id] = (prayerCounts[item.prayer_id] || 0) + 1;
            });

            // Get user emails
            const { data: { users } } = await supabase.auth.admin.listUsers();

            return (prayers || []).map(prayer => {
                const user = users?.find(u => u.id === prayer.user_id);
                const profile = prayer.profiles as any;

                return {
                    id: prayer.id,
                    title: prayer.title,
                    content: prayer.content,
                    category: prayer.category,
                    status: prayer.status,
                    is_anonymous: prayer.is_anonymous,
                    is_public: prayer.status === 'approved', // Public only if approved
                    user_id: prayer.user_id,
                    user_name: prayer.is_anonymous ? undefined : profile?.full_name,
                    user_email: prayer.is_anonymous ? 'Hidden' : user?.email || 'Unknown',
                    prayer_count: prayerCounts[prayer.id] || prayer.prayer_count || 0,
                    created_at: prayer.created_at,
                    updated_at: prayer.updated_at,
                    rejection_reason: prayer.rejection_reason,
                    approved_by: prayer.approved_by,
                    approved_at: prayer.approved_at
                };
            });
        } catch (error) {
            console.error('Error fetching prayers:', error);
            throw error;
        }
    },

    async approvePrayer(prayerId: string): Promise<AdminPrayer> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data: prayer, error } = await supabase
                .from('prayer_requests')
                .update({
                    status: 'approved',
                    approved_by: user?.id,
                    approved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', prayerId)
                .select()
                .single();

            if (error) throw error;
            return this.getPrayerWithDetails(prayer);
        } catch (error) {
            console.error('Error approving prayer:', error);
            throw error;
        }
    },

    async rejectPrayer(prayerId: string, reason: string): Promise<AdminPrayer> {
        try {
            const { data: prayer, error } = await supabase
                .from('prayer_requests')
                .update({
                    status: 'rejected',
                    rejection_reason: reason,
                    updated_at: new Date().toISOString()
                })
                .eq('id', prayerId)
                .select()
                .single();

            if (error) throw error;
            return this.getPrayerWithDetails(prayer);
        } catch (error) {
            console.error('Error rejecting prayer:', error);
            throw error;
        }
    },

    async updatePrayer(prayerId: string, updates: Partial<AdminPrayer>): Promise<AdminPrayer> {
        try {
            const { data: prayer, error } = await supabase
                .from('prayer_requests')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', prayerId)
                .select()
                .single();

            if (error) throw error;
            return this.getPrayerWithDetails(prayer);
        } catch (error) {
            console.error('Error updating prayer:', error);
            throw error;
        }
    },

    async deletePrayer(prayerId: string): Promise<void> {
        try {
            // First delete related prayed prayers
            await supabase
                .from('user_prayed_prayers')
                .delete()
                .eq('prayer_id', prayerId);

            // Then delete the prayer
            const { error } = await supabase
                .from('prayer_requests')
                .delete()
                .eq('id', prayerId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting prayer:', error);
            throw error;
        }
    },

    async getPrayerWithDetails(prayer: any): Promise<AdminPrayer> {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', prayer.user_id)
            .single();

        const { data: { users } } = await supabase.auth.admin.listUsers();
        const user = users?.find(u => u.id === prayer.user_id);

        const { data: prayerCount, error } = await supabase
            .from('user_prayed_prayers')
            .select('id', { count: 'exact' })
            .eq('prayer_id', prayer.id);

        return {
            id: prayer.id,
            title: prayer.title,
            content: prayer.content,
            category: prayer.category,
            status: prayer.status,
            is_anonymous: prayer.is_anonymous,
            is_public: prayer.status === 'approved',
            user_id: prayer.user_id,
            user_name: prayer.is_anonymous ? undefined : profiles?.full_name,
            user_email: prayer.is_anonymous ? 'Hidden' : user?.email || 'Unknown',
            prayer_count: prayerCount?.length || prayer.prayer_count || 0,
            created_at: prayer.created_at,
            updated_at: prayer.updated_at,
            rejection_reason: prayer.rejection_reason,
            approved_by: prayer.approved_by,
            approved_at: prayer.approved_at
        };
    }
};