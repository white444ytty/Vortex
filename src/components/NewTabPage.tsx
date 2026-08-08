import React, { useMemo, useState } from 'react';
import { useThemeStore, WallpaperState } from '../stores/themeStore';

const defaultWallpaperUrl = new URL('../assets/wallpapers/default-wallpaper.mp4', import.meta.url).href;

const isUrl = (value: string) => /^(https?:)?\/\//i.test(value);
const isVideoUrl = (value: string) => /\.(mp4|webm)(\?.*)?$/i.test(value);

const determineSource = (wallpaper: WallpaperState) => {
  if (wallpaper.type === 'default') {
    return defaultWallpaperUrl;
  }

  if (!wallpaper.source) {
    return defaultWallpaperUrl;
  }

  return wallpaper.source;
};

const NewTabPage: React.FC = () => {
  const wallpaper = useThemeStore((state) => state.wallpaper);
  const [query, setQuery] = useState('');

  const backgroundSource = determineSource(wallpaper);
  const isVideo = wallpaper.type === 'default' ? true : wallpaper.isVideo || isVideoUrl(wallpaper.source);

  const destination = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return '';
    if (isUrl(trimmed)) {
      return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    }
    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
  }, [query]);

  const handleSearch = () => {
    if (!destination) return;
    window.open(destination, '_blank');
  };

  return (
    <div className="relative h-full w-full overflow-hidden text-slate-100">
      <div className="absolute inset-0">
        {isVideo ? (
          <video
            className="h-full w-full object-cover"
            src={backgroundSource}
            autoPlay
            muted={wallpaper.mute}
            loop={wallpaper.loop}
            playsInline
          />
        ) : (
          <img className="h-full w-full object-cover" src={backgroundSource} alt="New Tab Wallpaper" />
        )}

        <div
          className="absolute inset-0 bg-slate-950/30"
          style={{ backdropFilter: `blur(${wallpaper.blur}px)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" />
      </div>

      <div className="relative z-10 flex min-h-full flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-slate-950/70 p-10 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Vortex New Tab</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Your workspace, your wallpaper.</h1>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {wallpaper.type === 'default' ? 'Default wallpaper' : wallpaper.type === 'url' ? 'Remote wallpaper' : 'Local wallpaper'}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-inner shadow-black/20">
              <p className="mb-3 text-sm text-slate-300">Search instantly or paste a video/image URL.</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search or enter address"
                  className="flex-1 rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-500"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="inline-flex shrink-0 items-center justify-center rounded-3xl bg-violet-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-violet-400"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Wallpaper type</p>
                <p className="mt-3 text-lg font-medium text-white">{isVideo ? 'Video' : 'Image'}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Blur intensity</p>
                <p className="mt-3 text-lg font-medium text-white">{wallpaper.blur}px</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Playback</p>
                <div className="mt-3 flex items-center gap-3 text-white">
                  <span>{wallpaper.mute ? 'Muted' : 'Sound on'}</span>
                  <span className="text-slate-400">•</span>
                  <span>{wallpaper.loop ? 'Looping' : 'Single'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTabPage;
