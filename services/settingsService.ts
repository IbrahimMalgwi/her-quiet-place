// services/settingsService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
    pushNotifications: boolean;
    darkMode: boolean;
    accentColor: string;
    audioQuality: 'low' | 'medium' | 'high';
    autoPlay: boolean;
    downloadOverWifiOnly: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
    pushNotifications: true,
    darkMode: false,
    accentColor: '#C96578',
    audioQuality: 'medium',
    autoPlay: true,
    downloadOverWifiOnly: true,
};

const SETTINGS_KEY = 'app_settings';
const LEGACY_DEFAULT_ACCENT = '#A8C1B4';
type SettingsListener = (settings: AppSettings) => void;

class SettingsService {
    private listeners = new Set<SettingsListener>();

    async getSettings(): Promise<AppSettings> {
        try {
            const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
            if (settingsJson) {
                const parsedSettings = JSON.parse(settingsJson);
                return {
                    ...DEFAULT_SETTINGS,
                    ...parsedSettings,
                    accentColor: parsedSettings.accentColor === LEGACY_DEFAULT_ACCENT
                        ? DEFAULT_SETTINGS.accentColor
                        : parsedSettings.accentColor,
                };
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
            this.notify(newSettings);
            return newSettings;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }

    async resetSettings(): Promise<AppSettings> {
        try {
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
            this.notify(DEFAULT_SETTINGS);
            return DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Error resetting settings:', error);
            throw error;
        }
    }

    subscribe(listener: SettingsListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(settings: AppSettings) {
        this.listeners.forEach(listener => listener(settings));
    }
}

export const settingsService = new SettingsService();
