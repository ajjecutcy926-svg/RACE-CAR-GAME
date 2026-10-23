import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  Camera,
  CloudRain,
  Flame,
  Layers,
  Moon,
  Navigation,
  Pause,
  Radar as RadarIcon,
  Radio,
  Shield,
  ShieldAlert,
  Sun,
  Sunrise,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { PlayerCarState, RadioStationId, WeatherType, RearThreat } from '../types.ts';
import { RADIO_STATIONS } from '../audio/SoundEngine.ts';

interface HUDProps {
  state: PlayerCarState | null;
  isMuted: boolean;
  radioStation: RadioStationId;
  isRadioMuted: boolean;
  onToggleMute: () => void;
  onCycleRadio: () => void;
  onToggleRadioMute: () => void;
  onPause: () => void;
  onCycleCamera: () => void;
  onEnterPhotoMode: () => void;
  popupMessage: { text: string; type: string } | null;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  isMuted,
  radioStation,
  isRadioMuted,
  onToggleMute,
  onCycleRadio,
  onToggleRadioMute,
  onPause,
  onCycleCamera,
  onEnterPhotoMode,
  popupMessage,
}) => {
  const [radarViewMode, setRadarViewMode] = useState<'scope' | 'lanes'>('scope');

  if (!state) return null;

  const weatherIcons: Record<WeatherType, React.ReactNode> = {
    clear: <Sun className="w-4 h-4 text-amber-400" />,
    sunset: <Sunrise className="w-4 h-4 text-orange-400" />,
    rain: <CloudRain className="w-4 h-4 text-blue-400" />,
    night: <Moon className="w-4 h-4 text-indigo-400" />,
  };

  const weatherLabels: Record<WeatherType, string> = {
    clear: 'CLEAR SKY',
    sunset: 'GOLDEN HOUR',
    rain: 'HEAVY RAIN',
    night: 'NEON NIGHT',
  };

  const vehicleIcons: Record<string, string> = {
    sedan: '🚗',
    suv: '🚙',
    truck: '🚛',
    sports: '🏎️',
    rival: '⚡',
  };

  const rpmPercent = Math.min(100, Math.max(0, ((state.rpm - 1000) / 7500) * 100));
  const isRedline = state.rpm > 7200;

  // Rear threats lane mapping (4-lane highway)
  const lanes = [
    { index: 0, label: 'L1', name: 'LEFT' },
    { index: 1, label: 'L2', name: 'MID-L' },
    { index: 2, label: 'L3', name: 'MID-R' },
    { index: 3, label: 'L4', name: 'RIGHT' },
  ];

  const rearThreats = state.rearThreats || [];
  const criticalThreat = state.criticalRearThreat || null;

  // Categorize rear threats into 3 directional approach vectors
  const leftThreats = rearThreats
    .filter((t) => t.laneIndex <= 1 || t.lateralOffset < -0.9)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
  const primaryLeftThreat = leftThreats.length > 0 ? leftThreats[0] : null;

  const centerThreats = rearThreats
    .filter((t) => Math.abs(t.lateralOffset) <= 1.6)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
  const primaryCenterThreat = centerThreats.length > 0 ? centerThreats[0] : null;

  const rightThreats = rearThreats
    .filter((t) => t.laneIndex >= 2 || t.lateralOffset > 0.9)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
  const primaryRightThreat = rightThreats.length > 0 ? rightThreats[0] : null;

  // Check left and right blind spots for proximity indicators (< 18m)
  const leftBlindSpotThreat = rearThreats.find(
    (t) => (t.laneIndex <= 1 || t.lateralOffset < -1.2) && t.distanceMeters <= 18
  );
  const rightBlindSpotThreat = rearThreats.find(
    (t) => (t.laneIndex >= 2 || t.lateralOffset > 1.2) && t.distanceMeters <= 18
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 sm:p-5 select-none overflow-hidden">
      {/* Top Bar: Telemetry, Stage Progress, Distance, Controls */}
      <div className="flex items-start justify-between w-full gap-2">
        {/* Left Telemetry Cluster: Score & Coins */}
        <div className="flex flex-col gap-1">
          <div className="bg-slate-950/85 border border-slate-800/80 rounded-lg px-3 py-1.5 flex items-center gap-3 shadow-lg backdrop-blur-sm">
            <div>
              <div className="text-[10px] tracking-wider text-slate-400 font-bold uppercase">SCORE</div>
              <div className="font-racing text-lg sm:text-xl font-black text-amber-400 tabular-nums">
                {state.score.toLocaleString()}
              </div>
            </div>
            <div className="h-7 w-[1px] bg-slate-800" />
            <div>
              <div className="text-[10px] tracking-wider text-slate-400 font-bold uppercase">COINS</div>
              <div className="font-racing text-lg sm:text-xl font-black text-yellow-300 flex items-center gap-1 tabular-nums">
                <span className="text-yellow-400">🪙</span>
                {state.coinsEarned}
              </div>
            </div>
          </div>

          {/* Weather Tag */}
          <div className="inline-flex items-center gap-1.5 bg-slate-950/70 border border-slate-800/70 rounded-md px-2.5 py-1 text-xs text-slate-300 font-semibold w-fit backdrop-blur-sm">
            {weatherIcons[state.currentWeather]}
            <span className="tracking-wide text-[11px]">{weatherLabels[state.currentWeather]}</span>
          </div>
        </div>

        {/* Center: Stage Progress or Distance Marker & Overhead Rear Radar Visor */}
        <div className="flex flex-col items-center max-w-xs sm:max-w-md w-full px-1">
          {state.targetDistance > 0 ? (
            /* Career Level Progress Bar */
            <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl px-4 py-1.5 shadow-2xl flex flex-col items-center w-full backdrop-blur-sm">
              <div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-300 mb-1">
                <span className="text-amber-400 font-black tracking-wide uppercase">
                  Stage {state.levelId}: {state.levelName}
                </span>
                <span className="text-slate-400 tabular-nums">
                  {state.distanceMeters} / {state.targetDistance}m
                </span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 flex relative">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-150 rounded-full"
                  style={{ width: `${state.levelProgressPercent}%` }}
                />
              </div>
            </div>
          ) : (
            /* Endless Highway Distance */
            <div className="bg-slate-950/85 border border-slate-800 rounded-lg px-4 py-1.5 shadow-lg flex flex-col items-center backdrop-blur-sm">
              <span className="text-[10px] tracking-widest text-slate-400 font-bold uppercase">ENDLESS DISTANCE</span>
              <span className="font-racing text-xl sm:text-2xl font-black text-slate-100 tabular-nums">
                {(state.distanceMeters / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">KM</span>
              </span>
            </div>
          )}

          {/* OVERHEAD REAR PROXIMITY RADAR / REARVIEW VISOR */}
          <div className="mt-1.5 w-full bg-slate-950/92 border border-slate-800/90 rounded-xl p-2 shadow-2xl backdrop-blur-md">
            {/* Radar Header */}
            <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-1.5 text-[10px] font-racing font-bold tracking-wider text-slate-300">
                <span
                  className={`w-2 h-2 rounded-full ${
                    criticalThreat
                      ? 'bg-red-500 animate-ping'
                      : rearThreats.length > 0
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-emerald-400'
                  }`}
                />
                <span className="flex items-center gap-1 uppercase">
                  <RadarIcon className="w-3 h-3 text-cyan-400" />
                  REAR RADAR
                </span>
              </div>

              {/* View Switcher & Status Badge */}
              <div className="flex items-center gap-1.5">
                <div className="pointer-events-auto flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
                  <button
                    onClick={() => setRadarViewMode('scope')}
                    className={`px-1.5 py-0.5 text-[9px] font-racing font-bold rounded transition ${
                      radarViewMode === 'scope'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="180° Rear Arc Radar Scope"
                  >
                    ARC
                  </button>
                  <button
                    onClick={() => setRadarViewMode('lanes')}
                    className={`px-1.5 py-0.5 text-[9px] font-racing font-bold rounded transition ${
                      radarViewMode === 'lanes'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Highway Lanes Overview"
                  >
                    LANES
                  </button>
                </div>

                {criticalThreat ? (
                  <span className="px-2 py-0.5 rounded bg-red-600/90 border border-red-500 text-white font-racing font-black text-[9px] tracking-wider animate-pulse flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-300" />
                    HAZARD
                  </span>
                ) : rearThreats.length > 0 ? (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-racing font-bold text-[9px] tracking-wider">
                    {rearThreats.length} VEHICLES
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-racing font-semibold text-[9px] tracking-wider">
                    CLEAR
                  </span>
                )}
              </div>
            </div>

            {/* RADAR VIEW 1: 180° REAR TACTICAL RADAR SCOPE (ARC) */}
            {radarViewMode === 'scope' && (
              <div className="relative w-full h-[90px] bg-slate-900/60 rounded-lg overflow-hidden border border-slate-800/80 flex items-center justify-center">
                <svg viewBox="0 0 320 115" className="w-full h-full select-none">
                  {/* Subtle Radar Background Grid Rays */}
                  <line x1="160" y1="14" x2="160" y2="108" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="160" y1="14" x2="88" y2="92" stroke="#1e293b" strokeWidth="1" />
                  <line x1="160" y1="14" x2="232" y2="92" stroke="#1e293b" strokeWidth="1" />

                  {/* Concentric Distance Rings (15m Hazard, 30m Caution, 50m Range) */}
                  {/* 15m Critical Hazard Ring */}
                  <path
                    d="M 132 14 A 28 28 0 0 0 188 14"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    opacity="0.6"
                  />
                  {/* 30m Caution Ring */}
                  <path
                    d="M 104 14 A 56 56 0 0 0 216 14"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.5"
                  />
                  {/* 50m Max Range Perimeter */}
                  <path
                    d="M 72 14 A 88 88 0 0 0 248 14"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.2"
                    opacity="0.35"
                  />

                  {/* Radar Distance Labels */}
                  <text x="160" y="40" fill="#ef4444" fontSize="7" fontWeight="bold" textAnchor="middle" opacity="0.8">
                    15m
                  </text>
                  <text x="160" y="68" fill="#f59e0b" fontSize="7" fontWeight="bold" textAnchor="middle" opacity="0.7">
                    30m
                  </text>
                  <text x="160" y="100" fill="#38bdf8" fontSize="7" fontWeight="bold" textAnchor="middle" opacity="0.6">
                    50m
                  </text>

                  {/* Player Car Marker at Apex (Facing Forward / Top) */}
                  <g transform="translate(160, 14)">
                    <circle r="6" fill="#0284c7" opacity="0.4" />
                    <circle r="3.5" fill="#38bdf8" />
                    {/* Small Player Vehicle Glyph */}
                    <polygon points="0,-4 3,3 -3,3" fill="#ffffff" />
                  </g>

                  {/* Render All Rear Threat Blips as Directional Markers */}
                  {rearThreats.map((threat) => {
                    const distRatio = Math.min(1, Math.max(0.12, threat.distanceMeters / 52));
                    const r = distRatio * 88;
                    // Clamp lateral angle between -55 deg and +55 deg
                    const angleRad = Math.atan2(threat.lateralOffset * 0.9, threat.distanceMeters);
                    const px = 160 + r * Math.sin(angleRad);
                    const py = 14 + r * Math.cos(angleRad);

                    const isCrit = threat.isCritical;
                    const isAppr = threat.isApproaching;

                    const blipColor = isCrit ? '#ef4444' : isAppr ? '#f59e0b' : '#38bdf8';

                    return (
                      <g key={threat.id} transform={`translate(${px}, ${py})`}>
                        {/* Critical Sonar Ping Ripple */}
                        {isCrit && (
                          <circle r="9" fill="#ef4444" opacity="0.4" className="animate-ping" />
                        )}

                        {/* Directional UI Marker / Arrow pointing forward toward player */}
                        <polygon
                          points="0,-5 4,4 0,2 -4,4"
                          fill={blipColor}
                          stroke="#0f172a"
                          strokeWidth="0.8"
                        />

                        {/* Vehicle Glyph / Distance Tag */}
                        <text
                          x="0"
                          y={py > 95 ? -7 : 11}
                          fill={blipColor}
                          fontSize="7"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                          textAnchor="middle"
                        >
                          {threat.distanceMeters}m
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Tactical Legend Overlay */}
                <div className="absolute bottom-1 left-2 text-[8px] font-racing text-slate-500 font-bold tracking-wider">
                  FOV 180° REAR
                </div>
                <div className="absolute bottom-1 right-2 text-[8px] font-racing text-cyan-400 font-bold tracking-wider">
                  ▲ YOUR CAR
                </div>
              </div>
            )}

            {/* RADAR VIEW 2: 4 HIGHWAY LANES REAR PROXIMITY GRID */}
            {radarViewMode === 'lanes' && (
              <div className="grid grid-cols-4 gap-1">
                {lanes.map((lane) => {
                  const threat = rearThreats.find((t) => t.laneIndex === lane.index);
                  const isCrit = threat?.isCritical;
                  const isAppr = threat?.isApproaching;

                  return (
                    <div
                      key={lane.index}
                      className={`rounded-lg px-1.5 py-1 flex flex-col items-center justify-center transition-all duration-150 border min-h-[46px] ${
                        isCrit
                          ? 'bg-red-950/90 border-red-500 shadow-lg shadow-red-500/30 animate-pulse'
                          : threat
                          ? isAppr
                            ? 'bg-amber-950/70 border-amber-500/80 shadow-md shadow-amber-500/20'
                            : 'bg-slate-900/80 border-slate-700 text-slate-300'
                          : 'bg-slate-900/40 border-slate-800/60 text-slate-600'
                      }`}
                    >
                      <span className="text-[9px] font-racing font-semibold text-slate-400 tracking-wider">
                        {lane.label}
                      </span>

                      {threat ? (
                        <div className="flex flex-col items-center leading-none mt-0.5">
                          <div className="flex items-center gap-0.5">
                            <span className="text-xs">
                              {vehicleIcons[threat.vehicleType] || '🚗'}
                            </span>
                            <span
                              className={`font-racing font-black text-xs tabular-nums ${
                                isCrit
                                  ? 'text-red-300 animate-bounce'
                                  : isAppr
                                  ? 'text-amber-300'
                                  : 'text-slate-300'
                              }`}
                            >
                              {threat.distanceMeters}m
                            </span>
                          </div>
                          <span
                            className={`text-[8px] font-bold font-racing mt-0.5 tabular-nums ${
                              threat.relativeSpeedKmh > 0
                                ? 'text-red-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {threat.relativeSpeedKmh > 0 ? `+${threat.relativeSpeedKmh}` : threat.relativeSpeedKmh}km/h
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono mt-1">··</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* DIRECTIONAL PROXIMITY INDICATOR SYSTEM (↙ REAR-LEFT, ⬇ REAR-CENTER, ↘ REAR-RIGHT) */}
            <div className="grid grid-cols-3 gap-1 mt-1.5 pt-1.5 border-t border-slate-800/80">
              {/* 1. REAR-LEFT DIRECTIONAL INDICATOR */}
              <div
                className={`rounded-lg px-2 py-1 flex items-center justify-between border transition-all ${
                  primaryLeftThreat?.isCritical
                    ? 'bg-red-950/90 border-red-500 text-red-100 shadow-md shadow-red-500/30 animate-pulse'
                    : primaryLeftThreat?.isApproaching
                    ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                    : primaryLeftThreat
                    ? 'bg-slate-900/80 border-slate-700 text-slate-300'
                    : 'bg-slate-900/40 border-slate-800/50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <ArrowDownLeft
                    className={`w-4 h-4 transition-transform ${
                      primaryLeftThreat?.isCritical
                        ? 'text-red-400 animate-bounce'
                        : primaryLeftThreat?.isApproaching
                        ? 'text-amber-400 animate-pulse'
                        : primaryLeftThreat
                        ? 'text-cyan-400'
                        : 'text-slate-600'
                    }`}
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[8px] font-racing font-bold tracking-wider uppercase">
                      REAR-L
                    </span>
                    {primaryLeftThreat ? (
                      <span className="font-racing font-black text-[11px] tabular-nums">
                        {primaryLeftThreat.distanceMeters}m
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-600 font-mono">--</span>
                    )}
                  </div>
                </div>

                {primaryLeftThreat && (
                  <span
                    className={`text-[8px] font-racing font-bold px-1 rounded tabular-nums ${
                      primaryLeftThreat.relativeSpeedKmh > 0
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {primaryLeftThreat.relativeSpeedKmh > 0 ? `+${primaryLeftThreat.relativeSpeedKmh}` : primaryLeftThreat.relativeSpeedKmh}k
                  </span>
                )}
              </div>

              {/* 2. REAR-CENTER DIRECTIONAL INDICATOR (TAILGATER) */}
              <div
                className={`rounded-lg px-2 py-1 flex items-center justify-between border transition-all ${
                  primaryCenterThreat?.isCritical
                    ? 'bg-red-950/90 border-red-500 text-red-100 shadow-md shadow-red-500/30 animate-pulse'
                    : primaryCenterThreat?.isApproaching
                    ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                    : primaryCenterThreat
                    ? 'bg-slate-900/80 border-slate-700 text-slate-300'
                    : 'bg-slate-900/40 border-slate-800/50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <ArrowDown
                    className={`w-4 h-4 transition-transform ${
                      primaryCenterThreat?.isCritical
                        ? 'text-red-400 animate-bounce'
                        : primaryCenterThreat?.isApproaching
                        ? 'text-amber-400 animate-pulse'
                        : primaryCenterThreat
                        ? 'text-cyan-400'
                        : 'text-slate-600'
                    }`}
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[8px] font-racing font-bold tracking-wider uppercase">
                      BEHIND
                    </span>
                    {primaryCenterThreat ? (
                      <span className="font-racing font-black text-[11px] tabular-nums">
                        {primaryCenterThreat.distanceMeters}m
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-600 font-mono">--</span>
                    )}
                  </div>
                </div>

                {primaryCenterThreat && (
                  <span
                    className={`text-[8px] font-racing font-bold px-1 rounded tabular-nums ${
                      primaryCenterThreat.relativeSpeedKmh > 0
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {primaryCenterThreat.relativeSpeedKmh > 0 ? `+${primaryCenterThreat.relativeSpeedKmh}` : primaryCenterThreat.relativeSpeedKmh}k
                  </span>
                )}
              </div>

              {/* 3. REAR-RIGHT DIRECTIONAL INDICATOR */}
              <div
                className={`rounded-lg px-2 py-1 flex items-center justify-between border transition-all ${
                  primaryRightThreat?.isCritical
                    ? 'bg-red-950/90 border-red-500 text-red-100 shadow-md shadow-red-500/30 animate-pulse'
                    : primaryRightThreat?.isApproaching
                    ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                    : primaryRightThreat
                    ? 'bg-slate-900/80 border-slate-700 text-slate-300'
                    : 'bg-slate-900/40 border-slate-800/50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <ArrowDownRight
                    className={`w-4 h-4 transition-transform ${
                      primaryRightThreat?.isCritical
                        ? 'text-red-400 animate-bounce'
                        : primaryRightThreat?.isApproaching
                        ? 'text-amber-400 animate-pulse'
                        : primaryRightThreat
                        ? 'text-cyan-400'
                        : 'text-slate-600'
                    }`}
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[8px] font-racing font-bold tracking-wider uppercase">
                      REAR-R
                    </span>
                    {primaryRightThreat ? (
                      <span className="font-racing font-black text-[11px] tabular-nums">
                        {primaryRightThreat.distanceMeters}m
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-600 font-mono">--</span>
                    )}
                  </div>
                </div>

                {primaryRightThreat && (
                  <span
                    className={`text-[8px] font-racing font-bold px-1 rounded tabular-nums ${
                      primaryRightThreat.relativeSpeedKmh > 0
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {primaryRightThreat.relativeSpeedKmh > 0 ? `+${primaryRightThreat.relativeSpeedKmh}` : primaryRightThreat.relativeSpeedKmh}k
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CRITICAL OVERHEAD COLLISION WARNING BANNER */}
          {criticalThreat && (
            <div className="mt-1.5 w-full bg-gradient-to-r from-red-650 via-red-600 to-red-650 bg-red-950/95 border-2 border-red-500 px-3 py-1 rounded-lg text-white font-racing font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-500/40 animate-bounce">
              <AlertTriangle className="w-4 h-4 text-yellow-300 animate-spin" />
              <span>
                REAR HAZARD: {criticalThreat.vehicleType.toUpperCase()} {criticalThreat.lane.toUpperCase()} ({criticalThreat.distanceMeters}m | {criticalThreat.relativeSpeedKmh > 0 ? `+${criticalThreat.relativeSpeedKmh}` : criticalThreat.relativeSpeedKmh} KM/H)
              </span>
            </div>
          )}

          {/* Invulnerability Shield Active */}
          {state.isInvulnerable && (
            <div className="mt-1.5 animate-pulse bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 px-3 py-1 rounded-full text-xs font-racing font-bold tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
              <Shield className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              RESPAWN SHIELD ACTIVE
            </div>
          )}

          {/* Drafting / Slipstream Active Alert */}
          {state.isDrafting && (
            <div className="mt-1.5 animate-bounce bg-cyan-950/90 border border-cyan-500/80 text-cyan-300 px-3 py-1 rounded-full text-xs font-racing font-bold tracking-wider flex items-center gap-1.5 shadow-lg shadow-cyan-500/20">
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              SLIPSTREAM DRAFTING (+SPEED BOOST)
            </div>
          )}

          {/* Rival Ahead Indicator */}
          {state.rivalActive && state.rivalAheadDist !== null && state.rivalAheadDist > 0 && (
            <div className="mt-1 bg-red-950/90 border border-red-500/80 text-red-300 px-3 py-0.5 rounded text-[11px] font-racing font-semibold tracking-wider">
              ⚠️ RIVAL AHEAD: {Math.floor(state.rivalAheadDist)}m
            </div>
          )}

          {/* Near-Miss / Event Toast Alert */}
          {popupMessage && (
            <div
              className={`mt-2 font-racing font-black text-sm sm:text-base px-4 py-1.5 rounded-lg border shadow-xl animate-pulse tracking-wider ${
                popupMessage.type === 'radio'
                  ? 'bg-slate-950/95 border-cyan-500 text-cyan-300 shadow-cyan-500/20'
                  : popupMessage.type === 'rival'
                  ? 'bg-amber-950/90 border-amber-500 text-amber-300'
                  : 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
              }`}
            >
              {popupMessage.text}
            </div>
          )}
        </div>

        {/* Right Action Icons: Radio, Photo Mode, Camera, Mute, Pause */}
        <div className="flex items-center gap-2 pointer-events-auto shrink-0">
          {/* Dynamic Radio Quick Button */}
          {(() => {
            const currentStation = RADIO_STATIONS.find((s) => s.id === radioStation) || RADIO_STATIONS[0];
            const isRadioActive = !isRadioMuted && radioStation !== 'off' && !isMuted;
            return (
              <button
                onClick={onCycleRadio}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onToggleRadioMute();
                }}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center transition active:scale-95 shadow-lg relative group ${
                  isRadioActive
                    ? 'bg-slate-950/80 hover:bg-slate-900 text-cyan-300'
                    : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-500'
                }`}
                style={{ borderColor: isRadioActive ? currentStation.accentColor : undefined }}
                title={`Radio: ${currentStation.name} (${currentStation.frequency}) • Press R to Cycle, Right-click to Mute`}
              >
                <Radio
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${isRadioActive ? 'animate-pulse' : 'opacity-60'}`}
                  style={{ color: isRadioActive ? currentStation.accentColor : undefined }}
                />
                {isRadioActive && (
                  <span
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: currentStation.accentColor }}
                  />
                )}
                {!isRadioActive && (
                  <span className="absolute bottom-1 right-1 text-[9px] font-bold text-red-400">✕</span>
                )}
              </button>
            );
          })()}

          <button
            onClick={onEnterPhotoMode}
            className="w-10 h-10 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 flex items-center justify-center transition active:scale-95 shadow-lg group"
            title="Photo Mode (P)"
          >
            <Camera className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={onCycleCamera}
            className="w-10 h-10 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center transition active:scale-95 shadow-lg"
            title="Switch Camera View (C)"
          >
            <span className="font-racing font-black text-xs">POV</span>
          </button>
          <button
            onClick={onToggleMute}
            className="w-10 h-10 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center transition active:scale-95 shadow-lg"
            title="Master Audio Mute / Unmute"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
          <button
            onClick={onPause}
            className="w-10 h-10 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center transition active:scale-95 shadow-lg"
            title="Pause Game (Esc)"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Flank Blind Spot Directional Warning Indicators (Left & Right) */}
      {leftBlindSpotThreat && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-950/95 border-2 border-red-500 text-red-200 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 shadow-2xl animate-pulse font-racing font-bold text-xs pointer-events-none backdrop-blur-md">
          <div className="flex items-center text-red-400 text-lg font-black tracking-tighter animate-bounce">
            <span>◀</span>
            <span className="-ml-1">◀</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-red-400 font-extrabold tracking-wider uppercase">BLIND SPOT (LEFT)</span>
              <span className="text-[10px]">{vehicleIcons[leftBlindSpotThreat.vehicleType] || '🚗'}</span>
            </div>
            <span className="text-amber-300 font-black text-xs tabular-nums">
              {leftBlindSpotThreat.distanceMeters}m ({leftBlindSpotThreat.relativeSpeedKmh > 0 ? `+${leftBlindSpotThreat.relativeSpeedKmh}` : leftBlindSpotThreat.relativeSpeedKmh} km/h)
            </span>
          </div>
        </div>
      )}

      {rightBlindSpotThreat && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-950/95 border-2 border-red-500 text-red-200 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 shadow-2xl animate-pulse font-racing font-bold text-xs pointer-events-none backdrop-blur-md">
          <div className="flex flex-col text-right">
            <div className="flex items-center justify-end gap-1">
              <span className="text-[10px]">{vehicleIcons[rightBlindSpotThreat.vehicleType] || '🚗'}</span>
              <span className="text-[9px] text-red-400 font-extrabold tracking-wider uppercase">BLIND SPOT (RIGHT)</span>
            </div>
            <span className="text-amber-300 font-black text-xs tabular-nums">
              {rightBlindSpotThreat.distanceMeters}m ({rightBlindSpotThreat.relativeSpeedKmh > 0 ? `+${rightBlindSpotThreat.relativeSpeedKmh}` : rightBlindSpotThreat.relativeSpeedKmh} km/h)
            </span>
          </div>
          <div className="flex items-center text-red-400 text-lg font-black tracking-tighter animate-bounce">
            <span className="-mr-1">▶</span>
            <span>▶</span>
          </div>
        </div>
      )}

      {/* Bottom Center / Right Telemetry Cluster: Speedometer, Gear, RPM, Nitro */}
      <div className="flex items-end justify-between w-full">
        {/* Left Bottom: Drifting & Combo Indicator */}
        <div className="flex flex-col gap-1">
          {state.isDrifting && (
            <div className="bg-amber-600/90 text-white font-racing font-black px-3 py-1 rounded text-xs tracking-widest shadow-lg flex items-center gap-1.5 animate-pulse">
              <Flame className="w-4 h-4 text-yellow-300" />
              DRIFTING
            </div>
          )}

          {state.nearMissCombo > 1 && (
            <div className="bg-emerald-600/90 text-white font-racing font-black px-3 py-1 rounded text-xs tracking-widest shadow-lg">
              COMBO x{state.nearMissCombo}!
            </div>
          )}
        </div>

        {/* Right Bottom: High-Tech Racing Cluster */}
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col gap-2 min-w-[210px] sm:min-w-[240px]">
          {/* Speed & Gear */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="font-racing text-4xl sm:text-5xl font-black text-slate-100 tabular-nums tracking-tighter">
                {state.speedKmh}
              </span>
              <span className="font-racing text-xs sm:text-sm text-slate-400 font-bold">KM/H</span>
            </div>
            {/* Gear Box */}
            <div className="flex flex-col items-center bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">GEAR</span>
              <span className="font-racing text-xl font-black text-amber-400">{state.gear}</span>
            </div>
          </div>

          {/* Tachometer RPM Bar */}
          <div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>RPM x1000</span>
              <span className={isRedline ? 'text-red-400 font-black animate-pulse' : 'text-slate-300'}>
                {(state.rpm / 1000).toFixed(1)}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex gap-0.5">
              <div
                className={`h-full transition-all duration-75 rounded-full ${
                  isRedline ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-amber-400'
                }`}
                style={{ width: `${rpmPercent}%` }}
              />
            </div>
          </div>

          {/* Nitro Boost Gauge */}
          <div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-cyan-400">
                <Zap className="w-3 h-3" /> NITRO BOOST
              </span>
              <span className="text-cyan-300 tabular-nums">{state.nitroGauge}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  state.isNitroActive
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-md shadow-cyan-400/50 animate-pulse'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${state.nitroGauge}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
