// services/prayerService.ts
import { supabase } from '../lib/supabase';
import { PrayerRequest, CuratedPrayer, CreatePrayerRequest } from '../types/prayer';

export const prayerService = {
    // Get approved prayer requests (simplified without profile join)
    async getApprovedPrayers(): Promise<PrayerRequest[]> {
        try {
            const { data, error } = await supabase
                .from('prayer_requests')
                .select('*')
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            // Add empty profiles object to maintain interface compatibility
            const prayersWithProfiles = (data || []).map(prayer => ({
                ...prayer,
                profiles: {
                    display_name: prayer.is_anonymous ? undefined : 'User',
                    avatar_url: undefined
                }
            }));

            return prayersWithProfiles;
        } catch (error) {
            console.error('Error fetching approved prayers:', error);
            // Return empty array instead of throwing to prevent app crashes
            return [];
        }
    },

    // Get user's prayer requests (including pending/rejected)
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
                console.error('Supabase error:', error);
                throw error;
            }

            // Add empty profiles object
            const prayersWithProfiles = (data || []).map(prayer => ({
                ...prayer,
                profiles: {
                    display_name: prayer.is_anonymous ? undefined : 'You',
                    avatar_url: undefined
                }
            }));

            return prayersWithProfiles;
        } catch (error) {
            console.error('Error fetching user prayers:', error);
            return [];
        }
    },

    // Create a new prayer request
    async createPrayerRequest(prayer: CreatePrayerRequest): Promise<PrayerRequest> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const prayerData = {
                ...prayer,
                user_id: user.id,
            };

            console.log('Creating prayer request with data:', prayerData);

            const { data, error } = await supabase
                .from('prayer_requests')
                .insert([prayerData])
                .select()
                .single();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            console.log('Prayer request created successfully:', data);

            // Add empty profiles object
            return {
                ...data,
                profiles: {
                    display_name: prayer.is_anonymous ? undefined : 'You',
                    avatar_url: undefined
                }
            };
        } catch (error) {
            console.error('Error creating prayer request:', error);
            throw error;
        }
    },

    // Increment prayer count for a prayer request
    async prayForRequest(prayerId: string): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // First, check if user already prayed for this request
            const { data: existing, error: checkError } = await supabase
                .from('user_prayed_prayers')
                .select('id')
                .eq('user_id', user.id)
                .eq('prayer_id', prayerId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw checkError;
            }

            if (existing) {
                console.log('User already prayed for this request');
                return;
            }

            // Record that user prayed for this request
            const { error: insertError } = await supabase
                .from('user_prayed_prayers')
                .insert([{ user_id: user.id, prayer_id: prayerId }]);

            if (insertError) throw insertError;

            // Increment prayer count
            const { error: updateError } = await supabase.rpc('increment_prayer_count', {
                prayer_id: prayerId
            });

            if (updateError) throw updateError;

        } catch (error) {
            console.error('Error praying for request:', error);
            throw error;
        }
    },

    // Get curated prayers (admin-uploaded)
    async getCuratedPrayers(): Promise<CuratedPrayer[]> {
        try {
            const { data, error } = await supabase
                .from('curated_prayers')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('Error fetching curated prayers:', error);
            return [];
        }
    },

    // Get prayer statistics
    async getPrayerStats() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('No user found for getPrayerStats');
                return {
                    prayedCount: 0,
                    pendingCount: 0,
                    approvedCount: 0,
                };
            }

            // Get total prayers prayed by user
            const { data: prayedPrayers, error: prayedError } = await supabase
                .from('user_prayed_prayers')
                .select('prayer_id')
                .eq('user_id', user.id);

            if (prayedError) {
                console.error('Error fetching prayed prayers:', prayedError);
                // If table doesn't exist yet, return 0
                if (prayedError.code === '42P01') { // table doesn't exist
                    return {
                        prayedCount: 0,
                        pendingCount: 0,
                        approvedCount: 0,
                    };
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

            const stats = {
                prayedCount: prayedPrayers?.length || 0,
                pendingCount: userPrayers?.filter(p => p.status === 'pending')?.length || 0,
                approvedCount: userPrayers?.filter(p => p.status === 'approved')?.length || 0,
            };

            return stats;
        } catch (error) {
            console.error('Error fetching prayer stats:', error);
            return {
                prayedCount: 0,
                pendingCount: 0,
                approvedCount: 0,
            };
        }
    }
};