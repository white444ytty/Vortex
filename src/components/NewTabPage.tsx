import React, { useEffect, useState } from 'react';
import { useThemeStore } from '../stores/themeStore';

interface QuickDial {
  id: string;
  title: string;
  url: string;
}

const CLOCK_KEY = 'vortex-clock-24';
const QUICKDIAL_KEY = 'vortex-quickdials';

const NewTabPage: React.FC = () => {
  const wallpaper = useThemeStore((s) => s.wallpaper);
  const setWallpaper = useThemeStore((s) => s.setWallpaper);
  const setWallpaperSource = useThemeStore((s) => s.setWallpaperSource);

  const [clock24, setClock24] = useState<boolean>(() => {
    try {
      return localStorage.getItem(CLOCK_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [query, setQuery] = useState('');
  const [quickDials, setQuickDials] = useState<QuickDial[]>(() => {
    try {
      const raw = localStorage.getItem(QUICKDIAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CLOCK_KEY, clock24 ? '1' : '0');
    } catch {}
  }, [clock24]);

  useEffect(() => {
    try {
      localStorage.setItem(QUICKDIAL_KEY, JSON.stringify(quickDials));
    } catch {}
  }, [quickDials]);

  const addQuickDial = (title: string, url: string) => {
    const d: QuickDial = { id: `qd-${Date.now()}`, title, url };
    setQuickDials((s) => [d, ...s]);
  };

  const removeQuickDial = (id: string) => setQuickDials((s) => s.filter((d) => d.id !== id));

  const handleFile = async (file?: File) => {
    if (!file) return;
    const isVideo = /\.(mp4|webm)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setWallpaperSource(result, isVideo);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSet = (url: string) => {
    const isVideo = /\.(mp4|webm)(\?.*)?$/i.test(url);
    setWallpaperSource(url, isVideo);
  };

  const formatClock = (d: Date) => {
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    if (clock24) return `${h}:${m}`;
    const hh = ((h + 11) % 12) + 1;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${hh}:${m} ${ampm}`;
  };

  return (
    <div className="relative h-full w-full overflow-hidden text-white">
      {/* Wallpaper */}
      <div className="absolute inset-0 -z-10">
        {wallpaper.url ? (
          wallpaper.isVideo ? (
            <video src={wallpaper.url} autoPlay muted={wallpaper.mute} loop={wallpaper.loop} playsInline className="h-full w-full object-cover" />
          ) : (
            <img src={wallpaper.url} alt="wallpaper" className="h-full w-full object-cover" />
          )
        ) : (
          <img src={new URL('../assets/wallpapers/default-wallpaper.png', import.meta.url).href} alt="default wallpaper" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0" style={{ backdropFilter: `blur(${wallpaper.blur}px)` }} />
        <div className="absolute inset-0 bg-black" style={{ opacity: wallpaper.vignette / 100 }} />
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(820px,94%)]">
        <div className="mx-auto w-full rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Search</h2>
              <p className="text-sm text-slate-300">Fast, private, and customizable</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-medium">{formatClock(new Date())}</div>
              <div className="text-xs text-slate-300 mt-1">{new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); const url = query.trim(); if (!url) return; window.open(url.startsWith('http') ? url : `https://${url}`, '_blank'); setQuery(''); }} className="mt-4 flex gap-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search or enter address" className="flex-1 rounded-full bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            <button type="submit" className="rounded-full bg-[color:var(--vortex-accent-color)] px-4 py-2 text-sm font-medium text-black">Search</button>
          </form>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs text-slate-300">Upload Wallpaper</label>
              <input type="file" accept="image/*,video/mp4,video/webm" onChange={(e) => handleFile(e.target.files?.[0])} />
              <div className="mt-2 flex items-center gap-2">
                <input type="text" placeholder="Or paste image/video URL" className="flex-1 rounded-md bg-black/20 px-3 py-2 text-sm" onBlur={(e) => handleUrlSet(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300">Backdrop Blur ({wallpaper.blur}px)</label>
              <input type="range" min={0} max={25} value={wallpaper.blur} onChange={(e) => setWallpaper({ blur: Number(e.target.value) })} />
              <label className="text-xs text-slate-300">Vignette ({wallpaper.vignette}%)</label>
              <input type="range" min={0} max={80} value={wallpaper.vignette} onChange={(e) => setWallpaper({ vignette: Number(e.target.value) })} />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300">Playback</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setWallpaper({ mute: !wallpaper.mute })} className="rounded-md bg-white/5 px-3 py-1">{wallpaper.mute ? 'Muted' : 'Sound On'}</button>
                <button onClick={() => setWallpaper({ loop: !wallpaper.loop })} className="rounded-md bg-white/5 px-3 py-1">{wallpaper.loop ? 'Loop' : 'Once'}</button>
              </div>
              <div className="mt-2">
                <label className="text-xs text-slate-300">Clock</label>
                <div className="mt-1 flex items-center gap-2">
                  <button onClick={() => setClock24(false)} className={`rounded-md px-2 py-1 ${!clock24 ? 'bg-white/5' : ''}`}>12h</button>
                  <button onClick={() => setClock24(true)} className={`rounded-md px-2 py-1 ${clock24 ? 'bg-white/5' : ''}`}>24h</button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Quick Dials</h3>
              <div className="flex items-center gap-2">
                <input id="qd-title" placeholder="Title" className="rounded-md bg-black/20 px-2 py-1 text-sm" />
                <input id="qd-url" placeholder="https://example.com" className="rounded-md bg-black/20 px-2 py-1 text-sm" />
                <button onClick={() => {
                  const t = (document.getElementById('qd-title') as HTMLInputElement).value || 'Link';
                  const u = (document.getElementById('qd-url') as HTMLInputElement).value || '';
                  if (!u) return;
                  addQuickDial(t, u);
                  (document.getElementById('qd-title') as HTMLInputElement).value = '';
                  (document.getElementById('qd-url') as HTMLInputElement).value = '';
                }} className="rounded-md bg-white/5 px-3 py-1 text-sm">Add</button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {quickDials.map((qd) => (
                <div key={qd.id} className="rounded-md bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <a href={qd.url} target="_blank" rel="noreferrer" className="text-sm font-medium">{qd.title}</a>
                    <button onClick={() => removeQuickDial(qd.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTabPage;
