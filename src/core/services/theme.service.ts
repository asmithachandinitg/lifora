import { Injectable } from '@angular/core';

export interface AppTheme {
  id:      string;
  label:   string;
  primary: string;
  light:   string;
  lighter: string;
  dark:    boolean;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {

  themes: AppTheme[] = [
    { id: 'lavender', label: 'Lavender', primary: '#8B5CF6', light: '#C4B5FD', lighter: '#EDE9FE', dark: false },
    { id: 'blue',     label: 'Ocean',    primary: '#3b82f6', light: '#93c5fd', lighter: '#DBEAFE', dark: false },
    { id: 'green',    label: 'Forest',   primary: '#10b981', light: '#6ee7b7', lighter: '#D1FAE5', dark: false },
    { id: 'rose',     label: 'Rose',     primary: '#f43f5e', light: '#fda4af', lighter: '#FFE4E6', dark: false },
    { id: 'orange',   label: 'Sunset',   primary: '#f97316', light: '#fdba74', lighter: '#FFEDD5', dark: false },
    { id: 'teal',     label: 'Teal',     primary: '#06b6d4', light: '#67e8f9', lighter: '#CFFAFE', dark: false },
    { id: 'dark',     label: 'Dark',     primary: '#8B5CF6', light: '#C4B5FD', lighter: '#EDE9FE', dark: true  },
  ];

  currentThemeId = 'lavender';
  isDark         = false;

  constructor() {
    this.applyTheme(localStorage.getItem('lifora_theme') || 'lavender');
  }

  applyTheme(id: string) {
    const theme = this.themes.find(t => t.id === id) || this.themes[0];
    this.currentThemeId = theme.id;
    this.isDark         = theme.dark;

    const root = document.documentElement;

    root.style.setProperty('--primary',          theme.primary);
    root.style.setProperty('--primary-light',    theme.light);
    root.style.setProperty('--primary-lighter',  theme.lighter);
    root.style.setProperty('--primary-gradient', `linear-gradient(90deg, ${theme.light}, ${theme.primary})`);
    root.style.setProperty('--primary-soft',     theme.primary + '18');
    root.style.setProperty('--primary-border',   theme.primary + '44');

    if (theme.dark) {
      root.style.setProperty('--bg',           '#111827');
      root.style.setProperty('--bg-secondary', '#1f2937');
      root.style.setProperty('--card-bg',      '#1f2937');
      root.style.setProperty('--card-shadow',  '0 2px 10px rgba(0,0,0,0.4)');
      root.style.setProperty('--border',       '#374151');
      root.style.setProperty('--text',         '#f9fafb');
      root.style.setProperty('--text-muted',   '#9ca3af');
      root.style.setProperty('--text-sub',     '#6b7280');
      root.style.setProperty('--input-bg',     '#374151');
      root.style.setProperty('--input-border', '#4b5563');
      document.body.classList.add('dark-mode');
    } else {
      root.style.setProperty('--bg',           '#f3f4f6');
      root.style.setProperty('--bg-secondary', '#f9fafb');
      root.style.setProperty('--card-bg',      '#ffffff');
      root.style.setProperty('--card-shadow',  '0 2px 10px rgba(0,0,0,0.05)');
      root.style.setProperty('--border',       '#e5e7eb');
      root.style.setProperty('--text',         '#111827');
      root.style.setProperty('--text-muted',   '#6b7280');
      root.style.setProperty('--text-sub',     '#9ca3af');
      root.style.setProperty('--input-bg',     '#ffffff');
      root.style.setProperty('--input-border', '#e5e7eb');
      document.body.classList.remove('dark-mode');
    }

    localStorage.setItem('lifora_theme', id);
  }

  // Called by the Light/Dark toggle buttons in settings
  toggleDark() {
    if (this.isDark) {
      const last = localStorage.getItem('lifora_light_theme') || 'lavender';
      this.applyTheme(last);
    } else {
      localStorage.setItem('lifora_light_theme', this.currentThemeId);
      this.applyTheme('dark');
    }
  }
}
