// services/adminUserService.ts - UPDATED TO HANDLE MISSING PROFILES
import { supabase } from '../lib/supabase';

export interface AdminUser {
    id: string;
    email: string;
    full_name?: string;
    role: 'admin' | 'user';
    created_at: string;
    last_sign_in?: string;
    prayer_count: number;
    has_profile: boolean;
}

export const adminUserService = {
    async getUsers(): Promise<AdminUser[]> {
        try {
            // First, get all user roles
            const { data: userRoles, error: rolesError } = await supabase
                .from('user_roles')
                .select('*')
                .order('created_at', { ascending: false });

            if (rolesError) {
                console.error('Error fetching user roles:', rolesError);
                throw rolesError;
            }

            // Then get profiles for users that have them
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*');

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
            }

            // Get prayer counts
            const { data: userPrayers, error: prayersError } = await supabase
                .from('prayer_requests')
                .select('user_id, id');

            if (prayersError) {
                console.error('Error fetching prayers:', prayersError);
            }

            // Count prayers per user
            const prayerCounts: Record<string, number> = {};
            userPrayers?.forEach(prayer => {
                prayerCounts[prayer.user_id] = (prayerCounts[prayer.user_id] || 0) + 1;
            });

            // Create a map of profiles by user ID
            const profilesMap = new Map();
            profiles?.forEach(profile => {
                profilesMap.set(profile.id, profile);
            });

            return (userRoles || []).map(userRole => {
                const profile = profilesMap.get(userRole.user_id);
                const hasProfile = !!profile;

                return {
                    id: userRole.user_id,
                    email: 'user@example.com', // Can't get real email without admin API
                    full_name: profile?.full_name,
                    role: userRole.role,
                    created_at: userRole.created_at,
                    prayer_count: prayerCounts[userRole.user_id] || 0,
                    has_profile: hasProfile
                };
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
        try {
            // Only update user_roles table (references auth.users)
            const { error: roleError } = await supabase
                .from('user_roles')
                .upsert({
                    user_id: userId,
                    role: role,
                    created_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });

            if (roleError) throw roleError;

            // Try to update profiles table if the profile exists
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ role })
                .eq('id', userId);

            if (profileError) {
                console.warn('User profile not found, skipping profile update:', profileError);
                // This is okay - not all users have profiles yet
            }

        } catch (error) {
            console.error('Error updating user role:', error);
            throw error;
        }
    },

    async createUserProfile(userId: string, full_name?: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    full_name: full_name || 'User',
                    role: 'user',
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    },

    async getUserStats(): Promise<{
        totalUsers: number;
        adminUsers: number;
        regularUsers: number;
        usersWithProfiles: number;
    }> {
        try {
            const { data: userRoles, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id, role');

            if (rolesError) throw rolesError;

            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id');

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
            }

            const totalUsers = userRoles?.length || 0;
            const adminUsers = userRoles?.filter(ur => ur.role === 'admin').length || 0;
            const regularUsers = totalUsers - adminUsers;
            const usersWithProfiles = profiles?.length || 0;

            return {
                totalUsers,
                adminUsers,
                regularUsers,
                usersWithProfiles
            };
        } catch (error) {
            console.error('Error fetching user stats:', error);
            return {
                totalUsers: 0,
                adminUsers: 0,
                regularUsers: 0,
                usersWithProfiles: 0
            };
        }
    }
};