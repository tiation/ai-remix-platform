export type ThemeMode = 'dark-neon' | 'light-fluro' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    gradientStart: string;
    gradientEnd: string;
  };
}

export const themes: Record<Exclude<ThemeMode, 'system'>, ThemeConfig> = {
  'dark-neon': {
    mode: 'dark-neon',
    colors: {
      primary: '#00ffff', // Cyan
      secondary: '#ff00ff', // Magenta
      accent: '#80ffff', // Light cyan
      background: '#0a0a0a',
      text: '#ffffff',
      gradientStart: '#00ffff',
      gradientEnd: '#ff00ff'
    }
  },
  'light-fluro': {
    mode: 'light-fluro',
    colors: {
      primary: '#00e5e5', // Slightly darker cyan for better contrast
      secondary: '#e500e5', // Slightly darker magenta for better contrast
      accent: '#00ffff', // Bright cyan
      background: '#ffffff',
      text: '#000000',
      gradientStart: '#00ffff',
      gradientEnd: '#00e5e5'
    }
  }
};

export const getThemePreference = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  
  const saved = localStorage.getItem('theme') as ThemeMode;
  if (saved && saved !== 'system') return saved;
  
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark-neon' : 'light-fluro';
};

export const applyTheme = (mode: ThemeMode) => {
  const root = document.documentElement;
  
  if (mode === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-neon' : 'light-fluro';
    const theme = themes[systemTheme];
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    root.classList.toggle('dark', systemTheme === 'dark-neon');
  } else {
    const theme = themes[mode];
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    root.classList.toggle('dark', mode === 'dark-neon');
  }
};
