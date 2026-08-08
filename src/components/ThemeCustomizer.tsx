import React, { useState } from 'react';
import { useThemeStore } from '../stores/themeStore';

const PRESETS: Record<string, Record<string, string>> = {
  'Cyberpunk Neon': {
    '--vortex-topbar-bg': '#081025',
    '--vortex-accent-color': '#ff0066',
    '--vortex-address-bg': '#071022',
    '--vortex-text-primary': '#e6f0ff',
    '--vortex-text-secondary': '#9aa6b2',
    '--vortex-sidebar-bg': '#040815',
  },
  'Slate Glass': {
    '--vortex-topbar-bg': '#0b1220',
    '--vortex-accent-color': '#7c3aed',
    '--vortex-address-bg': '#0f1724',
    '--vortex-text-primary': '#e6eef8',
    '--vortex-text-secondary': '#9aa6b2',
    '--vortex-sidebar-bg': '#061018',
  },
  'Pure OLED Black': {
    '--vortex-topbar-bg': '#000000',
    '--vortex-accent-color': '#00e5ff',
    '--vortex-address-bg': '#000000',
    '--vortex-text-primary': '#ffffff',
    '--vortex-text-secondary': '#9aa6b2',
    '--vortex-sidebar-bg': '#000000',
  },
  Dracula: {
    '--vortex-topbar-bg': '#282a36',
    '--vortex-accent-color': '#bd93f9',
    '--vortex-address-bg': '#1e1f29',
    '--vortex-text-primary': '#f8f8f2',
    '--vortex-text-secondary': '#6272a4',
    '--vortex-sidebar-bg': '#21222c',
  },
};

const ThemeCustomizer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const colors = useThemeStore((s) => s.colors);
  const setColorVar = useThemeStore((s) => s.setColorVar);
  const resetTheme = useThemeStore((s) => s.resetTheme);

  const [local, setLocal] = useState<Record<string, string>>(() => colors as unknown as Record<string, string>);

  const applyPreset = (presetName: string) => {
    const p = PRESETS[presetName];
    Object.entries(p).forEach(([k, v]) => setColorVar(k as any, v));
    setLocal((s) => ({ ...s, ...p }));
  };

  const handleChange = (key: string, value: string) => {
    setLocal((s) => ({ ...s, [key]: value }));
    setColorVar(key as any, value);
  };

  return (
    <div className="fixed right-0 top-0 z-60 h-full w-[420px] bg-[color:var(--vortex-sidebar-bg)]/95 border-l border-white/5 backdrop-blur-md p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Theme Customizer</h3>
        <div className="flex gap-2">
          <button onClick={() => { resetTheme(); setLocal({} as any); }} className="rounded-md bg-white/5 px-3 py-1">Reset</button>
          <button onClick={onClose} className="rounded-md bg-white/5 px-3 py-1">Close</button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="grid gap-2">
          {Object.keys(PRESETS).map((p) => (
            <button key={p} onClick={() => applyPreset(p)} className="rounded-md bg-white/5 px-3 py-2 text-left">{p}</button>
          ))}
        </div>

        <div className="mt-2 space-y-2">
          <label className="text-sm font-medium">Topbar Background</label>
          <input type="color" value={local['--vortex-topbar-bg'] || '#081025'} onChange={(e) => handleChange('--vortex-topbar-bg', e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Accent Color</label>
          <input type="color" value={local['--vortex-accent-color'] || '#7c3aed'} onChange={(e) => handleChange('--vortex-accent-color', e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Address Background</label>
          <input type="color" value={local['--vortex-address-bg'] || '#071022'} onChange={(e) => handleChange('--vortex-address-bg', e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Primary Text</label>
          <input type="color" value={local['--vortex-text-primary'] || '#e6f0ff'} onChange={(e) => handleChange('--vortex-text-primary', e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Secondary Text</label>
          <input type="color" value={local['--vortex-text-secondary'] || '#9aa6b2'} onChange={(e) => handleChange('--vortex-text-secondary', e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Drawer Background</label>
          <input type="color" value={local['--vortex-sidebar-bg'] || '#061018'} onChange={(e) => handleChange('--vortex-sidebar-bg', e.target.value)} />
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
