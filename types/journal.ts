// types/journal.ts
export interface JournalEntry {
    id: string;
    user_id: string;
    title?: string;
    content: string;
    mood?: string;
    tags?: string[];
    is_encrypted: boolean;
    is_local?: boolean;
    local_updated_at?: string;
    cloud_synced_at?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateJournalEntry {
    title?: string;
    content: string;
    mood?: string;
    tags?: string[];
}

export type MoodType =
    | 'happy'
    | 'sad'
    | 'anxious'
    | 'peaceful'
    | 'grateful'
    | 'reflective'
    | 'hopeful'
    | 'tired'
    | 'excited'
    | 'neutral';