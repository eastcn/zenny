import { create } from 'zustand';
import { getDatabase } from '../database/connection';

export const useSettingsStore = create((set, get) => ({
  currency: '¥',
  loaded: false,

  async load() {
    const db = getDatabase();
    const rows = await db.getAllAsync('SELECT key, value FROM settings');
    const settings = {};
    rows.forEach((r) => {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = r.value;
      }
    });
    set({
      currency: settings.currency || '¥',
      loaded: true,
    });
  },

  async update(key, value) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const jsonValue = JSON.stringify(value);
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
      [key, jsonValue, now]
    );
    set({ [key]: value });
  },
}));
