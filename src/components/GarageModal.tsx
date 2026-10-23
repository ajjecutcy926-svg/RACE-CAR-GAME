import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Gauge, Lock, Play, ShieldAlert, Sparkles, X, Zap } from 'lucide-react';
import { CarConfig } from '../types.ts';
import { CARS_CATALOG } from '../game/Storage.ts';
import { CarFactory, CarModelInstance } from '../game/CarFactory.ts';

interface GarageModalProps {
  currentCarId: string;
  currentColor: string;
  unlockedCars: string[];
  coins: number;
  onSelectCar: (car: CarConfig, color: string, shouldDrive?: boolean) => void;
  onUnlockCar: (car: CarConfig) => boolean;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  currentCarId,
  currentColor,
  unlockedCars,
  coins,
  onSelectCar,
  onUnlockCar,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = CARS_CATALOG.findIndex((c) => c.id === currentCarId);
    return idx >= 0 ? idx : 0;
  });

  const car = CARS_CATALOG[currentIndex];
  const isUnlocked = unlockedCars.includes(car.id);
  const isSelected = car.id === currentCarId;

  // Standard requested colors: black, white, red, silver, racing green + specialty
  const STANDARD_PAINTS = [
    { label: 'Onyx Black', hex: '#111111' },
    { label: 'Alpine White', hex: '#f8fafc' },
    { label: 'Rosso Red', hex: '#dc2626' },
    { label: 'Liquid Silver', hex: '#94a3b8' },
    { label: 'Racing Green', hex: '#064e3b' },
  ];

  const [selectedColor, setSelectedColor] = useState(currentColor || '#dc2626');

  // 3D Preview Turntable Canvas Ref
  const previewMountRef = useRef<HTMLDivElement>(null);
  const carInstanceRef = useRef<CarModelInstance | null>(null);
  const turntableGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const prevMouseXRef = useRef(0);

  // Initialize and update 3D rotating preview
  useEffect(() => {
    if (!previewMountRef.current) return;
    const mount = previewMountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / Math.max(height, 1), 0.1, 100);
    camera.position.set(0, 2.2, 5.8);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    // Studio Lights for showroom reflection
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    rimLight.position.set(-5, 6, -5);
    scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // Circular Showroom Turntable Floor
    const floorGeo = new THREE.CylinderGeometry(2.8, 2.9, 0.15, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.2,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.075;
    scene.add(floor);

    // Neon Turntable Halo Ring
    const haloGeo = new THREE.TorusGeometry(2.82, 0.03, 16, 64);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.01;
    scene.add(halo);

    // Turntable Pivot Group
    const turntable = new THREE.Group();
    scene.add(turntable);
    turntableGroupRef.current = turntable;

    // Build selected car
    const colorInt = parseInt(selectedColor.replace('#', '0x'), 16);
    const carModel = CarFactory.createPlayerCar(car.id, colorInt);
    turntable.add(carModel.group);
    carInstanceRef.current = carModel;

    // Animation Loop
    let animationFrameId = 0;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (turntable && !isDraggingRef.current) {
        turntable.rotation.y += 0.008; // Continuous smooth rotation
      }
      renderer.render(scene, camera);
    };
    animate();

    // Mouse / Touch Drag Interaction to manually spin car
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseXRef.current = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && turntable) {
        const deltaX = e.clientX - prevMouseXRef.current;
        turntable.rotation.y += deltaX * 0.015;
        prevMouseXRef.current = e.clientX;
      }
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMouseXRef.current = e.touches[0].clientX;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && turntable && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - prevMouseXRef.current;
        turntable.rotation.y += deltaX * 0.015;
        prevMouseXRef.current = e.touches[0].clientX;
      }
    };
    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    mount.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      cancelAnimationFrame(animationFrameId);
      mount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      mount.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      renderer.dispose();
      mount.innerHTML = '';
    };
  }, [car.id, selectedColor]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % CARS_CATALOG.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + CARS_CATALOG.length) % CARS_CATALOG.length);
  };

  const handleSelect = (shouldDrive = false) => {
    if (isUnlocked) {
      onSelectCar(car, selectedColor, shouldDrive);
    } else {
      const success = onUnlockCar(car);
      if (success) {
        onSelectCar(car, selectedColor, shouldDrive);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/90 flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 text-xs font-racing font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> BACK
            </button>
            <div>
              <h2 className="font-racing text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
                SUPERCAR GARAGE
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3.5 py-1.5 rounded-full border border-slate-800 shadow-inner">
              <span className="text-base">🪙</span>
              <span className="font-racing text-yellow-300 font-black tabular-nums text-sm">
                {coins.toLocaleString()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D Rotating Showroom Viewport */}
        <div className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 overflow-hidden flex flex-col items-center">
          {/* Turntable 3D Canvas Mount */}
          <div
            ref={previewMountRef}
            className="w-full h-56 sm:h-64 cursor-grab active:cursor-grabbing"
            title="Drag to rotate 3D model"
          />

          {/* Left / Right Carousel Controls */}
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-100 flex items-center justify-center transition shadow-xl active:scale-90 cursor-pointer"
            title="Previous Supercar"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-100 flex items-center justify-center transition shadow-xl active:scale-90 cursor-pointer"
            title="Next Supercar"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Supercar Title Badge */}
          <div className="absolute top-3 left-6 pointer-events-none">
            <span className="text-[10px] font-racing font-bold tracking-widest text-cyan-400 uppercase">
              {car.manufacturer} · {car.category}
            </span>
            <h3 className="font-racing text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              {car.name}
            </h3>
          </div>

          {/* Drag instruction pill */}
          <div className="absolute bottom-2 right-4 text-[10px] text-slate-500 font-racing pointer-events-none hidden sm:block">
            ↻ DRAG TO ROTATE 360°
          </div>
        </div>

        {/* Paint Swatches & Stats Section */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Paint Swatch Palette: Black, White, Red, Silver, Racing Green */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-racing font-bold text-slate-300 uppercase tracking-wider">
                EXTERIOR FINISH:
              </span>
              <div className="flex items-center gap-1.5">
                {STANDARD_PAINTS.map((p) => (
                  <button
                    key={p.hex}
                    onClick={() => setSelectedColor(p.hex)}
                    title={p.label}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer shadow-md ${
                      selectedColor === p.hex
                        ? 'scale-125 border-cyan-400 ring-2 ring-cyan-500/50'
                        : 'border-slate-700 hover:scale-110'
                    }`}
                    style={{ backgroundColor: p.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Car Specs Badges */}
            <div className="flex items-center gap-3 text-xs font-racing text-slate-300">
              <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                ⚡ <strong className="text-amber-400">{car.specs.horsepower} HP</strong>
              </span>
              <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                ⏱️ 0-100: <strong className="text-cyan-400">{car.specs.zeroToHundred}</strong>
              </span>
              <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 hidden sm:inline-block">
                ⚖️ <strong className="text-slate-200">{car.specs.weightKg} KG</strong>
              </span>
            </div>
          </div>

          {/* Performance Statistics Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Top Speed */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Gauge className="w-3.5 h-3.5" /> TOP SPEED
                </span>
                <span className="font-racing font-black text-cyan-300">{car.topSpeed} KM/H</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  style={{ width: `${(car.topSpeed / 360) * 100}%` }}
                />
              </div>
            </div>

            {/* Acceleration */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1 text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" /> ACCELERATION
                </span>
                <span className="font-racing font-black text-amber-300">{car.acceleration} m/s²</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                  style={{ width: `${(car.acceleration / 20) * 100}%` }}
                />
              </div>
            </div>

            {/* Handling & Downforce */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldAlert className="w-3.5 h-3.5" /> HANDLING
                </span>
                <span className="font-racing font-black text-emerald-300">
                  {Math.round(car.handling * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  style={{ width: `${(car.handling / 1.5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Description Paragraph */}
          <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80">
            {car.description}
          </p>
        </div>

        {/* Footer Actions: Select, Drive, Unlock, Back */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-racing font-bold text-xs tracking-wider transition cursor-pointer"
            >
              BACK TO MENU
            </button>

            {isUnlocked ? (
              <span className="text-emerald-400 font-racing font-bold text-xs flex items-center gap-1 ml-2">
                <Check className="w-4 h-4" /> UNLOCKED IN FLEET
              </span>
            ) : (
              <span className="text-slate-300 font-racing text-xs flex items-center gap-1 ml-2">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> PRICE:{' '}
                <strong className="text-yellow-300 font-black ml-1">{car.price} 🪙</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked ? (
              <>
                <button
                  onClick={() => handleSelect(false)}
                  className={`px-5 py-2.5 rounded-xl font-racing font-black text-xs tracking-wider flex items-center gap-1.5 transition cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/60 text-emerald-300'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                >
                  <Check className="w-4 h-4" /> {isSelected ? 'SELECTED' : 'SELECT CAR'}
                </button>

                <button
                  onClick={() => handleSelect(true)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-racing font-black text-xs tracking-wider flex items-center gap-1.5 shadow-xl transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" /> DRIVE NOW
                </button>
              </>
            ) : (
              <button
                onClick={() => handleSelect(true)}
                disabled={coins < car.price}
                className={`px-6 py-3 rounded-xl font-racing font-black text-xs tracking-wider flex items-center gap-2 transition cursor-pointer ${
                  coins >= car.price
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                {coins >= car.price ? `UNLOCK & DRIVE (${car.price} 🪙)` : `NEED ${car.price - coins} MORE 🪙`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
