// types/audio.ts
export interface AudioComfort {
    id: string;
    title: string;
    description?: string;
    audio_url: string; // This will be the public URL from Supabase Storage
    duration: number; // in seconds
    category?: string;
    speaker?: string;
    is_premium: boolean;
    is_active: boolean;
    download_count: number;
    play_count: number;
    created_by: string;
    created_at: string;
    updated_at: string;
    is_favorited?: boolean;
    progress?: number; // 0-100
    current_position?: number; // in seconds
    // Add storage-specific fields
    storage_path?: string; // Path in Supabase Storage bucket
    bucket_name?: string; // 'audio-files' or 'prayer-audio'
}

// Keep your other interfaces the same
export interface AudioProgress {
    id: string;
    user_id: string;
    audio_id: string;
    progress_seconds: number;
    completed: boolean;
    last_played_at: string;
}

export interface PlaybackState {
    isPlaying: boolean;
    currentPosition: number;
    duration: number;
    currentAudioId?: string;
}