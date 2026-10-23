import React from 'react';
import { Monitor, Music, Radio, Sliders, Volume2, VolumeX, X } from 'lucide-react';
import { GameSettings } from '../types.ts';
import { RADIO_STATIONS } from '../audio/SoundEngine.ts';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/85 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="font-racing text-2xl font-black text-slate-100">SETTINGS</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Graphics Quality */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-cyan-400" /> GRAPHICS QUALITY
              </span>
              <span className="text-slate-400 uppercase">{settings.graphicsQuality}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'med', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdateSettings({ ...settings, graphicsQuality: q })}
                  className={`py-2 rounded-xl text-xs font-racing font-bold uppercase transition cursor-pointer border ${
                    settings.graphicsQuality === q
                      ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {q === 'low' ? 'Low (Fast)' : q === 'med' ? 'Medium' : 'High (60fps)'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Select 'Low' on older mobile devices or low-end hardware for smoother frame rates.
            </p>
          </div>

          {/* Sound Effects Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-400" /> ENGINE & SFX VOLUME
              </span>
              <span className="font-racing text-amber-400">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => onUpdateSettings({ ...settings, soundVolume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Dynamic Radio Section */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">DYNAMIC RADIO STATIONS</span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, radioMuted: !settings.radioMuted })}
                className={`px-3 py-1 rounded-lg text-[11px] font-racing font-bold tracking-wider transition cursor-pointer flex items-center gap-1.5 border ${
                  settings.radioMuted
                    ? 'bg-red-950/80 border-red-500/80 text-red-300'
                    : 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                }`}
              >
                {settings.radioMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    RADIO MUTED
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    RADIO ACTIVE
                  </>
                )}
              </button>
            </div>

            {/* Station selection cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RADIO_STATIONS.map((station) => {
                const isSelected = settings.radioStation === station.id;
                return (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({
                        ...settings,
                        radioStation: station.id,
                        // If user picks a playable station, un-mute radio automatically
                        radioMuted: station.id === 'off' ? true : false,
                      });
                    }}
                    className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 shadow-md ring-1'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                    style={{
                      borderColor: isSelected ? station.accentColor : undefined,
                      boxShadow: isSelected ? `0 0 14px ${station.accentColor}25` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-racing font-black text-xs text-slate-100 flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: station.accentColor }}
                        />
                        {station.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                        {station.frequency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{station.genre}</span>
                      {station.bpm > 0 && <span className="text-[10px] text-slate-500 font-mono">{station.bpm} BPM</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Radio Volume Slider */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Music className="w-3.5 h-3.5 text-cyan-400" /> RADIO MUSIC VOLUME
                </span>
                <span className="font-racing text-cyan-400">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => onUpdateSettings({ ...settings, musicVolume: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-[10px] text-slate-500 italic">
                Muting the radio leaves engine exhaust, turbo whistles, and tire drifts completely audible.
              </p>
            </div>
          </div>

          {/* Camera View Mode */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300">DEFAULT CAMERA PERSPECTIVE</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'chase-close', label: 'Chase Near' },
                { id: 'chase-far', label: 'Chase Far' },
                { id: 'cockpit', label: 'Hood / POV' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => onUpdateSettings({ ...settings, cameraMode: c.id as any })}
                  className={`py-2 px-1 rounded-xl text-xs font-racing font-bold transition cursor-pointer border ${
                    settings.cameraMode === c.id
                      ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controls Reference */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5 text-xs text-slate-400">
            <span className="font-racing text-slate-200 font-bold block mb-1">CONTROLS REFERENCE</span>
            <div className="flex justify-between">
              <span>Drive / Accelerate</span>
              <span className="text-slate-200 font-semibold">W / Up Arrow / Gas Pedal</span>
            </div>
            <div className="flex justify-between">
              <span>Brake / Reverse</span>
              <span className="text-slate-200 font-semibold">S / Down Arrow / Brake Pedal</span>
            </div>
            <div className="flex justify-between">
              <span>Steer</span>
              <span className="text-slate-200 font-semibold">A & D / Left & Right Arrows</span>
            </div>
            <div className="flex justify-between">
              <span>Handbrake Drift</span>
              <span className="text-slate-200 font-semibold">Spacebar / Drift Button</span>
            </div>
            <div className="flex justify-between">
              <span>Nitro Boost</span>
              <span className="text-cyan-400 font-semibold">Shift / N / Nitro Button</span>
            </div>
            <div className="flex justify-between">
              <span>Switch Camera</span>
              <span className="text-slate-200 font-semibold">C</span>
            </div>
            <div className="flex justify-between">
              <span>Photo Mode</span>
              <span className="text-cyan-400 font-semibold">P / Camera Button</span>
            </div>
            <div className="flex justify-between">
              <span>Cycle Radio Station</span>
              <span className="text-cyan-400 font-semibold">R / Radio Button</span>
            </div>
            <div className="flex justify-between">
              <span>Horn</span>
              <span className="text-slate-200 font-semibold">H</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-racing font-bold text-xs tracking-wider transition cursor-pointer"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
