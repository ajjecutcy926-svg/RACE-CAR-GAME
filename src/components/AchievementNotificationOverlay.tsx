import React, { useEffect } from 'react';
import { Award, Sparkles, X } from 'lucide-react';
import { Achievement } from '../types.ts';

interface AchievementNotificationOverlayProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementNotificationOverlay: React.FC<AchievementNotificationOverlayProps> = ({
  achievement,
  onDismiss,
}) => {
  useEffect(() => {
    if (!achievement) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, 4200);

    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto select-none w-full max-w-md px-3 animate-bounce-in"
    >
      <div className="relative overflow-hidden rounded-2xl bg-slate-950/95 border-2 border-amber-400/90 shadow-[0_0_35px_rgba(245,158,11,0.5)] backdrop-blur-xl p-3.5 sm:p-4 text-slate-100 flex items-center justify-between gap-3 group">
        {/* Holographic animated background beam */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-500/20 to-cyan-500/10 pointer-events-none" />
        
        {/* Shimmer sweep bar */}
        <div className="absolute -inset-full top-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-shimmer pointer-events-none" />

        {/* Left: Trophy/Icon badge with golden glow */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 p-0.5 shadow-lg shadow-amber-500/40 shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-2xl">
              {achievement.icon || '🏆'}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-amber-400 font-racing font-extrabold text-[10px] sm:text-xs tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" />
              <span>ACHIEVEMENT UNLOCKED!</span>
            </div>
            <h3 className="font-racing font-black text-sm sm:text-base text-slate-50 tracking-wide drop-shadow-sm">
              {achievement.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 font-medium line-clamp-1">
              {achievement.description}
            </p>
          </div>
        </div>

        {/* Right: Coin Reward pill & Dismiss Button */}
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/60 text-amber-300 font-racing font-black text-xs sm:text-sm px-2.5 py-1 rounded-xl shadow-md">
            <span>+{achievement.rewardCoins.toLocaleString()}</span>
            <span>🪙</span>
          </div>

          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
            title="Dismiss Notification"
            aria-label="Dismiss Achievement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom subtle progress line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-400" />
      </div>
    </div>
  );
};
