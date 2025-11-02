// services/adminPrayerService.ts - UPDATED VERSION
import { supabase } from '../lib/supabase';

export interface AdminPrayer {
    id: string;
    title: string;
    content: string;
    category?: string;
    status: 'pending' | 'approved' | 'rejected';
    is_anonymous: boolean;
    is_public: boolean;
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
            // Get prayer requests without profile join
            const { data: prayers, error } = await supabase
                .from('prayer_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Get prayer counts
            const { data: prayedPrayers } = await supabase
                .from('user_prayed_prayers')
                .select('prayer_id');

            // Create prayer count mapping
            const prayerCounts: Record<string, number> = {};
            prayedPrayers?.forEach(item => {
                prayerCounts[item.prayer_id] = (prayerCounts[item.prayer_id] || 0) + 1;
            });

            return (prayers || []).map(prayer => {
                return {
                    id: prayer.id,
                    title: prayer.title,
                    content: prayer.content,
                    category: prayer.category,
                    status: prayer.status,
                    is_anonymous: prayer.is_anonymous,
                    is_public: prayer.status === 'approved',
                    user_id: prayer.user_id,
                    user_name: prayer.is_anonymous ? undefined : 'User',
                    user_email: prayer.is_anonymous ? 'Hidden' : 'user@example.com', // Placeholder
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

            // First, verify the prayer exists and get its current state
            const { data: existingPrayer, error: fetchError } = await supabase
                .from('prayer_requests')
                .select('*')
                .eq('id', prayerId)
                .single();

            if (fetchError) {
                console.error('Error finding prayer:', fetchError);
                throw new Error(`Prayer not found: ${prayerId}`);
            }

            if (!existingPrayer) {
                throw new Error(`Prayer with ID ${prayerId} does not exist`);
            }

            console.log('Approving prayer:', prayerId, 'Current status:', existingPrayer.status);

            // Update the prayer
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

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            if (!prayer) {
                throw new Error('No prayer returned after update');
            }

            console.log('Prayer approved successfully:', prayer.id);
            return this.getPrayerWithDetails(prayer);
        } catch (error) {
            console.error('Error approving prayer:', error);
            throw error;
        }
    },

    // Alternative robust method that separates update and fetch
    async approvePrayerAlternative(prayerId: string): Promise<AdminPrayer> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Update without expecting a return value first
            const { error: updateError } = await supabase
                .from('prayer_requests')
                .update({
                    status: 'approved',
                    approved_by: user?.id,
                    approved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', prayerId);

            if (updateError) {
                console.error('Update error:', updateError);
                throw updateError;
            }

            // Then fetch the updated prayer separately
            const { data: prayer, error: fetchError } = await supabase
                .from('prayer_requests')
                .select('*')
                .eq('id', prayerId)
                .single();

            if (fetchError) {
                console.error('Fetch error after update:', fetchError);
                throw fetchError;
            }

            if (!prayer) {
                throw new Error('Prayer not found after update');
            }

            console.log('Prayer approved successfully (alternative method):', prayer.id);
            return this.getPrayerWithDetails(prayer);
        } catch (error) {
            console.error('Error approving prayer (alternative method):', error);
            throw error;
        }
    },

    async rejectPrayer(prayerId: string, reason: string): Promise<AdminPrayer> {
        try {
            // First, verify the prayer exists
            const { data: existingPrayer, error: fetchError } = await supabase
                .from('prayer_requests')
                .select('*')
                .eq('id', prayerId)
                .single();

            if (fetchError || !existingPrayer) {
                throw new Error(`Prayer not found: ${prayerId}`);
            }

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
            if (!prayer) throw new Error('No prayer returned after rejection');

            return this.getPrayerWithDetails(prayer);
        } catch (error) {
            console.error('Error rejecting prayer:', error);
            throw error;
        }
    },

    // Alternative reject method
    async rejectPrayerAlternative(prayerId: string, reason: string): Promise<AdminPrayer> {
        try {
            // Update without expecting a return value first
            const { error: updateError } = await supabase
                .from('prayer_requests')
                .update({
                    status: 'rejected',
                    rejection_reason: reason,
                    updated_at: new Date().toISOString()
                })
                .eq('id', prayerId);

            if (updateError) {
                console.error('Update error:', updateError);
                throw updateError;
            }

            // Then fetch the updated prayer separately
            const { data: prayer, error: fetchError } = await supabase
                .from('prayer_requests')
                .select('*')
                .eq('id', prayerId)
                .single();

            if (fetchError) {
                console.error('Fetch error after update:', fetchError);
                throw fetchError;
            }

            if (!prayer) {
                throw new Error('Prayer not found after rejection');
            }

            return this.getPrayerWithDetails(prayer);
        } catch (error) {
            console.error('Error rejecting prayer (alternative method):', error);
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
        // Get prayer count
        const { data: prayerCount } = await supabase
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
            user_name: prayer.is_anonymous ? undefined : 'User',
            user_email: prayer.is_anonymous ? 'Hidden' : 'user@example.com',
            prayer_count: prayerCount?.length || prayer.prayer_count || 0,
            created_at: prayer.created_at,
            updated_at: prayer.updated_at,
            rejection_reason: prayer.rejection_reason,
            approved_by: prayer.approved_by,
            approved_at: prayer.approved_at
        };
    },

    // Curated prayers management
    async getCuratedPrayers(): Promise<any[]> {
        try {
            const { data: curatedPrayers, error } = await supabase
                .from('curated_prayers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return curatedPrayers || [];
        } catch (error) {
            console.error('Error fetching curated prayers:', error);
            throw error;
        }
    },

    async createCuratedPrayer(prayerData: any): Promise<any> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User must be authenticated to create curated prayers');
            }

            const { data: curatedPrayer, error } = await supabase
                .from('curated_prayers')
                .insert([{
                    ...prayerData,
                    created_by: user.id,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return curatedPrayer;
        } catch (error) {
            console.error('Error creating curated prayer:', error);
            throw error;
        }
    },

    async updateCuratedPrayer(id: string, updates: any): Promise<any> {
        try {
            const { data: curatedPrayer, error } = await supabase
                .from('curated_prayers')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return curatedPrayer;
        } catch (error) {
            console.error('Error updating curated prayer:', error);
            throw error;
        }
    },

    async deleteCuratedPrayer(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('curated_prayers')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting curated prayer:', error);
            throw error;
        }
    }
};