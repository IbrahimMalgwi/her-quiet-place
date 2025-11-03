// services/audioService.ts
import { AudioComfort, AudioProgress } from '../types/audio';
import { audioStorageService } from './audioStorageService';

class AudioService {
    /**
     * Get all audio comforts from storage
     */
    async getAudioComforts(): Promise<AudioComfort[]> {
        return await audioStorageService.getAudioFiles();
    }

    /**
     * Get audio by category from storage
     */
    async getAudioByCategory(category: string): Promise<AudioComfort[]> {
        return await audioStorageService.getAudioByCategory(category);
    }

    /**
     * Get categories from storage
     */
    async getCategories(): Promise<string[]> {
        return await audioStorageService.getCategories();
    }

    /**
     * For storage-only audio, we'll handle favorites locally
     */
    async getFavorites(userId: string): Promise<AudioComfort[]> {
        console.log('Favorites not implemented for storage audio');
        return [];
    }

    /**
     * Toggle favorite locally (no database)
     */
    async toggleFavorite(audioId: string, userId: string): Promise<boolean> {
        console.log('Favorite toggle simulated for:', audioId);
        return true;
    }

    /**
     * Get progress locally (no database)
     */
    async getProgress(audioId: string, userId: string): Promise<AudioProgress | null> {
        return null;
    }

    /**
     * Save progress locally (no database)
     */
    async saveProgress(audioId: string, progressSeconds: number, userId: string, completed: boolean = false): Promise<void> {
        console.log('Progress save simulated for:', audioId, progressSeconds);
    }

    /**
     * Increment play count for an audio
     */
    async incrementPlayCount(audioId: string): Promise<void> {
        console.log('Play count increment for:', audioId);
    }
}

export const audioService = new AudioService();