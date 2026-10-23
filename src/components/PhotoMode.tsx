import React, { useState, useEffect, useRef } from 'react';
import { Camera, ChevronDown, ChevronUp, Download, Eye, EyeOff, Grid, Maximize2, Palette, RefreshCw, Sliders, X, ZoomIn, ZoomOut } from 'lucide-react';
import { CarConfig } from '../types.ts';

interface PhotoModeProps {
  carConfig: CarConfig;
  onRotateOrbit: (deltaX: number, deltaY: number) => void;
  onZoomOrbit: (deltaDist: number) => void;
  onSetFov: (fov: number) => void;
  onSetRoll: (rollDeg: number) => void;
  onSetHeight: (height: number) => void;
  onCaptureScreenshot: () => string;
  onExit: () => void;
}

export type PhotoFilter = 'normal' | 'cinematic' | 'noir' | 'neon' | 'vintage';

export const PhotoMode: React.FC<PhotoModeProps> = ({
  carConfig,
  onRotateOrbit,
  onZoomOrbit,
  onSetFov,
  onSetRoll,
  onSetHeight,
  onCaptureScreenshot,
  onExit,
}) => {
  // UI visibility state
  const [hideUI, setHideUI] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [activeTab, setActiveTab] = useState<'lens' | 'filter'>('lens');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Camera settings
  const [fov, setFov] = useState(55);
  const [roll, setRoll] = useState(0);
  const [heightOffset, setHeightOffset] = useState(0.8);
  const [activeFilter, setActiveFilter] = useState<PhotoFilter>('normal');

  // Flash effect on photo capture
  const [isFlashing, setIsFlashing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drag interaction refs
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef(0);

  // Play synthesized camera shutter sound
  const playShutterSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // 1. Mechanical Shutter Click 1
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);

      // 2. Mechanical Shutter Click 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(900, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      gain2.gain.setValueAtTime(0.35, now + 0.06);
      gain2.gain.linearRampToValueAtTime(0.001, now + 0.12);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.13);
    } catch {
      // Audio fallback
    }
  };

  const handleCapture = () => {
    playShutterSound();
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    try {
      const dataUrl = onCaptureScreenshot();
      const link = document.createElement('a');
      const timeStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `road-legends-${carConfig.id}-${timeStr}.png`;
      link.href = dataUrl;
      link.click();

      setToastMessage('PHOTO SAVED & DOWNLOADED');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      console.error('Failed to capture screenshot', e);
    }
  };

  // Keyboard shortcut listener ('H' to hide UI, 'Space' to capture, 'G' for grid, 'Esc' or 'P' to exit)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyH') {
        setHideUI((prev) => !prev);
      } else if (e.code === 'KeyG') {
        setShowGrid((prev) => !prev);
      } else if (e.code === 'Space' && !hideUI) {
        e.preventDefault();
        handleCapture();
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [hideUI]);

  // Touch and Mouse Orbit Listeners
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    onRotateOrbit(deltaX, deltaY);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    onZoomOrbit(e.deltaY * 0.008);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const deltaX = e.touches[0].clientX - lastMousePosRef.current.x;
      const deltaY = e.touches[0].clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      onRotateOrbit(deltaX, deltaY);
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const diff = touchStartDistRef.current - dist;
      onZoomOrbit(diff * 0.02);
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Filter color CSS overlays
  const filterStyles: Record<PhotoFilter, string> = {
    normal: '',
    cinematic: 'sepia(25%) contrast(115%) saturate(120%)',
    noir: 'grayscale(100%) contrast(140%) brightness(90%)',
    neon: 'contrast(130%) hue-rotate(180deg) saturate(140%)',
    vintage: 'sepia(45%) contrast(110%) brightness(95%) saturate(90%)',
  };

  return (
    <div
      className="fixed inset-0 z-40 select-none overflow-hidden touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Visual Color Filter Applied to Canvas Overlay */}
      {activeFilter !== 'normal' && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300 z-10"
          style={{ backdropFilter: filterStyles[activeFilter] }}
        />
      )}

      {/* Shutter Camera Flash effect */}
      {isFlashing && (
        <div className="absolute inset-0 bg-white pointer-events-none z-50 animate-out fade-out duration-300" />
      )}

      {/* Composition Grid (Rule of Thirds) */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 opacity-30">
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-white" />
          <div className="border-r border-white" />
          <div />
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-racing font-bold text-xs px-4 py-2 rounded-full shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Zen Mode Restore Pill (Visible when UI is hidden) */}
      {hideUI && (
        <button
          onClick={() => setHideUI(false)}
          className="absolute bottom-6 right-6 z-50 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2 rounded-full flex items-center gap-2 text-xs font-racing font-bold shadow-2xl cursor-pointer"
        >
          <Eye className="w-4 h-4 text-cyan-400" /> SHOW PHOTO CONTROLS (H)
        </button>
      )}

      {/* Standard Low-Occlusion HUD Overlay */}
      {!hideUI && (
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 sm:p-6">
          {/* Top Bar: Vehicle Info, Shortcuts & Exit */}
          <div className="flex items-center justify-between w-full">
            {/* Left: Mode Badge & Car Details */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2 shadow-xl pointer-events-auto">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-racing font-bold tracking-widest text-cyan-400 uppercase">
                  PHOTO MODE
                </span>
              </div>
              <h3 className="font-racing text-lg font-black text-slate-100 mt-0.5">
                {carConfig.name}
              </h3>
            </div>

            {/* Right: Quick Toggles & Exit */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Grid Toggle */}
              <button
                onClick={() => setShowGrid((g) => !g)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition cursor-pointer shadow-lg ${
                  showGrid
                    ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
                title="Toggle 3x3 Composition Grid (G)"
              >
                <Grid className="w-4 h-4" />
              </button>

              {/* Hide UI (Zen Mode) */}
              <button
                onClick={() => setHideUI(true)}
                className="w-10 h-10 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center transition cursor-pointer shadow-lg"
                title="Hide All UI Elements (H)"
              >
                <EyeOff className="w-4 h-4" />
              </button>

              {/* Exit Photo Mode */}
              <button
                onClick={onExit}
                className="px-4 h-10 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 font-racing font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg"
                title="Exit Photo Mode (Esc)"
              >
                <X className="w-4 h-4" /> EXIT
              </button>
            </div>
          </div>

          {/* Center Hint */}
          <div className="mx-auto text-[11px] font-racing text-slate-400 tracking-wider bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800/60 hidden sm:block">
            DRAG TO ORBIT · SCROLL TO ZOOM · SPACE TO CAPTURE
          </div>

          {/* Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion per Three.js Directives) */}
          <div className="flex flex-col items-center max-w-xl mx-auto w-full pointer-events-auto">
            {/* Collapse/Expand Drawer Toggle */}
            <button
              onClick={() => setIsDrawerOpen((o) => !o)}
              className="bg-slate-950/90 border-t border-x border-slate-800 px-4 py-1 rounded-t-xl text-[10px] font-racing font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer shadow-lg"
            >
              {isDrawerOpen ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> HIDE SETTINGS
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" /> CAMERA ADJUSTMENTS
                </>
              )}
            </button>

            {/* Main Dock Container */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl w-full flex flex-col gap-3">
              {/* Expandable Adjustments Tray */}
              {isDrawerOpen && (
                <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-3">
                  {/* Category Switcher: Lens vs Filter */}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setActiveTab('lens')}
                      className={`px-3 py-1 rounded-lg text-xs font-racing font-bold tracking-wider transition cursor-pointer ${
                        activeTab === 'lens'
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5 inline mr-1" /> LENS OPTICS
                    </button>
                    <button
                      onClick={() => setActiveTab('filter')}
                      className={`px-3 py-1 rounded-lg text-xs font-racing font-bold tracking-wider transition cursor-pointer ${
                        activeTab === 'filter'
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Palette className="w-3.5 h-3.5 inline mr-1" /> COLOR GRADING
                    </button>
                  </div>

                  {activeTab === 'lens' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* FOV / Focal Length */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400 font-racing">
                          <span>FOV ZOOM</span>
                          <span className="text-cyan-400">{fov}°</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="85"
                          value={fov}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFov(val);
                            onSetFov(val);
                          }}
                          className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                      </div>

                      {/* Elevation Height */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400 font-racing">
                          <span>HEIGHT</span>
                          <span className="text-cyan-400">{heightOffset.toFixed(1)}m</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="2.5"
                          step="0.1"
                          value={heightOffset}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setHeightOffset(val);
                            onSetHeight(val);
                          }}
                          className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                      </div>

                      {/* Dutch Tilt Roll Angle */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400 font-racing">
                          <span>DUTCH TILT</span>
                          <span className="text-cyan-400">{roll}°</span>
                        </div>
                        <input
                          type="range"
                          min="-15"
                          max="15"
                          value={roll}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setRoll(val);
                            onSetRoll(val);
                          }}
                          className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {[
                        { id: 'normal', label: 'Natural' },
                        { id: 'cinematic', label: 'Sunset Amber' },
                        { id: 'noir', label: 'Noir B&W' },
                        { id: 'neon', label: 'Neon Cyber' },
                        { id: 'vintage', label: 'Vintage Chrome' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setActiveFilter(f.id as PhotoFilter)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-racing font-bold transition cursor-pointer border ${
                            activeFilter === f.id
                              ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Master Shutter Action Bar */}
              <div className="flex items-center justify-between gap-3">
                {/* Reset Camera to Default */}
                <button
                  onClick={() => {
                    setFov(55);
                    setRoll(0);
                    setHeightOffset(0.8);
                    setActiveFilter('normal');
                    onSetFov(55);
                    onSetRoll(0);
                    onSetHeight(0.8);
                    onZoomOrbit(0);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-racing font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Reset Camera Parameters"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> RESET
                </button>

                {/* Big Shutter Button */}
                <button
                  onClick={handleCapture}
                  className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-racing font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-95 transition cursor-pointer"
                >
                  <Camera className="w-5 h-5 fill-slate-950" />
                  CAPTURE HIGH-RES SCREENSHOT
                </button>

                {/* Quick Zoom Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onZoomOrbit(-1.0)}
                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onZoomOrbit(1.0)}
                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
