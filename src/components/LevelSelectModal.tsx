import React from 'react';
import { GAME_LEVELS } from '../game/LevelConfig.ts';
import { LevelRecord } from '../types.ts';

interface LevelSelectModalProps {
  unlockedLevels: number[];
  selectedLevelId: number;
  levelRecords: Record<number, LevelRecord>;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  unlockedLevels,
  selectedLevelId,
  levelRecords,
  onSelectLevel,
  onClose,
}) => {
  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'clear':
        return '☀️ Clear';
      case 'sunset':
        return '🌅 Sunset';
      case 'night':
        return '🌙 Night';
      case 'rain':
        return '🌧️ Rain';
      default:
        return '☀️ Clear';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h2 className="text-2xl font-black italic tracking-wide text-white uppercase">
                Career Levels
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              10 challenging stages across unique biomes and atmospheric conditions
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 overflow-y-auto pr-1 pb-2">
          {/* Endless Free Drive Card */}
          <div
            onClick={() => onSelectLevel(0)}
            className={`relative rounded-xl border p-4 transition-all cursor-pointer flex flex-col justify-between ${
              selectedLevelId === 0
                ? 'bg-gradient-to-r from-cyan-950/50 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/20 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[11px] font-black uppercase tracking-wider">
                  Infinite Drive
                </span>
                <span className="text-xs text-slate-400">All Weather Cycles</span>
              </div>
              <h3 className="text-lg font-black text-white italic">Endless Free Highway</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                High-speed endless driving with dynamic weather transitions every 1,200m and rival racer duels.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Target: <strong className="text-cyan-300">Infinite</strong></span>
              <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                Select Mode ➔
              </span>
            </div>
          </div>

          {/* 10 Career Levels */}
          {GAME_LEVELS.map((level) => {
            const isUnlocked = unlockedLevels.includes(level.id);
            const isSelected = selectedLevelId === level.id;
            const record = levelRecords[level.id];
            const stars = record?.stars || 0;

            return (
              <div
                key={level.id}
                onClick={() => {
                  if (isUnlocked) onSelectLevel(level.id);
                }}
                className={`relative rounded-xl border p-4 transition-all flex flex-col justify-between ${
                  !isUnlocked
                    ? 'bg-slate-950/40 border-slate-850 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-400 ring-2 ring-amber-400/20 shadow-lg shadow-amber-500/10 cursor-pointer'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase ${
                        isUnlocked ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                      }`}>
                        Stage {level.id}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {getWeatherIcon(level.weather)}
                      </span>
                    </div>

                    {/* Stars */}
                    {isUnlocked && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <span
                            key={s}
                            className={`text-sm ${s <= stars ? 'text-amber-400' : 'text-slate-700'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}

                    {!isUnlocked && (
                      <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                        🔒 Locked
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-white italic tracking-wide">
                    {level.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    {level.subtitle}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Distance: <strong className="text-white">{level.targetDistance}m</strong>
                  </span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    🪙 +{level.rewardCoins}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs text-slate-400">
          <span>Unlocked: <strong className="text-amber-400">{unlockedLevels.length} / 10</strong> Levels</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
