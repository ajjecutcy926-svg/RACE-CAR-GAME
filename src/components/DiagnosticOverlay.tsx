import React, { useEffect, useState } from 'react';
import { Activity, ChevronDown, ChevronUp, Cpu, HardDrive, Layers, X } from 'lucide-react';
import { EngineDiagnostics } from '../types.ts';
import { GameEngine } from '../game/GameEngine.ts';

interface DiagnosticOverlayProps {
  diagnostics?: EngineDiagnostics;
  engine?: GameEngine | null;
  onClose?: () => void;
}

export const DiagnosticOverlay: React.FC<DiagnosticOverlayProps> = ({
  diagnostics: propDiagnostics,
  engine,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [liveDiagnostics, setLiveDiagnostics] = useState<EngineDiagnostics | null>(
    propDiagnostics || (engine ? engine.getDiagnostics() : null)
  );

  // Sample real-time diagnostics at 8Hz (125ms) if engine is available
  useEffect(() => {
    if (!engine) {
      if (propDiagnostics) setLiveDiagnostics(propDiagnostics);
      return;
    }

    const intervalId = window.setInterval(() => {
      setLiveDiagnostics(engine.getDiagnostics());
    }, 125);

    return () => clearInterval(intervalId);
  }, [engine]);

  // Keep synced if prop diagnostics updates
  useEffect(() => {
    if (propDiagnostics) {
      setLiveDiagnostics(propDiagnostics);
    }
  }, [propDiagnostics]);

  const metrics = liveDiagnostics || {
    fps: 60,
    frameTimeMs: 16.6,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    gpuMemoryMb: 0,
  };

  const getFpsColor = (fps: number) => {
    if (fps >= 55) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-950/80',
        border: 'border-emerald-500/50',
        glow: 'shadow-emerald-500/20',
        indicator: 'bg-emerald-400',
      };
    }
    if (fps >= 30) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-950/80',
        border: 'border-amber-500/50',
        glow: 'shadow-amber-500/20',
        indicator: 'bg-amber-400',
      };
    }
    return {
      text: 'text-red-400',
      bg: 'bg-red-950/80',
      border: 'border-red-500/50',
      glow: 'shadow-red-500/20',
      indicator: 'bg-red-400',
    };
  };

  const fpsStyle = getFpsColor(metrics.fps);
  const formattedTriangles =
    metrics.triangles >= 1000 ? `${(metrics.triangles / 1000).toFixed(1)}k` : `${metrics.triangles}`;

  return (
    <aside
      aria-label="Engine Performance Diagnostics"
      className="fixed top-14 sm:top-16 left-3 z-30 pointer-events-auto select-none font-mono transition-all duration-200"
    >
      <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-2xl shadow-2xl p-2.5 sm:p-3 text-xs w-[230px] sm:w-[260px] text-slate-300 space-y-2">
        {/* Header bar: Title, FPS pill, Collapse button & Close button */}
        <div className="flex items-center justify-between gap-1.5 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-racing font-bold text-[11px] tracking-wider text-slate-200 uppercase">
              DIAGNOSTICS
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* FPS Pill Badge */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${fpsStyle.bg} ${fpsStyle.border} ${fpsStyle.text} shadow-sm ${fpsStyle.glow}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${fpsStyle.indicator} animate-ping`} />
              <span className="tabular-nums font-black">{metrics.fps}</span>
              <span className="text-[9px] opacity-75 font-racing">FPS</span>
            </div>

            {/* Toggle Expand / Minimize */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
              title={isExpanded ? 'Minimize Diagnostics' : 'Expand Diagnostics'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Close / Dismiss */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-red-950/80 text-slate-400 hover:text-red-300 flex items-center justify-center transition cursor-pointer border border-transparent hover:border-red-500/40"
                title="Hide Diagnostics (Disable in Settings)"
                aria-label="Close Diagnostics"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Detailed Metrics Panel */}
        {isExpanded ? (
          <div className="space-y-2 pt-0.5 text-[11px]">
            {/* Frame Rate & Time Row */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  FRAME TIME
                </span>
                <span className="font-bold text-slate-100 tabular-nums text-xs">
                  {metrics.frameTimeMs} <span className="text-[10px] text-slate-400 font-normal">ms</span>
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  REFRESH TARGET
                </span>
                <span className="font-bold text-slate-100 tabular-nums text-xs">
                  {metrics.fps >= 55 ? '60 Hz' : 'Dynamic'}
                </span>
              </div>
            </div>

            {/* GPU Memory Footprint */}
            <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-cyan-400" /> GPU MEMORY (EST)
                </span>
                <span className="font-bold text-cyan-300 tabular-nums text-xs">
                  {metrics.gpuMemoryMb}{' '}
                  <span className="text-[10px] text-slate-400 font-normal">MB VRAM</span>
                </span>
              </div>
              {/* Progress bar visual indicator */}
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(10, (metrics.gpuMemoryMb / 128) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                <span>Textures: {metrics.textures}</span>
                <span>Geometries: {metrics.geometries}</span>
              </div>
            </div>

            {/* Draw Calls & Geometry Complexity */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3 text-amber-400" /> DRAW CALLS
                </span>
                <span className="font-bold text-amber-300 tabular-nums text-xs">
                  {metrics.drawCalls} <span className="text-[9px] text-slate-500 font-normal">calls</span>
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-emerald-400" /> POLYGONS
                </span>
                <span className="font-bold text-emerald-300 tabular-nums text-xs">
                  {formattedTriangles} <span className="text-[9px] text-slate-500 font-normal">tris</span>
                </span>
              </div>
            </div>

            {/* JS Heap (Chromium browsers) */}
            {metrics.jsHeapMb !== undefined && (
              <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
                <span>JS Heap Active:</span>
                <span className="font-bold text-slate-300 tabular-nums">{metrics.jsHeapMb} MB</span>
              </div>
            )}
          </div>
        ) : (
          /* Minimized Compact Bar */
          <div className="flex items-center justify-between text-[10px] text-slate-300 pt-0.5 px-0.5">
            <span>
              Calls: <strong className="text-amber-300 tabular-nums">{metrics.drawCalls}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span>
              VRAM: <strong className="text-cyan-300 tabular-nums">{metrics.gpuMemoryMb}MB</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span>
              Time: <strong className="text-slate-200 tabular-nums">{metrics.frameTimeMs}ms</strong>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
