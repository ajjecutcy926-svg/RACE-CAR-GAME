import React from 'react';
import { Award, Flame, Home, MapPin, RotateCcw, Wrench } from 'lucide-react';
import { GameSummary } from '../types.ts';

interface GameOverModalProps {
  summary: GameSummary;
  onRespawnAtCheckpoint: () => void;
  onRetryLevel: () => void;
  onOpenLevelSelect?: () => void;
  onOpenGarage: () => void;
  onOpenLeaderboard: () => void;
  onQuitToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  summary,
  onRespawnAtCheckpoint,
  onRetryLevel,
  onOpenLevelSelect,
  onOpenGarage,
  onOpenLeaderboard,
  onQuitToMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/90 flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl flex flex-col items-center gap-4 text-center">
        {/* Title */}
        <div>
          <span className="text-[11px] font-racing font-bold tracking-widest text-red-500 uppercase flex items-center justify-center gap-1">
            <Flame className="w-4 h-4 text-red-500 animate-pulse" /> HIGH-SPEED COLLISION
          </span>
          <h2 className="font-racing text-3xl sm:text-4xl font-black text-slate-100 tracking-tight mt-1">
            RUN INTERRUPTED
          </h2>
          {summary.isNewRecord && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-racing font-black px-3 py-1 rounded-full animate-bounce">
              <Award className="w-4 h-4 text-amber-400" /> NEW RECORD SET!
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DISTANCE</span>
            <span className="font-racing text-lg font-black text-slate-100 tabular-nums">
              {(summary.distance / 1000).toFixed(2)} KM
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TOP SPEED</span>
            <span className="font-racing text-lg font-black text-cyan-400 tabular-nums">
              {summary.topSpeed} KM/H
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">NEAR MISSES</span>
            <span className="font-racing text-lg font-black text-emerald-400 tabular-nums">
              {summary.nearMisses}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DRAFT TIME</span>
            <span className="font-racing text-lg font-black text-purple-400 tabular-nums">
              {summary.draftTimeSeconds}s
            </span>
          </div>
        </div>

        {/* Rewards Cluster: Total Score & Coins Earned */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 w-full flex items-center justify-around">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SCORE</div>
            <div className="font-racing text-xl font-black text-amber-400 tabular-nums">
              {summary.score.toLocaleString()}
            </div>
          </div>
          <div className="h-8 w-[1px] bg-slate-800" />
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">COINS EARNED</div>
            <div className="font-racing text-xl font-black text-yellow-300 flex items-center justify-center gap-1 tabular-nums">
              <span>+{summary.coinsEarned}</span>
              <span>🪙</span>
            </div>
          </div>
        </div>

        {/* Two Distinct Critical Options: Respawn at Checkpoint vs Retry from Start */}
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onRespawnAtCheckpoint}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-racing font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-xl transition cursor-pointer"
          >
            <MapPin className="w-5 h-5 fill-slate-950" /> RESPAWN AT CHECKPOINT
          </button>

          <button
            onClick={onRetryLevel}
            className="w-full py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-racing font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> RETRY FROM START LINE
          </button>

          <div className="grid grid-cols-2 gap-2 w-full mt-1">
            {onOpenLevelSelect && (
              <button
                onClick={onOpenLevelSelect}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-racing font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                🏆 LEVELS
              </button>
            )}

            <button
              onClick={onOpenGarage}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-racing font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-cyan-400" /> GARAGE
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={onOpenLeaderboard}
              className="py-2.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/60 text-cyan-300 font-racing font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Award className="w-4 h-4 text-cyan-400" /> RANKS
            </button>

            <button
              onClick={onQuitToMenu}
              className="py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-400 hover:text-white font-racing font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Home className="w-4 h-4" /> MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
