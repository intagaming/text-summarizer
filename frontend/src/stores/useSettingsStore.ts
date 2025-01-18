import { create } from 'zustand';

interface SettingsStore {
  theme: 'light' | 'dark';
  apiKey: string;
  setTheme: (theme: 'light' | 'dark') => void;
  setApiKey: (apiKey: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: localStorage.getItem('text-summarizer-theme') === 'dark' ? 'dark' : 'light',
  apiKey: localStorage.getItem('text-summarizer-api-key') || '',
  setTheme: (theme) => {
    localStorage.setItem('text-summarizer-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },
  setApiKey: (apiKey) => {
    localStorage.setItem('text-summarizer-api-key', apiKey);
    set({ apiKey });
  },
}));