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