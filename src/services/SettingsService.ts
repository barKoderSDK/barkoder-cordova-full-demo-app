import type { ScannerSettings } from '../types/types';

const SETTINGS_KEY = 'scanner_settings';

export interface SavedSettings {
  enabledTypes: Record<string, boolean>;
  scannerSettings: ScannerSettings;
}

const readAllSettings = (): Record<string, SavedSettings> => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, SavedSettings>;
    return parsed ?? {};
  } catch (error) {
    console.error('Error reading settings:', error);
    return {};
  }
};

export const SettingsService = {
  async getSettings(mode: string): Promise<SavedSettings | null> {
    const allSettings = readAllSettings();
    return allSettings[mode] ?? null;
  },

  async saveSettings(mode: string, settings: SavedSettings): Promise<void> {
    try {
      const allSettings = readAllSettings();
      allSettings[mode] = settings;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(allSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },
};

