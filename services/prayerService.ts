import { supabase } from '../lib/supabase';
import { PrayerRequest, CuratedPrayer, CreatePrayerRequest } from '../types/prayer';

export const prayerService = {
    // Get approved community prayers (only community prayers that are approved)
    async getApprovedPrayers(): Promise<PrayerRequest[]> {
        try {
            const { data, error } = await supabase
                .from('prayer_requests')
                .select('*')
                .eq('status', 'approved')
                .eq('prayer_type', 'community') // Only show approved community prayers
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching approved prayers:', error);
                throw error;
            }

            return (data || []).map(prayer => ({
                ...prayer,
                profiles: {
                    display_name: prayer.is_anonymous ? undefined : 'User',
                    avatar_url: undefined
                }
            }));
        } catch (error) {
            console.error('Error in getApprovedPrayers:', error);
            return [];
        }
    },

    // Get user's prayer requests (both personal and community)
    async getUserPrayers(): Promise<PrayerRequest[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('No user found for getUserPrayers');
                return [];
            }

            const { data, error } = await supabase
                .from('prayer_requests')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching user prayers:', error);
                throw error;
            }

            return (data || []).map(prayer => ({
                ...prayer,
                profiles: {
                    display_name: prayer.is_anonymous ? undefined : 'You',
                    avatar_url: undefined
                }
            }));
        } catch (error) {
            console.error('Error in getUserPrayers:', error);
            return [];
        }
    },

    // Create a new prayer request with prayer type
    async createPrayerRequest(prayer: CreatePrayerRequest): Promise<PrayerRequest> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Auto-approve personal prayers, community prayers need approval
            const status = prayer.prayer_type === 'personal' ? 'approved' : 'pending';

            const prayerData = {
                title: prayer.title.trim(),
                content: prayer.content.trim(),
                is_anonymous: prayer.is_anonymous,
                prayer_type: prayer.prayer_type, // NEW: personal or community
                user_id: user.id,
                status: status, // Auto-approve personal prayers
                prayer_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('Creating prayer request:', prayerData);

            const { data, error } = await supabase
                .from('prayer_requests')
                .insert([prayerData])
                .select('*')
                .single();

            if (error) {
                console.error('Error creating prayer request:', error);
                throw error;
            }

            console.log('Prayer request created successfully');

            return {
                ...data,
                profiles: {
                    display_name: prayer.is_anonymous ? undefined : 'You',
                    avatar_url: undefined
                }
            };
        } catch (error) {
            console.error('Error in createPrayerRequest:', error);
            throw error;
        }
    },

    // Increment prayer count for a prayer request
    async prayForRequest(prayerId: string): Promise<{ success: boolean; newCount?: number }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Check if user already prayed for this request
            const { data: existing, error: checkError } = await supabase
                .from('user_prayed_prayers')
                .select('id')
                .eq('user_id', user.id)
                .eq('prayer_id', prayerId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existing) {
                console.log('User already prayed for this request');
                return { success: false };
            }

            // Record that user prayed for this request
            const { error: insertError } = await supabase
                .from('user_prayed_prayers')
                .insert([{
                    user_id: user.id,
                    prayer_id: prayerId,
                    created_at: new Date().toISOString()
                }]);

            if (insertError) throw insertError;

            // Get current prayer count and increment
            const { data: currentPrayer, error: fetchError } = await supabase
                .from('prayer_requests')
                .select('prayer_count')
                .eq('id', prayerId)
                .single();

            if (fetchError) throw fetchError;

            const newCount = (currentPrayer?.prayer_count || 0) + 1;

            // Update prayer count
            const { error: updateError } = await supabase
                .from('prayer_requests')
                .update({
                    prayer_count: newCount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', prayerId);

            if (updateError) throw updateError;

            return { success: true, newCount };
        } catch (error) {
            console.error('Error in prayForRequest:', error);
            throw error;
        }
    },

    // Get curated prayers (admin-uploaded inspirational content)
    async getCuratedPrayers(): Promise<CuratedPrayer[]> {
        try {
            const { data, error } = await supabase
                .from('curated_prayers')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching curated prayers:', error);
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('Error in getCuratedPrayers:', error);
            return [];
        }
    },

    // Get prayer statistics for the current user
    async getPrayerStats(): Promise<{
        prayedCount: number;
        pendingCount: number;
        approvedCount: number;
        rejectedCount: number;
        totalCommunityPrayers: number;
        totalCuratedPrayers: number;
        personalPrayersCount: number;
    }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('No user found for getPrayerStats');
                return this.getDefaultStats();
            }

            // Get total prayers prayed by user
            const { data: prayedPrayers, error: prayedError } = await supabase
                .from('user_prayed_prayers')
                .select('prayer_id', { count: 'exact' })
                .eq('user_id', user.id);

            if (prayedError) {
                console.error('Error fetching prayed prayers:', prayedError);
                if (prayedError.code === '42P01') {
                    return this.getDefaultStats();
                }
                throw prayedError;
            }

            // Get user's prayer requests count by status and type
            const { data: userPrayers, error: userPrayersError } = await supabase
                .from('prayer_requests')
                .select('status, prayer_type')
                .eq('user_id', user.id);

            if (userPrayersError) {
                console.error('Error fetching user prayers:', userPrayersError);
                throw userPrayersError;
            }

            // Get total community prayers count
            const { data: communityPrayers, error: communityError } = await supabase
                .from('prayer_requests')
                .select('id', { count: 'exact' })
                .eq('status', 'approved')
                .eq('prayer_type', 'community');

            if (communityError) {
                console.error('Error fetching community prayers:', communityError);
            }

            // Get total curated prayers count
            const { data: curatedPrayers, error: curatedError } = await supabase
                .from('curated_prayers')
                .select('id', { count: 'exact' })
                .eq('is_active', true);

            if (curatedError) {
                console.error('Error fetching curated prayers:', curatedError);
            }

            const personalPrayersCount = userPrayers?.filter(p => p.prayer_type === 'personal')?.length || 0;
            const communityPendingCount = userPrayers?.filter(p => p.prayer_type === 'community' && p.status === 'pending')?.length || 0;
            const communityApprovedCount = userPrayers?.filter(p => p.prayer_type === 'community' && p.status === 'approved')?.length || 0;
            const communityRejectedCount = userPrayers?.filter(p => p.prayer_type === 'community' && p.status === 'rejected')?.length || 0;

            const stats = {
                prayedCount: prayedPrayers?.length || 0,
                pendingCount: communityPendingCount,
                approvedCount: communityApprovedCount,
                rejectedCount: communityRejectedCount,
                totalCommunityPrayers: communityPrayers?.length || 0,
                totalCuratedPrayers: curatedPrayers?.length || 0,
                personalPrayersCount: personalPrayersCount,
            };

            return stats;
        } catch (error) {
            console.error('Error in getPrayerStats:', error);
            return this.getDefaultStats();
        }
    },

    // Helper function for default stats
    getDefaultStats() {
        return {
            prayedCount: 0,
            pendingCount: 0,
            approvedCount: 0,
            rejectedCount: 0,
            totalCommunityPrayers: 0,
            totalCuratedPrayers: 0,
            personalPrayersCount: 0,
        };
    }
};