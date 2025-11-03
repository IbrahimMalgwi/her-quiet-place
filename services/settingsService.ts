// services/settingsService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
    pushNotifications: boolean;
    darkMode: boolean;
    audioQuality: 'low' | 'medium' | 'high';
    autoPlay: boolean;
    downloadOverWifiOnly: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
    pushNotifications: true,
    darkMode: false,
    audioQuality: 'medium',
    autoPlay: true,
    downloadOverWifiOnly: true,
};

const SETTINGS_KEY = 'app_settings';

class SettingsService {
    async getSettings(): Promise<AppSettings> {
        try {
            const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
            if (settingsJson) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
            }
            return DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Error getting settings:', error);
            return DEFAULT_SETTINGS;
        }
    }

    async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
        try {
            const currentSettings = await this.getSettings();
            const newSettings = { ...currentSettings, ...updates };

            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
            return newSettings;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }

    async resetSettings(): Promise<AppSettings> {
        try {
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
            return DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Error resetting settings:', error);
            throw error;
        }
    }
}

export const settingsService = new SettingsService();