// types/audio.ts
export type AudioComfort = {
    id: string;
    title: string;
    description?: string;
    audio_url: string;
    duration: number;
    category?: string;
    speaker?: string;
    is_premium: boolean;
    is_active: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
    download_count: number;
    play_count: number;
    is_favorited?: boolean;
    progress?: number;
    current_position?: number;
    storage_path?: string;
    bucket_name?: string;
};

export type PlaybackState = {
    isPlaying: boolean;
    currentPosition: number;
    duration: number;
};

export type AudioProgress = {
    user_id: string;
    audio_id: string;
    progress_seconds: number;
    completed: boolean;
    updated_at: string;
};

// Types for creating and updating audio comforts
export type CreateAudioComfortInput = {
    title: string;
    description?: string;
    audio_url: string;
    duration: number;
    category?: string;
    speaker?: string;
    is_premium: boolean;
    is_active: boolean;
    created_by: string;
};

export type UpdateAudioComfortInput = Partial<CreateAudioComfortInput>;
