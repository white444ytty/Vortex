import React, { useEffect, useMemo, useRef, useState } from 'react';
import CustomizerDrawer from './components/CustomizerDrawer';
import NewTabPage from './components/NewTabPage';
import { useThemeStore } from './stores/themeStore';

interface BrowserTab {
  id: number;
  title: string;
  url: string;
}

const isUrl = (value: string) => /^(https?:\/\/|mailto:|ftp:)/i.test(value) || value.includes('.');

const normalizeAddress = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return 'newtab';
  if (trimmed === 'newtab') return 'newtab';
  if (isUrl(trimmed)) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
};

const shortTitle = (url: string) => {
  if (url === 'newtab') return 'New Tab';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return url;
  }
};

const hexToRgba = (hex: string, alpha: number) => {
  const cleaned = hex.replace('#', '');
  const bigint = parseInt(cleaned.length === 3 ? cleaned.split('').map((c) => c + c).join('') : cleaned, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const App: React.FC = () => {
  const colors = useThemeStore((state) => state.colors);
  const loadFromLocalStorage = useThemeStore((state) => state.loadFromLocalStorage);
  const [tabs, setTabs] = useState<BrowserTab[]>([{ id: 1, title: 'New Tab', url: 'newtab' }]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [addressValue, setAddressValue] = useState('');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [sidebars, setSidebars] = useState({ left: true, right: true });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [tabs, activeTabId],
  );

  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--top-bar-bg', colors.topBarBg);
    root.style.setProperty('--top-bar-opacity', `${colors.topBarOpacity}`);
    root.style.setProperty('--tab-active-accent', colors.tabActive);
    root.style.setProperty('--tab-inactive-accent', colors.tabInactive);
    root.style.setProperty('--left-sidebar-bg', colors.leftSidebarBg);
    root.style.setProperty('--left-sidebar-opacity', `${colors.leftSidebarOpacity}`);
    root.style.setProperty('--right-sidebar-bg', colors.rightSidebarBg);
    root.style.setProperty('--right-sidebar-opacity', `${colors.rightSidebarOpacity}`);
    root.style.setProperty('--address-bg', colors.addressBg);
    root.style.setProperty('--address-border', colors.addressBorder);
    root.style.setProperty('--address-focus', colors.addressFocus);
    root.style.setProperty('--ui-text', colors.uiText);
    root.style.setProperty('--icon-accent', colors.iconAccent);
  }, [colors]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (!activeTab) return;
    setAddressValue(activeTab.url === 'newtab' ? '' : activeTab.url);
  }, [activeTab]);

  const updateActiveTab = (url: string) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId
          ? { ...tab, url, title: url === 'newtab' ? 'New Tab' : shortTitle(url) }
          : tab,
      ),
    );
  };

  const addTab = (url = 'newtab') => {
    const id = Date.now();
    setTabs((prev) => [...prev, { id, title: shortTitle(url), url }]);
    setActiveTabId(id);
  };

  const closeTab = (id: number) => {
    setTabs((prev) => prev.filter((tab) => tab.id !== id));
    if (activeTabId === id) {
      const next = tabs.find((tab) => tab.id !== id) ?? { id: 0, title: 'New Tab', url: 'newtab' };
      setActiveTabId(next.id);
    }
  };

  const moveTab = (id: number, direction: 'left' | 'right') => {
    setTabs((prev) => {
      const index = prev.findIndex((tab) => tab.id === id);
      if (index < 0) return prev;
      const nextIndex = direction === 'left' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const handleNavigate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = normalizeAddress(addressValue);
    updateActiveTab(target);
  };

  const handleHome = () => updateActiveTab('newtab');

  const goBack = () => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.history.back();
  };

  const goForward = () => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.history.forward();
  };

  const reload = () => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.location.reload();
  };

  const topBarColor = hexToRgba(colors.topBarBg, colors.topBarOpacity);
  const leftSidebarColor = hexToRgba(colors.leftSidebarBg, colors.leftSidebarOpacity);
  const rightSidebarColor = hexToRgba(colors.rightSidebarBg, colors.rightSidebarOpacity);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="sticky top-0 z-40 border-b border-white/10" style={{ backgroundColor: topBarColor }}>
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-xl font-semibold text-slate-100">V</div>
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-slate-400">Vortex</p>
              <p className="text-sm text-slate-200">Ultra-custom browser shell</p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center space-x-2 overflow-x-auto px-2 text-sm sm:space-x-3">
            {tabs.map((tab) => {
              const active = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-left transition focus:outline-none ${
                    active
                      ? 'border-transparent bg-white/10 text-white'
                      : 'border-white/10 bg-slate-900/70 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span className={active ? 'text-violet-300' : 'text-slate-400'}>{tab.title}</span>
                  <span
                    onClick={(event) => {
                      event.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="cursor-pointer rounded-full px-1 text-xs text-slate-400 transition hover:bg-white/10"
                  >
                    ×
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => addTab('newtab')}
              className="inline-flex items-center justify-center rounded-2xl border border-dashed border-slate-500 bg-slate-900/70 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-300 hover:text-white"
            >
              + New Tab
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCustomizerOpen(true)}
              className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Customize
            </button>
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px] gap-4 px-4 py-4 sm:px-6">
        {sidebars.left && (
          <aside
            className="hidden w-72 flex-col gap-4 rounded-3xl border border-white/10 p-4 text-slate-200 lg:flex"
            style={{ backgroundColor: leftSidebarColor }}
          >
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Bookmarks</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-100">
                <li className="rounded-2xl bg-white/5 px-3 py-3">Quick links</li>
                <li className="rounded-2xl bg-white/5 px-3 py-3">Docs</li>
                <li className="rounded-2xl bg-white/5 px-3 py-3">Downloads</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">History</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-100">
                <div className="rounded-2xl bg-white/5 px-3 py-3">No recent history</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebars((prev) => ({ ...prev, left: !prev.left }))}
              className="mt-auto rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Collapse Sidebar
            </button>
          </aside>
        )}

        <main className="relative flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-3 border-b border-white/10 bg-slate-950/70 px-4 py-3">
            <button
              type="button"
              onClick={goBack}
              className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goForward}
              className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Forward
            </button>
            <button
              type="button"
              onClick={reload}
              className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={handleHome}
              className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Home
            </button>

            <form onSubmit={handleNavigate} className="flex flex-1 items-center gap-2">
              <input
                value={addressValue}
                onChange={(event) => setAddressValue(event.target.value)}
                placeholder="Search or enter website"
                className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
              />
              <button
                type="submit"
                className="rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                Go
              </button>
            </form>
          </div>

          <div className="relative h-[calc(100vh-250px)] overflow-hidden">
            {activeTab?.url === 'newtab' ? (
              <NewTabPage />
            ) : (
              <iframe
                ref={iframeRef}
                title={activeTab?.title}
                src={activeTab?.url}
                className="h-full w-full border-0 bg-slate-950"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-950/75 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="text-white">{activeTab?.title}</span>
              <span>•</span>
              <span>{activeTab?.url === 'newtab' ? 'New tab page' : activeTab?.url}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveTab(activeTabId, 'left')}
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Move left
              </button>
              <button
                type="button"
                onClick={() => moveTab(activeTabId, 'right')}
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Move right
              </button>
            </div>
          </div>
        </main>

        {sidebars.right && (
          <aside
            className="hidden w-72 flex-col gap-4 rounded-3xl border border-white/10 p-4 text-slate-200 lg:flex"
            style={{ backgroundColor: rightSidebarColor }}
          >
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Tools</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-100">
                <button className="w-full rounded-2xl bg-white/5 px-3 py-3 text-left transition hover:bg-white/10">Downloads</button>
                <button className="w-full rounded-2xl bg-white/5 px-3 py-3 text-left transition hover:bg-white/10">Extensions</button>
                <button className="w-full rounded-2xl bg-white/5 px-3 py-3 text-left transition hover:bg-white/10">Console</button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebars((prev) => ({ ...prev, right: !prev.right }))}
              className="rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Collapse Tools
            </button>
          </aside>
        )}
      </div>

      <CustomizerDrawer isOpen={isCustomizerOpen} onClose={() => setIsCustomizerOpen(false)} />
    </div>
  );
};

export default App;
