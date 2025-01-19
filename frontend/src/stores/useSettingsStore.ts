import { create } from 'zustand';
import { PROVIDERS } from "@/config/providers";

interface SettingsStore {
  theme: 'light' | 'dark';
  apiKey: string;
  provider: string;
  model: string;
  setTheme: (theme: 'light' | 'dark') => void;
  setApiKey: (apiKey: string) => void;
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: localStorage.getItem('text-summarizer-theme') === 'dark' ? 'dark' : 'light',
  apiKey: localStorage.getItem('text-summarizer-api-key') || '',
  provider: localStorage.getItem('text-summarizer-provider') || PROVIDERS[0].value,
  model: localStorage.getItem('text-summarizer-model') || 'gpt-3.5-turbo',
  setTheme: (theme) => {
    localStorage.setItem('text-summarizer-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },
  setApiKey: (apiKey) => {
    localStorage.setItem('text-summarizer-api-key', apiKey);
    set({ apiKey });
  },
  setProvider: (provider) => {
    localStorage.setItem('text-summarizer-provider', provider);
    set({ provider });
  },
  setModel: (model) => {
    localStorage.setItem('text-summarizer-model', model);
    set({ model });
  },
}));