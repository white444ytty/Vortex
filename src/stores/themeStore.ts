import { create } from 'zustand';

export type WallpaperType = 'default' | 'url' | 'local';

export interface WallpaperState {
  type: WallpaperType;
  url: string;
  isVideo: boolean;
  blur: number;
  vignette: number; // 0 - 80
  mute: boolean;
  loop: boolean;
}

export interface ThemeColors {
  '--vortex-topbar-bg': string;
  '--vortex-accent-color': string;
  '--vortex-address-bg': string;
  '--vortex-text-primary': string;
  '--vortex-text-secondary': string;
  '--vortex-sidebar-bg': string;
}

export interface TabState {
  id: number;
  title: string;
  url: string;
  pinned?: boolean;
  suspended?: boolean;
  groupId?: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  tabIds: number[];
}

interface ThemeStore {
  wallpaper: WallpaperState;
  colors: ThemeColors;
  tabs: TabState[];
  activeTabId: number | null;
  splitView: { enabled: boolean; leftId: number | null; rightId: number | null };
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  commandPaletteOpen: boolean;
  resourceSaver: boolean;
  // actions
  setWallpaper: (update: Partial<WallpaperState>) => void;
  setWallpaperSource: (url: string, isVideo: boolean, type?: WallpaperType) => void;
  setColorVar: (key: keyof ThemeColors, value: string) => void;
  resetTheme: () => void;
  // tab management
  addTab: (url?: string) => number;
  closeTab: (id: number) => void;
  setActiveTab: (id: number) => void;
  moveTab: (fromIndex: number, toIndex: number) => void;
  pinTab: (id: number, pinned: boolean) => void;
  suspendTab: (id: number) => void;
  resumeTab: (id: number) => void;
  toggleSplitView: (leftId?: number, rightId?: number) => void;
  // workspaces
  createWorkspace: (name: string) => string;
  switchWorkspace: (id: string) => void;
  // ui
  setCommandPaletteOpen: (open: boolean) => void;
  setResourceSaver: (v: boolean) => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'vortex-state-v2';

const DEFAULT_WALLPAPER: WallpaperState = {
  type: 'default',
  url: '',
  isVideo: true,
  blur: 12,
  vignette: 32,
  mute: true,
  loop: true,
};

const DEFAULT_COLORS: ThemeColors = {
  '--vortex-topbar-bg': '#071024',
  '--vortex-accent-color': '#7c3aed',
  '--vortex-address-bg': '#0b1220',
  '--vortex-text-primary': '#e6eef8',
  '--vortex-text-secondary': '#9aa6b2',
  '--vortex-sidebar-bg': '#061018',
};

function saveToStorage(payload: Partial<ThemeStore>) {
  if (typeof window === 'undefined') return;
  try {
    const minimal = {
      wallpaper: payload.wallpaper,
      colors: payload.colors,
      tabs: payload.tabs,
      activeTabId: payload.activeTabId,
      splitView: payload.splitView,
      workspaces: payload.workspaces,
      activeWorkspaceId: payload.activeWorkspaceId,
      resourceSaver: payload.resourceSaver,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
  } catch {
    // ignore
  }
}

function loadFromStorageRaw(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  wallpaper: DEFAULT_WALLPAPER,
  colors: DEFAULT_COLORS,
  tabs: [{ id: 1, title: 'New Tab', url: 'newtab', pinned: false, suspended: false }],
  activeTabId: 1,
  splitView: { enabled: false, leftId: null, rightId: null },
  workspaces: [{ id: 'default', name: 'Default', tabIds: [1] }],
  activeWorkspaceId: 'default',
  commandPaletteOpen: false,
  resourceSaver: false,

  setWallpaper: (update) =>
    set((state) => {
      const next = { ...state.wallpaper, ...update };
      saveToStorage({ wallpaper: next, colors: state.colors, tabs: state.tabs, activeTabId: state.activeTabId });
      return { wallpaper: next } as any;
    }),

  setWallpaperSource: (url, isVideo, type = 'local') =>
    set((state) => {
      const next = { ...state.wallpaper, url, isVideo, type };
      saveToStorage({ wallpaper: next, colors: state.colors, tabs: state.tabs, activeTabId: state.activeTabId });
      return { wallpaper: next } as any;
    }),

  setColorVar: (key, value) =>
    set((state) => {
      const next = { ...state.colors, [key]: value } as ThemeColors;
      // apply to :root
      if (typeof document !== 'undefined') {
        try {
          document.documentElement.style.setProperty(key as string, value);
        } catch {
          /* ignore */
        }
      }
      saveToStorage({ wallpaper: state.wallpaper, colors: next, tabs: state.tabs, activeTabId: state.activeTabId });
      return { colors: next } as any;
    }),

  resetTheme: () => {
    saveToStorage({ wallpaper: DEFAULT_WALLPAPER, colors: DEFAULT_COLORS, tabs: [{ id: 1, title: 'New Tab', url: 'newtab' }], activeTabId: 1 });
    return { wallpaper: DEFAULT_WALLPAPER, colors: DEFAULT_COLORS } as any;
  },

  addTab: (url = 'newtab') => {
    const id = Date.now();
    set((state) => {
      const title = url === 'newtab' ? 'New Tab' : url;
      const nextTabs = [...state.tabs, { id, title, url, pinned: false, suspended: false }];
      saveToStorage({ wallpaper: state.wallpaper, colors: state.colors, tabs: nextTabs, activeTabId: id });
      return { tabs: nextTabs, activeTabId: id } as any;
    });
    return id;
  },

  closeTab: (id) =>
    set((state) => {
      const nextTabs = state.tabs.filter((t) => t.id !== id);
      const nextActive = state.activeTabId === id ? nextTabs[0]?.id ?? null : state.activeTabId;
      saveToStorage({ wallpaper: state.wallpaper, colors: state.colors, tabs: nextTabs, activeTabId: nextActive });
      return { tabs: nextTabs, activeTabId: nextActive } as any;
    }),

  setActiveTab: (id) =>
    set((state) => {
      saveToStorage({ wallpaper: state.wallpaper, colors: state.colors, tabs: state.tabs, activeTabId: id });
      return { activeTabId: id } as any;
    }),

  moveTab: (fromIndex, toIndex) =>
    set((state) => {
      const copy = [...state.tabs];
      const [item] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, item);
      saveToStorage({ wallpaper: state.wallpaper, colors: state.colors, tabs: copy, activeTabId: state.activeTabId });
      return { tabs: copy } as any;
    }),

  pinTab: (id, pinned) =>
    set((state) => {
      const nextTabs = state.tabs.map((t) => (t.id === id ? { ...t, pinned } : t));
      saveToStorage({ wallpaper: state.wallpaper, colors: state.colors, tabs: nextTabs, activeTabId: state.activeTabId });
      return { tabs: nextTabs } as any;
    }),

  suspendTab: (id) =>
    set((state) => {
      const nextTabs = state.tabs.map((t) => (t.id === id ? { ...t, suspended: true } : t));
      saveToStorage({ wallpaper: state.wallpaper, colors: state.colors, tabs: nextTabs, activeTabId: state.activeTabId });
      return { tabs: nextTabs } as any;
    }),

  resumeTab: (id) =>
    set((state) => {
      const nextTabs = state.tabs.map((t) => (t.id === id ? { ...t, suspended: false } : t));
      saveToStorage({ wallpaper: state.wallpaper, colors: state.colors, tabs: nextTabs, activeTabId: state.activeTabId });
      return { tabs: nextTabs } as any;
    }),

  toggleSplitView: (leftId?: number, rightId?: number) =>
    set((state) => {
      const enabled = !state.splitView.enabled;
      const next = { enabled, leftId: leftId ?? state.splitView.leftId, rightId: rightId ?? state.splitView.rightId };
      saveToStorage({ wallpaper: state.wallpaper, colors: state.colors, tabs: state.tabs, activeTabId: state.activeTabId, splitView: next });
      return { splitView: next } as any;
    }),

  createWorkspace: (name) => {
    const id = `ws-${Date.now()}`;
    set((state) => {
      const ws: Workspace = { id, name, tabIds: state.tabs.map((t) => t.id) };
      const next = [...state.workspaces, ws];
      saveToStorage({ wallpaper: state.wallpaper, colors: state.colors, tabs: state.tabs, activeTabId: state.activeTabId, workspaces: next });
      return { workspaces: next } as any;
    });
    return id;
  },

  switchWorkspace: (id) =>
    set((state) => {
      const ws = state.workspaces.find((w) => w.id === id);
      if (!ws) return {} as any;
      const nextTabs = state.tabs.filter((t) => ws.tabIds.includes(t.id));
      const nextActive = nextTabs[0]?.id ?? null;
      saveToStorage({ wallpaper: state.wallpaper, colors: state.colors, tabs: nextTabs, activeTabId: nextActive, activeWorkspaceId: id });
      return { tabs: nextTabs, activeTabId: nextActive, activeWorkspaceId: id } as any;
    }),

  setCommandPaletteOpen: (open) => set(() => ({ commandPaletteOpen: open } as any)),

  setResourceSaver: (v) => set((state) => {
    saveToStorage({ wallpaper: state.wallpaper, colors: state.colors, tabs: state.tabs, activeTabId: state.activeTabId, resourceSaver: v });
    return { resourceSaver: v } as any;
  }),

  loadFromStorage: () => {
    const raw = loadFromStorageRaw();
    if (!raw) return;
    set((state) => {
      const next = {} as Partial<ThemeStore>;
      if (raw.wallpaper) next.wallpaper = { ...state.wallpaper, ...raw.wallpaper };
      if (raw.colors) next.colors = { ...state.colors, ...raw.colors };
      if (raw.tabs) next.tabs = raw.tabs;
      if (raw.activeTabId !== undefined) next.activeTabId = raw.activeTabId;
      if (raw.splitView) next.splitView = raw.splitView;
      if (raw.workspaces) next.workspaces = raw.workspaces;
      if (raw.activeWorkspaceId) next.activeWorkspaceId = raw.activeWorkspaceId;
      if (raw.resourceSaver !== undefined) next.resourceSaver = raw.resourceSaver;
      return next as any;
    });
  },
}));
