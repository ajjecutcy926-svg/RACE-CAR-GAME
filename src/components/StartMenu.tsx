import React from 'react';
import { Calendar, Flag, Play, Settings, Trophy, Wrench } from 'lucide-react';
import { CarConfig } from '../types.ts';

interface StartMenuProps {
  onPlay: () => void;
  onOpenGarage: () => void;
  onOpenLevelSelect: () => void;
  onOpenChallenges: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  selectedCar: CarConfig;
  carColor: string;
  selectedLevelName: string;
  selectedLevelId: number;
  coins: number;
  highScore: number;
  bestDistance: number;
  dailyChallengeCount: number;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  onPlay,
  onOpenGarage,
  onOpenLevelSelect,
  onOpenChallenges,
  onOpenLeaderboard,
  onOpenSettings,
  selectedCar,
  carColor,
  selectedLevelName,
  selectedLevelId,
  coins,
  highScore,
  bestDistance,
  dailyChallengeCount,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 sm:p-10 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent pointer-events-auto"
      <div className="absolute top-4 right-4">Made by Ali Haider App</div>
      {/* Top Header: Coins & Records */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-full px-4 py-1.5 shadow-xl">
          <span className="text-xl">🪙</span>
          <span className="font-racing text-lg font-black text-yellow-300 tabular-nums">
            {coins.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end bg-slate-900/80 border border-slate-800/80 rounded-xl px-4 py-1.5 shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">BEST DISTANCE</span>
            <span className="font-racing text-slate-100 font-bold tabular-nums">
              {(bestDistance / 1000).toFixed(2)} KM
            </span>
          </div>

          <div className="flex flex-col items-end bg-slate-900/80 border border-slate-800/80 rounded-xl px-4 py-1.5 shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">HIGH SCORE</span>
            <span className="font-racing text-amber-400 font-black tabular-nums">
              {highScore.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Title Lockup with Bespoke SVG Branding */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="relative inline-block mb-3">
          {/* Bespoke inline SVG Logo */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg viewBox="0 0 100 24" className="w-16 h-5 fill-cyan-400">
              <polygon points="0,20 15,4 85,4 100,20" />
            </svg>
            <span className="text-xs font-racing tracking-[0.35em] text-cyan-400 font-bold uppercase">
              OPEN ROAD 3D
            </span>
            <svg viewBox="0 0 100 24" className="w-16 h-5 fill-cyan-400">
              <polygon points="0,4 15,20 85,20 100,4" />
            </svg>
          </div>

          <h1 className="font-racing text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
            ROAD LEGENDS
          </h1>
          <p className="font-hud text-sm sm:text-base text-slate-300 tracking-widest mt-1 uppercase font-semibold">
            10 Career Stages · Weather Cycles · Checkpoint Racing · Supercars
          </p>
        </div>

        {/* Selected Vehicle & Level Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          {/* Selected Car Badge */}
          <div className="flex items-center gap-2.5 bg-slate-900/85 border border-slate-800 rounded-full px-4 py-1.5 shadow-xl">
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
              style={{ backgroundColor: carColor }}
            />
            <span className="text-xs font-racing font-bold tracking-wider text-slate-200">
              {selectedCar.name}
            </span>
            <button
              onClick={onOpenGarage}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline ml-1 cursor-pointer"
            >
              Garage
            </button>
          </div>

          {/* Selected Level Badge */}
          <div className="flex items-center gap-2.5 bg-slate-900/85 border border-amber-500/30 rounded-full px-4 py-1.5 shadow-xl">
            <Flag className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-racing font-bold tracking-wider text-amber-300">
              {selectedLevelId > 0 ? `Stage ${selectedLevelId}: ${selectedLevelName}` : 'Endless Highway'}
            </span>
            <button
              onClick={onOpenLevelSelect}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold underline ml-1 cursor-pointer"
            >
              Change
            </button>
          </div>
        </div>
      </div>

      {/* Main Buttons & Start CTA */}
      <div className="flex flex-col items-center gap-3.5 w-full max-w-md mx-auto">
        {/* Big Start Race CTA */}
        <button
          onClick={onPlay}
          className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 active:scale-98 transition shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center gap-3 font-racing text-xl sm:text-2xl font-black text-slate-950 tracking-wider cursor-pointer border border-amber-300/40"
        >
          <Play className="w-7 h-7 fill-slate-950" />
          {selectedLevelId > 0 ? `START STAGE ${selectedLevelId}` : 'DRIVE ENDLESS'}
        </button>

        {/* Secondary Navigation Grid (5 columns: Levels, Garage, Tasks, Board, Settings) */}
        <div className="grid grid-cols-5 gap-2 w-full">
          <button
            onClick={onOpenLevelSelect}
            className="py-2.5 px-1 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/30 active:scale-95 transition flex flex-col items-center justify-center gap-1 shadow-lg cursor-pointer group"
          >
            <Flag className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-racing text-[9px] sm:text-[10px] font-bold text-amber-300">LEVELS</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="py-2.5 px-1 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 active:scale-95 transition flex flex-col items-center justify-center gap-1 shadow-lg cursor-pointer group"
          >
            <Wrench className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="font-racing text-[9px] sm:text-[10px] font-bold text-slate-200">GARAGE</span>
          </button>

          <button
            onClick={onOpenChallenges}
            className="relative py-2.5 px-1 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 active:scale-95 transition flex flex-col items-center justify-center gap-1 shadow-lg cursor-pointer group"
          >
            {dailyChallengeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 text-[9px] font-racing font-black px-1.5 py-0.2 rounded-full shadow-md animate-bounce">
                {dailyChallengeCount}
              </span>
            )}
            <Calendar className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-racing text-[9px] sm:text-[10px] font-bold text-slate-200">TASKS</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="py-2.5 px-1 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 active:scale-95 transition flex flex-col items-center justify-center gap-1 shadow-lg cursor-pointer group"
          >
            <Trophy className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
            <span className="font-racing text-[9px] sm:text-[10px] font-bold text-slate-200">BOARD</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="py-2.5 px-1 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 active:scale-95 transition flex flex-col items-center justify-center gap-1 shadow-lg cursor-pointer group"
          >
            <Settings className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
            <span className="font-racing text-[9px] sm:text-[10px] font-bold text-slate-200">CONFIG</span>
          </button>
        </div>

        {/* Flat control-hint line */}
        <div className="text-[11px] sm:text-xs text-slate-400 font-semibold tracking-wider text-center pt-1">
          WASD / Arrows Drive · Space Drift · Shift Nitro · R Radio · C Camera · P Photo Mode · Esc Pause
        </div>
      </div>
    </div>
  );
};
