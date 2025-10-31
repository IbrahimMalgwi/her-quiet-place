// services/journalService.ts
import { supabase } from '../lib/supabase';
import { JournalEntry, CreateJournalEntry } from '../types/journal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const JOURNAL_STORAGE_KEY = 'journal_entries';

export const journalService = {
    // Get all journal entries for current user
    async getEntries(): Promise<JournalEntry[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('Error fetching journal entries:', error);
            // Return empty array instead of throwing to prevent app crashes
            return [];
        }
    },

    // Create a new journal entry (simplified - only required fields)
    async createEntry(entry: CreateJournalEntry): Promise<JournalEntry> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Prepare the data with only fields that exist in the table
            const entryData = {
                user_id: user.id,
                title: entry.title || null, // Use null instead of undefined
                content: entry.content,
                mood: entry.mood || 'neutral', // Default mood
                tags: entry.tags || [], // Default empty array
            };

            console.log('Creating entry with data:', entryData);

            const { data, error } = await supabase
                .from('journal_entries')
                .insert([entryData])
                .select()
                .single();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            console.log('Entry created successfully:', data);
            return data;
        } catch (error) {
            console.error('Error creating journal entry:', error);
            throw error;
        }
    },

    // Update a journal entry
    async updateEntry(id: string, updates: Partial<CreateJournalEntry>): Promise<JournalEntry> {
        try {
            const { data, error } = await supabase
                .from('journal_entries')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating journal entry:', error);
            throw error;
        }
    },

    // Delete a journal entry
    async deleteEntry(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('journal_entries')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting journal entry:', error);
            throw error;
        }
    },

    // Local storage functions for offline support
    async saveToLocal(entries: JournalEntry[]): Promise<void> {
        try {
            await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
        } catch (error) {
            console.error('Error saving to local storage:', error);
        }
    },

    async getFromLocal(): Promise<JournalEntry[]> {
        try {
            const stored = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error reading from local storage:', error);
            return [];
        }
    },
};