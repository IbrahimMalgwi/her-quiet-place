// services/audioStorageService.ts
import { supabase } from '../lib/supabase';
import { AudioComfort } from '../types/audio';

// Helper function to generate UUID-like IDs
const generateAudioId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export interface AudioFile {
    name: string;
    url: string;
    size: number;
    duration?: number;
    metadata?: {
        title?: string;
        description?: string;
        category?: string;
        speaker?: string;
        is_premium?: boolean;
    };
}

class AudioStorageService {
    private audioBucket = 'audio-files';
    private prayerBucket = 'prayer-audio';

    /**
     * Get all audio files from storage buckets
     */
    async getAudioFiles(): Promise<AudioComfort[]> {
        try {
            // Get files from both buckets
            const [audioFiles, prayerFiles] = await Promise.all([
                this.getFilesFromBucket(this.audioBucket),
                this.getFilesFromBucket(this.prayerBucket)
            ]);

            // Combine and transform to AudioComfort format
            const allFiles = [...audioFiles, ...prayerFiles];
            return this.transformToAudioComfort(allFiles);
        } catch (error) {
            console.error('Error getting audio files:', error);
            throw error;
        }
    }

    /**
     * Get files from a specific bucket
     */
    private async getFilesFromBucket(bucketName: string): Promise<AudioFile[]> {
        try {
            const { data, error } = await supabase.storage
                .from(bucketName)
                .list('', {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'name', order: 'asc' }
                });

            if (error) throw error;

            // Transform to AudioFile format with public URLs
            const files: AudioFile[] = await Promise.all(
                (data || []).map(async (file) => {
                    const publicUrl = this.getPublicUrl(bucketName, file.name);

                    return {
                        name: file.name,
                        url: publicUrl,
                        size: file.metadata?.size || 0,
                        duration: this.extractDurationFromMetadata(file.metadata),
                        metadata: this.extractMetadata(file.name, file.metadata)
                    };
                })
            );

            return files.filter(file =>
                file.name.toLowerCase().endsWith('.mp3') ||
                file.name.toLowerCase().endsWith('.m4a') ||
                file.name.toLowerCase().endsWith('.wav')
            );
        } catch (error) {
            console.error(`Error getting files from ${bucketName}:`, error);
            return [];
        }
    }

    /**
     * Get public URL for a file
     */
    private getPublicUrl(bucketName: string, fileName: string): string {
        const { data } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    /**
     * Extract duration from file metadata
     */
    private extractDurationFromMetadata(metadata: any): number {
        return metadata?.duration || 300; // Default 5 minutes
    }

    /**
     * Extract metadata from filename and storage metadata
     */
    private extractMetadata(fileName: string, metadata: any): any {
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
        const parts = nameWithoutExt.split('_');

        return {
            title: this.formatTitle(parts[0] + (parts[1] ? ' ' + parts[1] : '')),
            description: metadata?.description || `Audio file: ${nameWithoutExt}`,
            category: this.determineCategory(fileName),
            speaker: parts.length > 2 ? parts.slice(2).join(' ') : undefined,
            is_premium: metadata?.is_premium || false
        };
    }

    /**
     * Format title from filename
     */
    private formatTitle(title: string): string {
        return title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Determine category based on filename or bucket
     */
    private determineCategory(fileName: string): string {
        const lowerName = fileName.toLowerCase();
        if (lowerName.includes('prayer')) return 'prayer';
        if (lowerName.includes('meditation')) return 'meditation';
        if (lowerName.includes('scripture')) return 'scripture';
        if (lowerName.includes('blessing')) return 'blessing';
        return 'general';
    }

    /**
     * Transform storage files to AudioComfort format
     */
    private transformToAudioComfort(files: AudioFile[]): AudioComfort[] {
        return files.map((file, index) => ({
            id: generateAudioId(),
            title: file.metadata?.title || file.name,
            description: file.metadata?.description,
            audio_url: file.url,
            duration: file.duration || 300,
            category: file.metadata?.category,
            speaker: file.metadata?.speaker,
            is_premium: file.metadata?.is_premium || false,
            is_active: true,
            download_count: 0,
            play_count: 0,
            created_by: '00000000-0000-0000-0000-000000000000',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_favorited: false,
            progress: 0,
            current_position: 0,
            storage_path: file.name,
            bucket_name: file.url.includes('prayer-audio') ? 'prayer-audio' : 'audio-files'
        }));
    }

    /**
     * Get audio files by category
     */
    async getAudioByCategory(category: string): Promise<AudioComfort[]> {
        const allFiles = await this.getAudioFiles();
        return allFiles.filter(file =>
            file.category?.toLowerCase() === category.toLowerCase()
        );
    }

    /**
     * Get categories from available audio files
     */
    async getCategories(): Promise<string[]> {
        const allFiles = await this.getAudioFiles();
        const categories = [...new Set(allFiles.map(file => file.category).filter(Boolean))] as string[];
        return categories.sort();
    }

    /**
     * Upload audio file to storage
     */
    async uploadAudioFile(
        file: { uri: string; name: string; type: string },
        metadata: {
            title: string;
            description?: string;
            category?: string;
            speaker?: string;
            is_premium?: boolean;
            duration?: number;
        },
        bucket: 'audio-files' | 'prayer-audio' = 'audio-files'
    ): Promise<AudioComfort> {
        try {
            // Convert file to blob (React Native compatible)
            const response = await fetch(file.uri);
            const blob = await response.blob();

            const fileName = `${Date.now()}_${file.name}`;

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, blob, {
                    contentType: file.type,
                    upsert: false,
                });

            if (error) throw error;

            // Create AudioComfort object
            const audioComfort: AudioComfort = {
                id: generateAudioId(),
                title: metadata.title,
                description: metadata.description,
                audio_url: this.getPublicUrl(bucket, fileName),
                duration: metadata.duration || 300,
                category: metadata.category,
                speaker: metadata.speaker,
                is_premium: metadata.is_premium || false,
                is_active: true,
                download_count: 0,
                play_count: 0,
                created_by: '00000000-0000-0000-0000-000000000000',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_favorited: false,
                storage_path: fileName,
                bucket_name: bucket
            };

            return audioComfort;
        } catch (error) {
            console.error('Error uploading audio file:', error);
            throw error;
        }
    }

    /**
     * Delete audio file from storage
     */
    async deleteAudioFile(filePath: string, bucket: 'audio-files' | 'prayer-audio'): Promise<void> {
        try {
            const { error } = await supabase.storage
                .from(bucket)
                .remove([filePath]);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting audio file:', error);
            throw error;
        }
    }
}

export const audioStorageService = new AudioStorageService();