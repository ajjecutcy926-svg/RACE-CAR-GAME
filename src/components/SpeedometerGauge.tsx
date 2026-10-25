import React, { useState, useEffect } from 'react';
import { Flame, Zap } from 'lucide-react';
import { PlayerCarState } from '../types.ts';

interface SpeedometerGaugeProps {
  state: PlayerCarState;
  maxSpeedKmh?: number;
  scale?: number;
  compact?: boolean;
}

export type SpeedUnit = 'kmh' | 'mph';

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({
  state,
  maxSpeedKmh = 360,
  scale = 1.0,
  compact = false,
}) => {
  // Allow toggling between KM/H and MPH with persistence
  const [unit, setUnit] = useState<SpeedUnit>(() => {
    try {
      const saved = localStorage.getItem('road_legends_speed_unit');
      return saved === 'mph' ? 'mph' : 'kmh';
    } catch {
      return 'kmh';
    }
  });

  const toggleUnit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = unit === 'kmh' ? 'mph' : 'kmh';
    setUnit(next);
    try {
      localStorage.setItem('road_legends_speed_unit', next);
    } catch {
      // ignore
    }
  };

  const isMph = unit === 'mph';
  const displaySpeed = isMph
    ? Math.round(state.speedKmh * 0.621371)
    : Math.round(state.speedKmh);
  const maxDisplaySpeed = isMph ? Math.round(maxSpeedKmh * 0.621371) : maxSpeedKmh;

  // Normalized speed ratio (0 to 1+)
  const speedRatio = Math.min(1.1, Math.max(0, state.speedKmh / maxSpeedKmh));

  // Acceleration / load glow intensity
  const isAccelerating = state.throttle > 0.05;
  const isNitro = state.isNitroActive;
  const glowIntensity = Math.min(
    1,
    0.25 +
      (isAccelerating ? state.throttle * 0.45 : 0) +
      (isNitro ? 0.35 : 0) +
      speedRatio * 0.3
  );

  // Dynamic glow color matching speed band
  const getGlowColor = () => {
    if (isNitro) return '#38bdf8'; // Electric blue during nitro
    if (speedRatio > 0.8) return '#ef4444'; // Redline crimson
    if (speedRatio > 0.5) return '#f59e0b'; // Amber gold
    return '#06b6d4'; // Cyan neon
  };

  const glowColor = getGlowColor();

  // Circular gauge geometry
  // Circle center (100, 100), radius 72
  // Sweep: 260 degrees (from 140° to 400°). Gap: 100 degrees at bottom.
  const radius = 72;
  const circumference = 2 * Math.PI * radius; // ~452.39
  const arcSweep = 260;
  const arcLength = (arcSweep / 360) * circumference; // ~326.7
  const strokeDashoffset = arcLength * (1 - Math.min(1, speedRatio));

  // Secondary RPM outer arc (radius 84)
  const rpmRadius = 86;
  const rpmCircumference = 2 * Math.PI * rpmRadius; // ~540.35
  const rpmArcLength = (arcSweep / 360) * rpmCircumference;
  const rpmRatio = Math.min(1, Math.max(0, (state.rpm - 1000) / 7500));
  const rpmDashoffset = rpmArcLength * (1 - rpmRatio);
  const isRedline = state.rpm > 7200;

  // Calculate tip point coordinates for the needle/beacon glow
  // Angle starts at 140° (top-left towards bottom) and sweeps 260° clockwise
  const currentAngleDeg = 140 + speedRatio * arcSweep;
  const currentAngleRad = (currentAngleDeg * Math.PI) / 180;
  const tipX = 100 + radius * Math.cos(currentAngleRad);
  const tipY = 100 + radius * Math.sin(currentAngleRad);

  // Generate 9 major tick markers along the 260° arc
  const totalTicks = 9;
  const ticks = Array.from({ length: totalTicks }, (_, i) => {
    const tickRatio = i / (totalTicks - 1);
    const angleDeg = 140 + tickRatio * arcSweep;
    const angleRad = (angleDeg * Math.PI) / 180;
    const rInner = 60;
    const rOuter = 66;
    const x1 = 100 + rInner * Math.cos(angleRad);
    const y1 = 100 + rInner * Math.sin(angleRad);
    const x2 = 100 + rOuter * Math.cos(angleRad);
    const y2 = 100 + rOuter * Math.sin(angleRad);
    const isActive = speedRatio >= tickRatio;
    const tickValue = Math.round(tickRatio * maxDisplaySpeed);
    return { x1, y1, x2, y2, isActive, tickRatio, tickValue };
  });

  return (
    <div
      className="relative flex flex-col items-center select-none origin-bottom-right transition-transform duration-100 will-change-transform"
      style={{
        transform: `scale(${scale})`,
      }}
    >
      {/* Gauge Container with Dynamic Ambient Glow */}
      <div
        className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center transition-all duration-150"
        style={{
          filter: `drop-shadow(0 0 ${Math.round(8 + glowIntensity * 18)}px ${glowColor}${Math.round(
            glowIntensity * 220
          )
            .toString(16)
            .padStart(2, '0')})`,
        }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full transform transition-transform"
        >
          <defs>
            {/* Speed Gradient */}
            <linearGradient id="speedGaugeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="45%" stopColor="#38bdf8" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="90%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            {/* Nitro Overdrive Gradient */}
            <linearGradient id="nitroGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="50%" stopColor="#4facfe" />
              <stop offset="100%" stopColor="#00ffff" />
            </linearGradient>

            {/* Ambient Background Radial Glow */}
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={glowColor} stopOpacity={0.18 * glowIntensity} />
              <stop offset="65%" stopColor="#0f172a" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
            </radialGradient>

            {/* Filter for Tip Glow */}
            <filter id="beaconGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Dial Background Face */}
          <circle cx="100" cy="100" r="92" fill="url(#centerGlow)" stroke="#1e293b" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="72" fill="none" stroke="#0f172a" strokeWidth="10" opacity="0.9" />

          {/* RPM Outer Track (Dark base) */}
          <circle
            cx="100"
            cy="100"
            r={rpmRadius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="3"
            strokeDasharray={`${rpmArcLength} ${rpmCircumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(140 100 100)"
            opacity="0.5"
          />

          {/* RPM Active Trace */}
          <circle
            cx="100"
            cy="100"
            r={rpmRadius}
            fill="none"
            stroke={isRedline ? '#ef4444' : '#f59e0b'}
            strokeWidth="3.5"
            strokeDasharray={`${rpmArcLength} ${rpmCircumference}`}
            strokeDashoffset={rpmDashoffset}
            strokeLinecap="round"
            transform="rotate(140 100 100)"
            className="transition-all duration-75"
          />

          {/* Speed Background Inactive Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#182234"
            strokeWidth="9"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(140 100 100)"
          />

          {/* Dynamic Speed Gauge Active Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={isNitro ? 'url(#nitroGaugeGrad)' : 'url(#speedGaugeGrad)'}
            strokeWidth={10 + glowIntensity * 2}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(140 100 100)"
            className="transition-all duration-75 ease-out"
          />

          {/* Radial Tick Lines */}
          {ticks.map((t, idx) => (
            <line
              key={idx}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.isActive ? (isNitro ? '#38bdf8' : '#f8fafc') : '#475569'}
              strokeWidth={t.isActive ? 2.5 : 1.5}
              strokeLinecap="round"
              opacity={t.isActive ? 1 : 0.4}
              className="transition-colors duration-100"
            />
          ))}

          {/* Glowing Beacon / Tip Needle at Leading Edge of Speed Arc */}
          {speedRatio > 0.02 && (
            <g filter="url(#beaconGlow)">
              <circle
                cx={tipX}
                cy={tipY}
                r={isNitro ? 6 : 4.5}
                fill={isNitro ? '#ffffff' : glowColor}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="transition-all duration-75"
              />
              <circle
                cx={tipX}
                cy={tipY}
                r={isNitro ? 10 : 8}
                fill={glowColor}
                opacity={0.65}
              />
            </g>
          )}
        </svg>

        {/* Center Digital Readout HUD */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {/* Gear Pill */}
          <div className="flex items-center gap-1 bg-slate-900/95 border border-slate-700/80 px-2 py-0.5 rounded-md shadow-md mb-0.5 backdrop-blur-sm">
            <span className="text-[9px] font-racing font-bold text-slate-400">GEAR</span>
            <span
              className={`font-racing text-xs font-black ${
                state.gear === 'R'
                  ? 'text-red-400'
                  : state.gear === 'N'
                  ? 'text-slate-400'
                  : 'text-amber-400'
              }`}
            >
              {state.gear}
            </span>
          </div>

          {/* Main Large Speed Readout */}
          <div className="flex items-baseline justify-center">
            <span
              className="font-racing text-4xl sm:text-5xl font-black text-slate-100 tabular-nums tracking-tighter transition-all"
              style={{
                textShadow: `0 0 ${Math.round(6 + glowIntensity * 12)}px ${glowColor}`,
              }}
            >
              {displaySpeed}
            </span>
          </div>

          {/* Clickable Unit Toggle Button (KM/H <-> MPH) */}
          <button
            onClick={toggleUnit}
            className="pointer-events-auto mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/60 transition active:scale-95 cursor-pointer shadow-md group"
            title={`Current speed unit: ${isMph ? 'Miles Per Hour' : 'Kilometers Per Hour'}. Click to toggle.`}
          >
            <span
              className={`font-racing text-[10px] font-bold tracking-wider uppercase transition-colors ${
                isMph ? 'text-amber-400 group-hover:text-amber-300' : 'text-cyan-400 group-hover:text-cyan-300'
              }`}
            >
              {isMph ? 'MPH' : 'KM/H'}
            </span>
            <span className="text-[9px] text-slate-500 group-hover:text-slate-300">⇄</span>
          </button>

          {/* Acceleration & Nitro Indicators */}
          <div className="flex items-center gap-1.5 mt-1">
            {isNitro && (
              <span className="flex items-center gap-0.5 text-[9px] font-racing font-black text-cyan-300 bg-cyan-950/80 border border-cyan-500/80 px-1.5 py-0.2 rounded animate-pulse">
                <Zap className="w-2.5 h-2.5 text-cyan-400" /> NITRO
              </span>
            )}
            {isAccelerating && !isNitro && (
              <span className="text-[8px] font-racing font-bold text-amber-400/90 tracking-widest uppercase">
                ACCEL {Math.round(state.throttle * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Auxiliary Tachometer and Nitro Bars below the circular gauge */}
      <div className="w-full max-w-[200px] mt-1 flex flex-col gap-1.5 bg-slate-950/85 border border-slate-800/80 rounded-xl px-2.5 py-2 shadow-xl backdrop-blur-md">
        {/* RPM Bar */}
        <div>
          <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-0.5 font-racing">
            <span>RPM</span>
            <span className={isRedline ? 'text-red-400 font-black animate-pulse' : 'text-slate-300'}>
              {(state.rpm / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden flex gap-0.5 border border-slate-800">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                isRedline ? 'bg-red-500 shadow-md shadow-red-500/50' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
              }`}
              style={{ width: `${rpmRatio * 100}%` }}
            />
          </div>
        </div>

        {/* Nitro Boost Bar */}
        <div>
          <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-0.5 font-racing">
            <span className="flex items-center gap-1 text-cyan-400">
              <Zap className="w-2.5 h-2.5" /> NITRO
            </span>
            <span className="text-cyan-300 tabular-nums">{state.nitroGauge}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                state.isNitroActive
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-sm shadow-cyan-400/50 animate-pulse'
                  : 'bg-cyan-500'
              }`}
              style={{ width: `${state.nitroGauge}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
