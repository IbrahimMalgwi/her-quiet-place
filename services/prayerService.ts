// services/prayerService.ts - UPDATED VERSION
import { supabase } from '../lib/supabase';
import { PrayerRequest, CuratedPrayer, CreatePrayerRequest } from '../types/prayer';

export const prayerService = {
    // Get approved prayer requests (without profile join)
    async getApprovedPrayers(): Promise<PrayerRequest[]> {
        try {
            const { data, error } = await supabase
                .from('prayer_requests')
                .select('*') // Remove the profile join
                .eq('status', 'approved')
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

    // Get user's prayer requests (without profile join)
    async getUserPrayers(): Promise<PrayerRequest[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('No user found for getUserPrayers');
                return [];
            }

            const { data, error } = await supabase
                .from('prayer_requests')
                .select('*') // Remove the profile join
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

    // Create a new prayer request (without profile join)
    async createPrayerRequest(prayer: CreatePrayerRequest): Promise<PrayerRequest> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const prayerData = {
                title: prayer.title.trim(),
                content: prayer.content.trim(),
                is_anonymous: prayer.is_anonymous,
                user_id: user.id,
                status: 'pending',
                prayer_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('Creating prayer request:', prayerData);

            const { data, error } = await supabase
                .from('prayer_requests')
                .insert([prayerData])
                .select('*') // Remove the profile join
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

    // ... keep the rest of your prayerService methods the same (they don't use profile joins)
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
                // If table doesn't exist, return default stats
                if (prayedError.code === '42P01') {
                    return this.getDefaultStats();
                }
                throw prayedError;
            }

            // Get user's prayer requests count by status
            const { data: userPrayers, error: userPrayersError } = await supabase
                .from('prayer_requests')
                .select('status')
                .eq('user_id', user.id);

            if (userPrayersError) {
                console.error('Error fetching user prayers:', userPrayersError);
                throw userPrayersError;
            }

            // Get total community prayers count
            const { data: communityPrayers, error: communityError } = await supabase
                .from('prayer_requests')
                .select('id', { count: 'exact' })
                .eq('status', 'approved');

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

            const stats = {
                prayedCount: prayedPrayers?.length || 0,
                pendingCount: userPrayers?.filter(p => p.status === 'pending')?.length || 0,
                approvedCount: userPrayers?.filter(p => p.status === 'approved')?.length || 0,
                rejectedCount: userPrayers?.filter(p => p.status === 'rejected')?.length || 0,
                totalCommunityPrayers: communityPrayers?.length || 0,
                totalCuratedPrayers: curatedPrayers?.length || 0,
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
        };
    }
};