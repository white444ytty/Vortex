import React, { useMemo, useState } from 'react';
import { useThemeStore } from '../stores/themeStore';

interface CustomizerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const isVideoFile = (value: string) => /\.(mp4|webm)(\?.*)?$/i.test(value);
const isImageFile = (value: string) => /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(value);

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unable to read file')));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const CustomizerDrawer: React.FC<CustomizerDrawerProps> = ({ isOpen, onClose }) => {
  const wallpaper = useThemeStore((state) => state.wallpaper);
  const colors = useThemeStore((state) => state.colors);
  const setColor = useThemeStore((state) => state.setColor);
  const setWallpaperSource = useThemeStore((state) => state.setWallpaperSource);
  const setWallpaper = useThemeStore((state) => state.setWallpaper);
  const resetTheme = useThemeStore((state) => state.resetTheme);

  const [customUrl, setCustomUrl] = useState('');

  const currentWallpaperLabel = useMemo(() => {
    if (wallpaper.type === 'default') return 'Default wallpaper';
    if (wallpaper.type === 'url') return 'Remote URL wallpaper';
    return 'Uploaded wallpaper';
  }, [wallpaper.type]);

  const applyCustomUrl = () => {
    if (!customUrl.trim()) return;
    const url = customUrl.trim();
    const isVideo = isVideoFile(url);
    const isImage = isImageFile(url);
    setWallpaperSource(url, isVideo, 'url');
    setCustomUrl('');
  };

  const uploadWallpaper = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await readFileAsDataUrl(file);
    const isVideo = file.type.startsWith('video/') || isVideoFile(file.name);
    setWallpaperSource(url, isVideo, 'local');
  };

  const itemClass = 'rounded-3xl border border-white/10 bg-slate-950/90 p-4 shadow-lg shadow-black/20';

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-slate-950/95 shadow-2xl shadow-black/60 transition duration-300 ease-out backdrop-blur-xl ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col overflow-y-auto px-6 py-6 text-slate-100">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Theme Settings</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Customizer</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800">
            Close
          </button>
        </div>

        <section className={itemClass}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Wallpaper</p>
              <p className="text-sm font-medium text-white">{currentWallpaperLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setWallpaperSource('', true, 'default')}
              className="rounded-2xl bg-slate-800 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:bg-slate-700"
            >
              Default
            </button>
          </div>

          <div className="space-y-4">
            <label className="block text-sm text-slate-300">Upload image or video</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
              onChange={uploadWallpaper}
              className="w-full rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 file:mr-4 file:rounded-full file:border-0 file:bg-violet-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />

            <div>
              <label className="block text-sm text-slate-300">Remote wallpaper URL</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={customUrl}
                  onChange={(event) => setCustomUrl(event.target.value)}
                  placeholder="https://..."
                  className="flex-1 rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none focus:border-slate-500"
                />
                <button
                  type="button"
                  onClick={applyCustomUrl}
                  className="rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={itemClass}>
          <p className="mb-4 text-sm text-slate-300">Wallpaper Playback</p>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm text-slate-400">Blur intensity</label>
              <input
                type="range"
                min={0}
                max={40}
                value={wallpaper.blur}
                onChange={(event) => setWallpaper({ blur: Number(event.target.value) })}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-violet-500"
              />
              <span className="text-sm text-slate-300">{wallpaper.blur}px</span>
            </div>

            <div className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3">
              <span className="text-sm text-slate-300">Mute video</span>
              <button
                type="button"
                onClick={() => setWallpaper({ mute: !wallpaper.mute })}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${wallpaper.mute ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-200'}`}
              >
                {wallpaper.mute ? 'Muted' : 'Sound on'}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3">
              <span className="text-sm text-slate-300">Loop video</span>
              <button
                type="button"
                onClick={() => setWallpaper({ loop: !wallpaper.loop })}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${wallpaper.loop ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-200'}`}
              >
                {wallpaper.loop ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </section>

        <section className={itemClass}>
          <p className="mb-4 text-sm text-slate-300">Color accents</p>
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-slate-300">Top bar</label>
                <input
                  type="color"
                  value={colors.topBarBg}
                  onChange={(event) => setColor('topBarBg', event.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Top bar opacity</label>
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.02}
                  value={colors.topBarOpacity}
                  onChange={(event) => setColor('topBarOpacity', Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-violet-500"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
                <label className="block text-sm text-slate-300">Active tab accent</label>
                <input
                  type="color"
                  value={colors.tabActive}
                  onChange={(event) => setColor('tabActive', event.target.value)}
                  className="mt-3 h-10 w-full cursor-pointer rounded-xl border border-slate-700 bg-transparent p-0"
                />
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
                <label className="block text-sm text-slate-300">Inactive tab accent</label>
                <input
                  type="color"
                  value={colors.tabInactive}
                  onChange={(event) => setColor('tabInactive', event.target.value)}
                  className="mt-3 h-10 w-full cursor-pointer rounded-xl border border-slate-700 bg-transparent p-0"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-300">Left sidebar</label>
                <input
                  type="color"
                  value={colors.leftSidebarBg}
                  onChange={(event) => setColor('leftSidebarBg', event.target.value)}
                  className="mt-3 h-10 w-full cursor-pointer rounded-xl border border-slate-700 bg-transparent p-0"
                />
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.02}
                  value={colors.leftSidebarOpacity}
                  onChange={(event) => setColor('leftSidebarOpacity', Number(event.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Right sidebar</label>
                <input
                  type="color"
                  value={colors.rightSidebarBg}
                  onChange={(event) => setColor('rightSidebarBg', event.target.value)}
                  className="mt-3 h-10 w-full cursor-pointer rounded-xl border border-slate-700 bg-transparent p-0"
                />
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.02}
                  value={colors.rightSidebarOpacity}
                  onChange={(event) => setColor('rightSidebarOpacity', Number(event.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-violet-500"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-300">Address background</label>
                <input
                  type="color"
                  value={colors.addressBg}
                  onChange={(event) => setColor('addressBg', event.target.value)}
                  className="mt-3 h-10 w-full cursor-pointer rounded-xl border border-slate-700 bg-transparent p-0"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Address border</label>
                <input
                  type="color"
                  value={colors.addressBorder}
                  onChange={(event) => setColor('addressBorder', event.target.value)}
                  className="mt-3 h-10 w-full cursor-pointer rounded-xl border border-slate-700 bg-transparent p-0"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Address focus</label>
                <input
                  type="color"
                  value={colors.addressFocus}
                  onChange={(event) => setColor('addressFocus', event.target.value)}
                  className="mt-3 h-10 w-full cursor-pointer rounded-xl border border-slate-700 bg-transparent p-0"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-300">UI text</label>
                <input
                  type="color"
                  value={colors.uiText}
                  onChange={(event) => setColor('uiText', event.target.value)}
                  className="mt-3 h-10 w-full cursor-pointer rounded-xl border border-slate-700 bg-transparent p-0"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Icon accent</label>
                <input
                  type="color"
                  value={colors.iconAccent}
                  onChange={(event) => setColor('iconAccent', event.target.value)}
                  className="mt-3 h-10 w-full cursor-pointer rounded-xl border border-slate-700 bg-transparent p-0"
                />
              </div>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={resetTheme}
          className="mt-4 inline-flex w-full items-center justify-center rounded-3xl bg-slate-800 px-5 py-4 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
};

export default CustomizerDrawer;
