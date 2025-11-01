// types/prayer.ts
export interface PrayerRequest {
    id: string;
    user_id: string;
    title: string;
    content: string;
    is_anonymous: boolean;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
    approved_by?: string;
    approved_at?: string;
    prayer_count: number;
    created_at: string;
    updated_at: string;
    profiles?: {
        display_name?: string;
        avatar_url?: string;
    };
}

export interface CuratedPrayer {
    id: string;
    title: string;
    content: string;
    category?: string;
    type: 'prayer' | 'scripture' | 'blessing';
    is_active: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CreatePrayerRequest {
    title: string;
    content: string;
    is_anonymous: boolean;
}