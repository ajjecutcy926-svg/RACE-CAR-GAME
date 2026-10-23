import React from 'react';
import { ArrowLeft, ArrowRight, Flame, Volume2, Zap } from 'lucide-react';

interface MobileControlsProps {
  onInput: (name: 'throttle' | 'brake' | 'steer' | 'handbrake' | 'nitro' | 'horn', value: number | boolean) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onInput }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex justify-between items-end p-4 pb-6 select-none">
      {/* Left Steering Touch Zone: Left and Right arrows */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInput('steer', -1);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput('steer', 0);
          }}
          onMouseDown={() => onInput('steer', -1)}
          onMouseUp={() => onInput('steer', 0)}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900/80 active:bg-cyan-600/80 border-2 border-slate-700 active:border-cyan-400 text-slate-100 flex items-center justify-center shadow-xl active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-8 h-8 sm:w-10 sm:h-10" />
        </button>

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInput('steer', 1);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput('steer', 0);
          }}
          onMouseDown={() => onInput('steer', 1)}
          onMouseUp={() => onInput('steer', 0)}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900/80 active:bg-cyan-600/80 border-2 border-slate-700 active:border-cyan-400 text-slate-100 flex items-center justify-center shadow-xl active:scale-95 transition-transform"
        >
          <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10" />
        </button>

        {/* Horn quick button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInput('horn', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput('horn', false);
          }}
          onMouseDown={() => onInput('horn', true)}
          onMouseUp={() => onInput('horn', false)}
          className="w-12 h-12 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-300 flex items-center justify-center shadow-lg active:scale-90"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {/* Right Pedals Touch Zone: Nitro, Handbrake, Brake/Reverse, Gas */}
      <div className="flex items-end gap-3 pointer-events-auto">
        {/* Aux Action buttons: Nitro & Handbrake */}
        <div className="flex flex-col gap-2">
          {/* Nitro */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onInput('nitro', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onInput('nitro', false);
            }}
            onMouseDown={() => onInput('nitro', true)}
            onMouseUp={() => onInput('nitro', false)}
            className="w-14 h-14 rounded-2xl bg-cyan-950/80 active:bg-cyan-500 border-2 border-cyan-500 text-cyan-300 active:text-white flex flex-col items-center justify-center shadow-lg active:scale-95"
          >
            <Zap className="w-6 h-6" />
            <span className="text-[9px] font-racing font-bold">NITRO</span>
          </button>

          {/* Drift / Handbrake */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onInput('handbrake', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onInput('handbrake', false);
            }}
            onMouseDown={() => onInput('handbrake', true)}
            onMouseUp={() => onInput('handbrake', false)}
            className="w-14 h-14 rounded-2xl bg-amber-950/80 active:bg-amber-500 border-2 border-amber-500 text-amber-300 active:text-white flex flex-col items-center justify-center shadow-lg active:scale-95"
          >
            <Flame className="w-6 h-6" />
            <span className="text-[9px] font-racing font-bold">DRIFT</span>
          </button>
        </div>

        {/* Brake / Reverse Pedal */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInput('brake', 1);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput('brake', 0);
          }}
          onMouseDown={() => onInput('brake', 1)}
          onMouseUp={() => onInput('brake', 0)}
          className="w-16 h-24 sm:w-18 sm:h-28 rounded-2xl bg-red-950/85 active:bg-red-600 border-2 border-red-700 active:border-red-400 text-red-200 flex flex-col items-center justify-center shadow-xl active:scale-95"
        >
          <span className="font-racing font-black text-sm tracking-wider">BRAKE</span>
          <span className="text-[10px] text-red-400 uppercase">REV</span>
        </button>

        {/* Gas / Accelerate Pedal */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInput('throttle', 1);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onInput('throttle', 0);
          }}
          onMouseDown={() => onInput('throttle', 1)}
          onMouseUp={() => onInput('throttle', 0)}
          className="w-18 h-32 sm:w-22 sm:h-36 rounded-2xl bg-emerald-950/90 active:bg-emerald-500 border-2 border-emerald-600 active:border-emerald-300 text-emerald-100 flex flex-col items-center justify-center shadow-2xl active:scale-95"
        >
          <span className="font-racing font-black text-base tracking-widest">GAS</span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase">DRIVE</span>
        </button>
      </div>
    </div>
  );
};
