import React, { useEffect, useMemo, useRef, useState } from 'react';
import NewTabPage from './components/NewTabPage';
import ThemeCustomizer from './components/ThemeCustomizer';
import { useThemeStore } from './stores/themeStore';

const isUrl = (value: string) => /^(https?:\/\/|mailto:|ftp:)/i.test(value) || value.includes('.');

const normalizeAddress = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return 'newtab';
  if (trimmed === 'newtab') return 'newtab';
  if (isUrl(trimmed)) return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
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

const App: React.FC = () => {
  const colors = useThemeStore((s) => s.colors);
  const wallpaper = useThemeStore((s) => s.wallpaper);
  const tabs = useThemeStore((s) => s.tabs);
  const activeTabId = useThemeStore((s) => s.activeTabId);
  const splitView = useThemeStore((s) => s.splitView);
  const resourceSaver = useThemeStore((s) => s.resourceSaver);
  const addTab = useThemeStore((s) => s.addTab);
  const closeTab = useThemeStore((s) => s.closeTab);
  const setActiveTab = useThemeStore((s) => s.setActiveTab);
  const moveTab = useThemeStore((s) => s.moveTab);
  const pinTab = useThemeStore((s) => s.pinTab);
  const suspendTab = useThemeStore((s) => s.suspendTab);
  const resumeTab = useThemeStore((s) => s.resumeTab);
  const toggleSplitView = useThemeStore((s) => s.toggleSplitView);
  const loadFromStorage = useThemeStore((s) => s.loadFromStorage);
  const setCommandPaletteOpen = useThemeStore((s) => s.setCommandPaletteOpen);
  const setResourceSaver = useThemeStore((s) => s.setResourceSaver);

  const iframeRefs = useRef<Record<number, HTMLIFrameElement | null>>({});
  const [addressValue, setAddressValue] = useState('');
  const [engine, setEngine] = useState('Google');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    // apply CSS variables
    if (typeof document !== 'undefined') {
      Object.entries(colors).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    }
  }, [colors]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((s) => !s);
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setCommandPaletteOpen]);

  useEffect(() => {
    if (!resourceSaver) return;
    const timeout = setInterval(() => {
      const active = activeTabId;
      tabs.forEach((t) => {
        if (t.id !== active && !t.pinned) suspendTab(t.id);
      });
    }, 45_000);
    return () => clearInterval(timeout);
  }, [resourceSaver, tabs, activeTabId, suspendTab]);

  const activeTab = useMemo(() => tabs.find((t) => t.id === activeTabId) ?? tabs[0], [tabs, activeTabId]);

  const handleAddTab = () => addTab('newtab');

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    const url = normalizeAddress(addressValue);
    if (!activeTab) return;
    // update tab by closing and adding - simpler: add new tab with url
    const id = addTab(url);
    setActiveTab(id);
    setAddressValue('');
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    const raw = e.dataTransfer.getData('text/plain');
    const from = Number(raw);
    if (Number.isFinite(from)) moveTab(from, dropIndex);
    e.preventDefault();
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 flex h-[42px] items-center gap-3 px-3" style={{ background: `var(--vortex-topbar-bg)` }}>
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/6 text-sm font-bold">V</div>
          <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex gap-2">
            <button title="Back" className="h-6 w-6 text-sm">‹</button>
            <button title="Forward" className="h-6 w-6 text-sm">›</button>
            <button title="Reload" className="h-6 w-6 text-sm">⟳</button>
            <button title="Home" className="h-6 w-6 text-sm" onClick={() => addTab('newtab')}>⌂</button>
          </div>
        </div>

        <nav className="mx-3 flex min-w-0 flex-1 items-center overflow-x-auto" aria-label="Tabs">
          <div className="flex gap-2 pr-2">
            {tabs.map((tab, idx) => {
              const active = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs transition ${
                    active ? 'bg-[color:var(--vortex-accent-color)] text-black' : 'bg-white/5 text-white/80'
                  }`}
                  style={{ WebkitAppRegion: 'no-drag', minWidth: 80 } as any}
                >
                  <span className="truncate max-w-[10rem]">{tab.title}</span>
                  <button onClick={() => pinTab(tab.id, !tab.pinned)} title="Pin" className="text-xs">{tab.pinned ? '📌' : '📍'}</button>
                  <button onClick={() => closeTab(tab.id)} title="Close" className="text-xs">✕</button>
                </div>
              );
            })}
            <button onClick={handleAddTab} className="h-7 w-7 rounded-full bg-white/6 text-sm">+</button>
          </div>
        </nav>

        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <form onSubmit={handleNavigate} className="flex items-center w-[520px] max-w-[48%]">
            <select value={engine} onChange={(e) => setEngine(e.target.value)} className="rounded-l-md bg-black/10 px-2 text-sm">
              <option>Google</option>
              <option>Bing</option>
              <option>DuckDuckGo</option>
            </select>
            <input
              value={addressValue}
              onChange={(e) => setAddressValue(e.target.value)}
              placeholder="Search or enter address"
              className="h-8 w-full rounded-r-md bg-[color:var(--vortex-address-bg)] px-3 text-sm text-[color:var(--vortex-text-primary)] outline-none"
            />
            <button type="submit" className="ml-2 rounded-md bg-[color:var(--vortex-accent-color)] px-3 py-1 text-sm">Go</button>
          </form>

          <button title="Customize" onClick={() => setShowCustomizer(true)} className="h-8 w-8">⚙</button>
          <div className="flex items-center gap-2">
            <button title="Extensions" className="h-8 w-8">⋯</button>
            <button title="Minimize" className="h-8 w-8">━</button>
            <button title="Maximize" className="h-8 w-8">□</button>
            <button title="Close" className="h-8 w-8">✕</button>
          </div>
        </div>
      </header>

      <main className="relative h-[calc(100vh-42px)]">
        {splitView.enabled ? (
          <div className="flex h-full">
            <div className="w-1/2 border-r border-white/5">
              {splitView.leftId ? (
                (() => {
                  const t = tabs.find((x) => x.id === splitView.leftId);
                  if (!t) return null;
                  if (t.url === 'newtab') return <NewTabPage />;
                  if (t.suspended) return <div className="h-full w-full flex items-center justify-center">Suspended</div>;
                  return (
                    <iframe
                      ref={(el) => (iframeRefs.current[t.id] = el)}
                      title={t.title}
                      src={t.url}
                      className="h-full w-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  );
                })()
              ) : (
                <div className="h-full w-full flex items-center justify-center">No tab selected</div>
              )}
            </div>
            <div className="w-1/2">
              {splitView.rightId ? (
                (() => {
                  const t = tabs.find((x) => x.id === splitView.rightId);
                  if (!t) return null;
                  if (t.url === 'newtab') return <NewTabPage />;
                  if (t.suspended) return <div className="h-full w-full flex items-center justify-center">Suspended</div>;
                  return (
                    <iframe
                      ref={(el) => (iframeRefs.current[t.id] = el)}
                      title={t.title}
                      src={t.url}
                      className="h-full w-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  );
                })()
              ) : (
                <div className="h-full w-full flex items-center justify-center">No tab selected</div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full w-full">
            {activeTab?.url === 'newtab' ? (
              <NewTabPage />
            ) : activeTab?.suspended ? (
              <div className="h-full w-full flex items-center justify-center">Tab suspended to save resources</div>
            ) : (
              <iframe
                ref={(el) => activeTab && (iframeRefs.current[activeTab.id] = el)}
                title={activeTab?.title}
                src={activeTab?.url}
                className="h-full w-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            )}
          </div>
        )}
      </main>

      {commandOpen && (
        <div className="fixed inset-0 z-60 flex items-start justify-center pt-24">
          <div className="w-[min(900px,96%)] rounded-lg bg-black/70 p-4 backdrop-blur-md">
            <input autoFocus placeholder="Type command or jump to a tab" className="w-full rounded-md bg-white/5 px-3 py-2 text-white" />
          </div>
        </div>
      )}

      {showCustomizer && <ThemeCustomizer onClose={() => setShowCustomizer(false)} />}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <button onClick={() => setResourceSaver(!resourceSaver)} className="rounded-md bg-white/5 px-3 py-2 text-sm">
          {resourceSaver ? 'Resource Saver: On' : 'Resource Saver: Off'}
        </button>
        <button onClick={() => toggleSplitView()} className="rounded-md bg-white/5 px-3 py-2 text-sm">Toggle Split View</button>
      </div>
    </div>
  );
};

export default App;
