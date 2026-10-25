import { Award, Camera, Home, MapPin, Play, RotateCcw, Settings, Trophy } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRespawnAtCheckpoint: () => void;
  onRestart: () => void;
  onOpenLevelSelect?: () => void;
  onOpenAchievements?: () => void;
  onEnterPhotoMode: () => void;
  onOpenSettings: () => void;
  onQuitToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRespawnAtCheckpoint,
  onRestart,
  onOpenLevelSelect,
  onOpenAchievements,
  onEnterPhotoMode,
  onOpenSettings,
  onQuitToMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/85 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center gap-3.5 text-center">
        <h2 className="font-racing text-3xl font-black text-slate-100 tracking-tight">GAME PAUSED</h2>
        <p className="text-xs text-slate-400 font-semibold -mt-2">Take a breath, legend</p>

        <div className="flex flex-col gap-2 w-full mt-1">
          {/* Resume Option: continues current attempt immediately */}
          <button
            onClick={onResume}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-racing font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" /> RESUME RACE
          </button>

          {/* Respawn at Checkpoint: safe recovery on road surface */}
          <button
            onClick={onRespawnAtCheckpoint}
            className="w-full py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 font-racing font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-emerald-400" /> RESPAWN AT CHECKPOINT
          </button>

          {/* Retry: reinitializes level from starting line */}
          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-racing font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> RETRY FROM START LINE
          </button>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={onEnterPhotoMode}
              className="py-2.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/60 text-cyan-300 font-racing font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Camera className="w-4 h-4 text-cyan-400" /> PHOTO (P)
            </button>

            {onOpenAchievements ? (
              <button
                onClick={onOpenAchievements}
                className="py-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 font-racing font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-400" /> ACHIEVEMENTS
              </button>
            ) : onOpenLevelSelect ? (
              <button
                onClick={onOpenLevelSelect}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-racing font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400" /> LEVELS
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={onOpenSettings}
              className="py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-racing font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Settings className="w-4 h-4" /> SETTINGS
            </button>

            <button
              onClick={onQuitToMenu}
              className="py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 font-racing font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Home className="w-4 h-4" /> MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
