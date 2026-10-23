import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import {
  Award,
  ChevronRight,
  Clock,
  Flame,
  Gauge,
  Home,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { CarConfig, LevelCompleteSummary } from '../types.ts';
import { CarFactory, CarModelInstance } from '../game/CarFactory.ts';
import { soundManager } from '../audio/SoundEngine.ts';

interface LevelCompleteModalProps {
  summary: LevelCompleteSummary;
  carConfig: CarConfig;
  carColor: string;
  onNextLevel: () => void;
  onRetry: () => void;
  onQuitToMenu: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  summary,
  carConfig,
  carColor,
  onNextLevel,
  onRetry,
  onQuitToMenu,
}) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [starsRevealed, setStarsRevealed] = useState(0);

  // 3D Car Showcase Mount Ref
  const carMountRef = useRef<HTMLDivElement>(null);
  const carInstanceRef = useRef<CarModelInstance | null>(null);
  const turntableGroupRef = useRef<THREE.Group | null>(null);

  // Trigger celebration confetti & star animations on mount
  useEffect(() => {
    // Stage 1: Central victory explosion
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.55 },
      colors: ['#f59e0b', '#eab308', '#06b6d4', '#10b981', '#ffffff'],
      disableForReducedMotion: true,
    });

    // Stage 2: Dual side confetti cannons
    const timer1 = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0.1, y: 0.65 },
        colors: ['#f59e0b', '#38bdf8', '#fbbf24'],
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 0.9, y: 0.65 },
        colors: ['#f59e0b', '#38bdf8', '#fbbf24'],
        disableForReducedMotion: true,
      });
    }, 380);

    // Sequential Stars Pop Animation
    const starTimer1 = setTimeout(() => {
      setStarsRevealed(1);
      soundManager.playCoin();
    }, 450);
    const starTimer2 = setTimeout(() => {
      if (summary.stars >= 2) {
        setStarsRevealed(2);
        soundManager.playCoin();
      }
    }, 750);
    const starTimer3 = setTimeout(() => {
      if (summary.stars >= 3) {
        setStarsRevealed(3);
        soundManager.playCoin();
      }
    }, 1050);

    return () => {
      clearTimeout(timer1);
      clearTimeout(starTimer1);
      clearTimeout(starTimer2);
      clearTimeout(starTimer3);
    };
  }, [summary.stars]);

  // Mount 3D Turntable Car Preview of the exact player car
  useEffect(() => {
    if (!carMountRef.current) return;
    const mount = carMountRef.current;
    const width = mount.clientWidth || 380;
    const height = mount.clientHeight || 170;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / Math.max(height, 1), 0.1, 100);
    camera.position.set(0, 1.8, 5.2);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    // Studio lighting rig
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.4);
    keyLight.position.set(4, 7, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-5, 5, -4);
    scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    // Turntable Group
    const turntable = new THREE.Group();
    scene.add(turntable);
    turntableGroupRef.current = turntable;

    // Showroom Podium Floor
    const floorGeo = new THREE.CylinderGeometry(2.5, 2.6, 0.12, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.25,
      metalness: 0.85,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.06;
    turntable.add(floor);

    // Glowing Neon Ring on Podium
    const ringGeo = new THREE.TorusGeometry(2.52, 0.025, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    turntable.add(ring);

    // Build the Exact Player Car with active paint color
    const colorHex = parseInt(carColor.replace('#', '0x'), 16) || 0xdc2626;
    const carInstance = CarFactory.createPlayerCar(carConfig.id, colorHex);
    carInstance.group.position.set(0, 0, 0);
    turntable.add(carInstance.group);
    carInstanceRef.current = carInstance;

    // Render loop with smooth auto-rotation
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      turntable.rotation.y += 0.008;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / Math.max(nh, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [carConfig.id, carColor]);

  // Safe Action Button Handlers (prevents double triggers)
  const handleSafeNext = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    soundManager.playCoin();
    onNextLevel();
  };

  const handleSafeRetry = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    soundManager.playCoin();
    onRetry();
  };

  const handleSafeMenu = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    onQuitToMenu();
  };

  const finishPos = summary.finishPosition || 1;
  const overtakesCount = summary.overtakes !== undefined ? summary.overtakes : summary.nearMisses;
  const timeDisplay =
    summary.formattedTime ||
    `${Math.floor(summary.timeSeconds / 60)}:${(summary.timeSeconds % 60).toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300 select-none overflow-y-auto">
      {/* Background Animated Racing Streaks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        {/* Subtle Checkered Ribbon pattern at top */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-lg shadow-amber-500/40" />
      </div>

      {/* Main Finish Slide Card */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900/98 via-slate-950/98 to-slate-950 border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-amber-500/20 text-center overflow-hidden my-auto backdrop-blur-2xl">
        {/* Top Victory Beacon Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-28 bg-gradient-to-b from-amber-400/20 to-transparent blur-2xl pointer-events-none" />

        {/* 1. REQUIRED HEADER: FINISH! / LEVEL COMPLETE */}
        <div className="relative z-10 flex flex-col items-center mb-3">
          {/* Top Stage Tracker Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-racing font-bold tracking-widest uppercase mb-1 shadow-sm">
            <span>🏁</span>
            <span>STAGE {summary.levelId} OF 10 COMPLETED</span>
          </div>

          {/* Bold Championship Heading: FINISH! */}
          <h1 className="font-racing text-5xl sm:text-6xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 drop-shadow-[0_4px_16px_rgba(245,158,11,0.5)] leading-none mt-1">
            FINISH!
          </h1>

          {/* Subheading: LEVEL COMPLETE */}
          <h2 className="font-racing text-lg sm:text-xl font-extrabold tracking-[0.2em] text-slate-200 uppercase mt-1">
            LEVEL COMPLETE
          </h2>

          <p className="text-amber-400/90 text-xs sm:text-sm font-racing font-semibold tracking-wider mt-0.5">
            {summary.levelName} • {(summary.distance / 1000).toFixed(2)} KM CIRCUIT
          </p>
        </div>

        {/* 2. PLAYER'S CAR 3D SHOWCASE PODIUM (Interactive Turntable Preview) */}
        <div className="relative w-full h-36 sm:h-44 bg-gradient-to-b from-slate-950/70 to-slate-900/80 rounded-2xl border border-slate-800/80 overflow-hidden mb-4 shadow-inner flex items-center justify-center">
          <div ref={carMountRef} className="w-full h-full pointer-events-none" />

          {/* Car Name & Manufacturer Badge Overlay */}
          <div className="absolute bottom-2 left-3 flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 rounded-lg px-2.5 py-1 backdrop-blur-sm">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: carColor }}
            />
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[9px] font-racing font-bold text-slate-400 uppercase">
                {carConfig.manufacturer}
              </span>
              <span className="text-xs font-racing font-black text-slate-100">
                {carConfig.name}
              </span>
            </div>
          </div>

          {/* Finishing Position Ribbon */}
          <div className="absolute top-2.5 right-3 flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-racing font-black text-xs sm:text-sm px-3 py-1 rounded-lg shadow-lg shadow-amber-500/30">
            <Trophy className="w-4 h-4 text-slate-950 fill-current" />
            <span>{finishPos === 1 ? '1st PLACE' : `${finishPos}th PLACE`}</span>
          </div>
        </div>

        {/* 3. STAR RATING CELEBRATION (Sequenced pop animations) */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4">
          {[1, 2, 3].map((starIdx) => {
            const isEarned = starIdx <= starsRevealed;
            return (
              <div
                key={starIdx}
                className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border transition-all duration-300 ${
                  isEarned
                    ? 'bg-gradient-to-b from-amber-500/30 to-amber-500/10 border-amber-400 text-amber-300 scale-110 shadow-lg shadow-amber-500/30 rotate-3'
                    : 'bg-slate-900/60 border-slate-800 text-slate-700 scale-95'
                }`}
              >
                <span className="text-2xl sm:text-3xl drop-shadow">★</span>
              </div>
            );
          })}
        </div>

        {/* 4. PERFORMANCE STATISTICS TELEMETRY GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-4 text-left">
          {/* Finish Time */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-racing font-bold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> TIME
            </span>
            <div className="font-racing text-lg sm:text-xl font-black text-cyan-300 tabular-nums mt-1">
              {timeDisplay}
            </div>
            <span className="text-[9px] font-racing text-slate-500 mt-0.5">BENCHMARK CLEARED</span>
          </div>

          {/* Top Speed */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-racing font-bold text-slate-400 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-emerald-400" /> TOP SPEED
            </span>
            <div className="font-racing text-lg sm:text-xl font-black text-emerald-400 tabular-nums mt-1">
              {summary.topSpeed} <span className="text-xs font-normal text-slate-400">KM/H</span>
            </div>
            <span className="text-[9px] font-racing text-slate-500 mt-0.5">RADAR VERIFIED</span>
          </div>

          {/* Overtakes / Close Calls */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-racing font-bold text-slate-400 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" /> OVERTAKES
            </span>
            <div className="font-racing text-lg sm:text-xl font-black text-amber-400 tabular-nums mt-1">
              {overtakesCount}
            </div>
            <span className="text-[9px] font-racing text-slate-500 mt-0.5">CLEAN PASSES</span>
          </div>

          {/* Race Score */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-racing font-bold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-300" /> TOTAL SCORE
            </span>
            <div className="font-racing text-lg sm:text-xl font-black text-yellow-300 tabular-nums mt-1">
              {summary.score.toLocaleString()}
            </div>
            <span className="text-[9px] font-racing text-slate-500 mt-0.5">BONUS INCLUDED</span>
          </div>
        </div>

        {/* 5. COIN REWARD BANNER */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border border-amber-500/40 mb-5 shadow-lg shadow-amber-500/10">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl animate-bounce">🪙</span>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-xs sm:text-sm font-racing font-black text-amber-200 uppercase tracking-wide">
                RACE REWARD UNLOCKED
              </span>
              <span className="text-[10px] text-amber-300/80">CREDITED TO DRIVER WALLET</span>
            </div>
          </div>
          <span className="font-racing text-xl sm:text-2xl font-black text-amber-400 tabular-nums">
            +{summary.coinsEarned.toLocaleString()}
          </span>
        </div>

        {/* 6. THREE WORKING ACTION BUTTONS (NEXT LEVEL, RETRY, MAIN MENU) */}
        <div className="flex flex-col gap-2.5">
          {/* PRIMARY: NEXT LEVEL BUTTON */}
          <button
            onClick={handleSafeNext}
            disabled={isNavigating}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-racing font-black text-base sm:text-lg uppercase tracking-wider shadow-xl shadow-emerald-500/30 transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {summary.levelId < 10 ? (
              <>
                <span>NEXT LEVEL {summary.levelId + 1}</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              <>
                <span>🏆 CHAMPIONSHIP COMPLETE — REPLAY CIRCUIT</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* SECONDARY ROW: RETRY AND MAIN MENU */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* RETRY BUTTON */}
            <button
              onClick={handleSafeRetry}
              disabled={isNavigating}
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 font-racing font-bold text-xs sm:text-sm uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>RETRY</span>
            </button>

            {/* MAIN MENU BUTTON */}
            <button
              onClick={handleSafeMenu}
              disabled={isNavigating}
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white font-racing font-bold text-xs sm:text-sm uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Home className="w-4 h-4 text-cyan-400" />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
