import type { HistoryItem, ScannedItem } from '../types/types';

const HISTORY_KEY = 'scan_history';

const readHistory = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading history:', error);
    return [];
  }
};

const writeHistory = (history: HistoryItem[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const HistoryService = {
  async getHistory(): Promise<HistoryItem[]> {
    return readHistory();
  },

  async addScan(item: ScannedItem): Promise<void> {
    try {
      const history = readHistory();
      const existingIndex = history.findIndex((entry) => entry.text === item.text && entry.type === item.type);

      if (existingIndex >= 0) {
        const updated = { ...history[existingIndex] };
        updated.count += 1;
        updated.timestamp = Date.now();
        if (item.image) {
          updated.image = item.image;
        }
        history.splice(existingIndex, 1);
        history.unshift(updated);
      } else {
        history.unshift({
          ...item,
          timestamp: Date.now(),
          count: 1,
        });
      }

      writeHistory(history);
    } catch (error) {
      console.error('Error saving history:', error);
    }
  },

  async clearHistory(): Promise<void> {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  },
};

