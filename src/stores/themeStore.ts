import { create } from 'zustand';

export type WallpaperType = 'default' | 'url' | 'local';

export interface WallpaperState {
  type: WallpaperType;
  source: string;
  isVideo: boolean;
  blur: number;
  mute: boolean;
  loop: boolean;
}

export interface ThemeColors {
  topBarBg: string;
  topBarOpacity: number;
  tabActive: string;
  tabInactive: string;
  leftSidebarBg: string;
  leftSidebarOpacity: number;
  rightSidebarBg: string;
  rightSidebarOpacity: number;
  addressBg: string;
  addressBorder: string;
  addressFocus: string;
  uiText: string;
  iconAccent: string;
}

interface ThemeStore {
  wallpaper: WallpaperState;
  colors: ThemeColors;
  setWallpaper: (update: Partial<WallpaperState>) => void;
  setColor: <K extends keyof ThemeColors>(key: K, value: ThemeColors[K]) => void;
  setWallpaperSource: (source: string, isVideo: boolean, type: WallpaperType) => void;
  resetTheme: () => void;
  loadFromLocalStorage: () => void;
}

const STORAGE_KEY = 'vortex-theme-settings';

const DEFAULT_WALLPAPER: WallpaperState = {
  type: 'default',
  source: '',
  isVideo: true,
  blur: 16,
  mute: true,
  loop: true,
};

const DEFAULT_COLORS: ThemeColors = {
  topBarBg: '#020617',
  topBarOpacity: 0.88,
  tabActive: '#7c3aed',
  tabInactive: '#94a3b8',
  leftSidebarBg: '#04121d',
  leftSidebarOpacity: 0.86,
  rightSidebarBg: '#04121d',
  rightSidebarOpacity: 0.78,
  addressBg: '#0f172a',
  addressBorder: '#334155',
  addressFocus: '#6366f1',
  uiText: '#f8fafc',
  iconAccent: '#38bdf8',
};

function saveThemeToStorage(payload: { wallpaper: WallpaperState; colors: ThemeColors }) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore localStorage failures in restricted environments.
  }
}

function loadThemeFromStorage(): { wallpaper: WallpaperState; colors: ThemeColors } | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as { wallpaper: WallpaperState; colors: ThemeColors };
  } catch {
    return null;
  }
}

export const useThemeStore = create<ThemeStore>((set) => ({
  wallpaper: DEFAULT_WALLPAPER,
  colors: DEFAULT_COLORS,

  setWallpaper: (update) =>
    set((state) => {
      const next = { ...state.wallpaper, ...update };
      saveThemeToStorage({ wallpaper: next, colors: state.colors });
      return { wallpaper: next };
    }),

  setColor: (key, value) =>
    set((state) => {
      const next = { ...state.colors, [key]: value };
      saveThemeToStorage({ wallpaper: state.wallpaper, colors: next });
      return { colors: next };
    }),

  setWallpaperSource: (source, isVideo, type) =>
    set((state) => {
      const next = { ...state.wallpaper, source, isVideo, type };
      saveThemeToStorage({ wallpaper: next, colors: state.colors });
      return { wallpaper: next };
    }),

  resetTheme: () => {
    saveThemeToStorage({ wallpaper: DEFAULT_WALLPAPER, colors: DEFAULT_COLORS });
    return {
      wallpaper: DEFAULT_WALLPAPER,
      colors: DEFAULT_COLORS,
    };
  },

  loadFromLocalStorage: () => {
    const stored = loadThemeFromStorage();
    if (stored) {
      set({ wallpaper: stored.wallpaper, colors: stored.colors });
    }
  },
}));
