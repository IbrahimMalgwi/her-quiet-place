import { supabase } from '../lib/supabase';

export interface AdminUser {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at?: string;
    is_active: boolean;
    is_admin: boolean;
    profile?: {
        full_name?: string;
        avatar_url?: string;
    };
    stats?: {
        audio_listened: number;
        favorites_count: number;
        prayers_posted: number;
    };
}

// Create a custom type that includes the banned property
interface AdminUserWithBanStatus {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at?: string;
    email_confirmed_at?: string | null;
    banned?: boolean;
}

export const adminUserService = {
    // Get all users with their roles and profiles
    async getUsers(): Promise<AdminUser[]> {
        try {
            // Get auth users
            const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
            if (authError) throw authError;

            // Get user roles
            const { data: roles, error: rolesError } = await supabase
                .from('user_roles')
                .select('*');

            if (rolesError) {
                console.error('Error fetching user roles:', rolesError);
            }

            // Get user profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*');

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
            }

            // Get user stats
            const userStats = await this.getUserStats();

            // Combine all data
            return authUsers.users.map(authUser => {
                // Use type assertion to access the banned property
                const adminUser = authUser as unknown as AdminUserWithBanStatus;
                const userRole = roles?.find(r => r.user_id === authUser.id);
                const profile = profiles?.find(p => p.id === authUser.id);
                const stats = userStats[authUser.id] || {
                    audio_listened: 0,
                    favorites_count: 0,
                    prayers_posted: 0
                };

                // CORRECT FIX: Use type assertion to access banned property
                const isActive = adminUser.email_confirmed_at !== null &&
                    !adminUser.banned;

                return {
                    id: authUser.id,
                    email: authUser.email!,
                    created_at: authUser.created_at,
                    last_sign_in_at: authUser.last_sign_in_at,
                    is_active: isActive,
                    is_admin: userRole?.role === 'admin',
                    profile: profile ? {
                        full_name: profile.full_name,
                        avatar_url: profile.avatar_url
                    } : undefined,
                    stats
                };
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    },

    // Get user statistics
    async getUserStats(): Promise<{ [userId: string]: { audio_listened: number; favorites_count: number; prayers_posted: number } }> {
        const stats: { [userId: string]: { audio_listened: number; favorites_count: number; prayers_posted: number } } = {};

        try {
            // Get audio listened count
            const { data: audioProgress } = await supabase
                .from('user_audio_progress')
                .select('user_id');

            // Get favorites count
            const { data: favorites } = await supabase
                .from('user_audio_favorites')
                .select('user_id');

            // Get prayers posted count
            const { data: prayers } = await supabase
                .from('prayer_requests')
                .select('user_id');

            // Calculate stats
            if (audioProgress) {
                audioProgress.forEach(progress => {
                    if (!stats[progress.user_id]) {
                        stats[progress.user_id] = { audio_listened: 0, favorites_count: 0, prayers_posted: 0 };
                    }
                    stats[progress.user_id].audio_listened++;
                });
            }

            if (favorites) {
                favorites.forEach(fav => {
                    if (!stats[fav.user_id]) {
                        stats[fav.user_id] = { audio_listened: 0, favorites_count: 0, prayers_posted: 0 };
                    }
                    stats[fav.user_id].favorites_count++;
                });
            }

            if (prayers) {
                prayers.forEach(prayer => {
                    if (!stats[prayer.user_id]) {
                        stats[prayer.user_id] = { audio_listened: 0, favorites_count: 0, prayers_posted: 0 };
                    }
                    stats[prayer.user_id].prayers_posted++;
                });
            }
        } catch (error) {
            console.error('Error calculating user stats:', error);
        }

        return stats;
    },

    // Update user role
    async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
        try {
            const { error } = await supabase
                .from('user_roles')
                .upsert({ user_id: userId, role })
                .eq('user_id', userId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating user role:', error);
            throw error;
        }
    },

    // Ban/unban user
    async setUserActiveStatus(userId: string, isActive: boolean): Promise<void> {
        try {
            const { error } = await supabase.auth.admin.updateUserById(
                userId,
                {
                    ban_duration: isActive ? 'none' : '876600h' // 100 years for permanent ban
                }
            );

            if (error) throw error;
        } catch (error) {
            console.error('Error setting user active status:', error);
            throw error;
        }
    },

    // Delete user
    async deleteUser(userId: string): Promise<void> {
        try {
            const { error } = await supabase.auth.admin.deleteUser(userId);
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },
};