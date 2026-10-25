import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CarConfig, EngineDiagnostics, GameSettings, GameSummary, LevelCompleteSummary, LevelConfig, PlayerCarState } from '../types.ts';
import { soundManager } from '../audio/SoundEngine.ts';
import { CarFactory, CarModelInstance } from './CarFactory.ts';
import { EnvironmentManager } from './Environment.ts';
import { GAME_LEVELS, getLevelConfig } from './LevelConfig.ts';
import { ParticleSystem } from './ParticleSystem.ts';
import { TrafficManager } from './TrafficManager.ts';
import { WeatherManager } from './WeatherManager.ts';

// Pre-allocated math helpers to ensure ZERO GC during render ticks
const _vPos = new THREE.Vector3();
const _vLook = new THREE.Vector3();
const _vOffset = new THREE.Vector3();

export class GameEngine {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private pmremGenerator: THREE.PMREMGenerator | null = null;

  // Game systems
  private environment: EnvironmentManager;
  private trafficManager: TrafficManager;
  private weatherManager: WeatherManager;
  private particleSystem: ParticleSystem;

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Player Vehicle
  private playerCarModel: CarModelInstance | null = null;
  private currentCarConfig: CarConfig;
  private carColorHex: number;
  private playerPos = new THREE.Vector3(1.85, 0, 0); // Start in Lane 2
  private playerVelocity = new THREE.Vector3(0, 0, 0);
  private speedKmh = 0;
  private playerHeading = 0; // Y-rotation angle
  private driftAngle = 0;
  private rpm = 1000;
  private currentGear: number | 'R' | 'N' = 1;

  // Level & Progression State
  public currentLevelConfig: LevelConfig = GAME_LEVELS[0];
  private elapsedTimeSeconds = 0;
  private isLevelFinished = false;
  private invulnerableTimer = 0; // 0 to 3s ghost/shield on respawn

  // Telemetry & State
  private distanceTraveled = 0;
  private currentScore = 0;
  private coinsEarned = 0;
  private nitroGauge = 100;
  private isNitroActive = false;
  private isDrifting = false;
  private nearMissStreak = 0;
  private nearMissStreakTimer = 0;
  private totalDraftSeconds = 0;
  private maxSpeedAchieved = 0;
  private nearMissCount = 0;
  // Lateral force & audio telemetry
  private currentLateralG = 0;
  private prevLateralG = 0;
  private currentEngineLoad = 0;

  // Camera Settings
  private cameraMode: 'chase-close' | 'chase-far' | 'cockpit' = 'chase-close';
  private cameraShakeIntensity = 0;
  private baseFov = 65;

  // Input states
  private keysHeld: Record<string, boolean> = {};
  private virtualInputs = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
    nitro: false,
    horn: false,
  };

  // Loop control
  private isRunning = false;
  private isPaused = false;
  private isGameOver = false;
  private lastTime = 0;
  private animationFrameId = 0;
  private isSoftwareGl = false;

  // Photo Mode State
  public isPhotoMode = false;
  public photoOrbit = {
    azimuth: 0,
    polar: Math.PI / 4.5,
    distance: 6.2,
    fov: 55,
    roll: 0,
    heightOffset: 0.8,
  };

  // Real-Time Engine Diagnostics Telemetry
  private showDiagnostics = false;
  private frameCount = 0;
  private lastFpsTimestamp = 0;
  private currentFps = 60;
  private currentFrameTimeMs = 16.6;

  // Callbacks to UI
  private onStateUpdate: (state: PlayerCarState) => void;
  private onGameOver: (summary: GameSummary) => void;
  private onLevelComplete?: (summary: LevelCompleteSummary) => void;
  private onPopupNotification: (text: string, type: 'near_miss' | 'rival' | 'speed' | 'weather' | 'radio') => void;

  constructor(
    container: HTMLDivElement,
    carConfig: CarConfig,
    carColor: string,
    settings: GameSettings,
    onStateUpdate: (state: PlayerCarState) => void,
    onGameOver: (summary: GameSummary) => void,
    onPopupNotification: (text: string, type: 'near_miss' | 'rival' | 'speed' | 'weather' | 'radio') => void,
    onLevelComplete?: (summary: LevelCompleteSummary) => void
  ) {
    this.container = container;
    this.currentCarConfig = carConfig;
    this.carColorHex = parseInt(carColor.replace('#', '0x'), 16);
    this.cameraMode = settings.cameraMode;
    this.showDiagnostics = settings.showDiagnostics ?? false;
    this.onStateUpdate = onStateUpdate;
    this.onGameOver = onGameOver;
    this.onPopupNotification = onPopupNotification;
    this.onLevelComplete = onLevelComplete;

    // Detect software WebGL
    this.isSoftwareGl = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // Initialize Three.js scene & renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.baseFov,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      600
    );

    const isLowQuality = settings.graphicsQuality === 'low' || this.isSoftwareGl;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isLowQuality,
      powerPreference: 'high-performance',
      alpha: false,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isLowQuality ? 1.0 : Math.min(window.devicePixelRatio, 2.0));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = !isLowQuality;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Procedural RoomEnvironment for studio specular reflections on car body and chrome
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // Studio Lighting Rig
    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    this.dirLight.position.set(20, 45, -30);
    this.dirLight.castShadow = !isLowQuality;
    if (this.dirLight.castShadow) {
      this.dirLight.shadow.mapSize.width = isLowQuality ? 512 : 1024;
      this.dirLight.shadow.mapSize.height = isLowQuality ? 512 : 1024;
      this.dirLight.shadow.camera.near = 10;
      this.dirLight.shadow.camera.far = 120;
      this.dirLight.shadow.camera.left = -25;
      this.dirLight.shadow.camera.right = 25;
      this.dirLight.shadow.camera.top = 25;
      this.dirLight.shadow.camera.bottom = -25;
      this.dirLight.shadow.bias = -0.0005;
    }
    this.scene.add(this.dirLight);

    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.9);
    this.scene.add(this.hemiLight);

    // Subsystems
    this.environment = new EnvironmentManager();
    this.scene.add(this.environment.group);

    this.trafficManager = new TrafficManager();
    this.scene.add(this.trafficManager.group);

    this.particleSystem = new ParticleSystem();
    this.scene.add(this.particleSystem.group);

    this.weatherManager = new WeatherManager(this.scene, this.dirLight, this.hemiLight);
    this.weatherManager.onWeatherAlert = (msg, alertType) => {
      this.onPopupNotification(msg, 'weather');
      if (alertType === 'cleared') {
        this.currentScore += 350;
        this.coinsEarned += 30;
        soundManager.playCoin();
      }
    };

    // Initialize with Level 1
    this.applyLevel(this.currentLevelConfig);

    // Player Car Setup
    this.spawnPlayerCar();

    // Event listeners
    this.bindEvents();
  }

  private spawnPlayerCar() {
    if (this.playerCarModel) {
      this.scene.remove(this.playerCarModel.group);
    }
    this.playerCarModel = CarFactory.createPlayerCar(this.currentCarConfig.id, this.carColorHex);
    this.playerCarModel.group.position.copy(this.playerPos);
    this.scene.add(this.playerCarModel.group);
    soundManager.setEngineProfile(this.currentCarConfig.soundProfile);
  }

  /**
   * Configure the engine for a specific level or endless mode.
   */
  public setLevel(config: LevelConfig) {
    this.currentLevelConfig = config;
    this.applyLevel(config);
    this.retryLevel();
  }

  private applyLevel(config: LevelConfig) {
    this.environment.reset(0, config.theme, config.targetDistance);
    this.trafficManager.setLevelConfig(
      config.trafficDensity,
      config.trafficSpeedKmh,
      config.rivalAllowed
    );
    if (config.id === 0) {
      this.weatherManager.enableDynamicCycle();
    } else {
      this.weatherManager.setLevelWeather(config.weather, config.theme);
    }
  }

  public setCar(carConfig: CarConfig, colorHex: string) {
    this.currentCarConfig = carConfig;
    this.carColorHex = parseInt(colorHex.replace('#', '0x'), 16);
    this.spawnPlayerCar();
  }

  public setQuality(quality: 'low' | 'med' | 'high') {
    const isLow = quality === 'low' || this.isSoftwareGl;
    this.renderer.shadowMap.enabled = !isLow;
    this.renderer.setPixelRatio(isLow ? 1.0 : Math.min(window.devicePixelRatio, quality === 'high' ? 2.0 : 1.5));
  }

  public setCameraMode(mode: 'chase-close' | 'chase-far' | 'cockpit') {
    this.cameraMode = mode;
  }

  public cycleCameraMode() {
    if (this.cameraMode === 'chase-close') this.cameraMode = 'chase-far';
    else if (this.cameraMode === 'chase-far') this.cameraMode = 'cockpit';
    else this.cameraMode = 'chase-close';
  }

  public setShowDiagnostics(enabled: boolean) {
    this.showDiagnostics = enabled;
  }

  public getDiagnostics(): EngineDiagnostics {
    const info = this.renderer.info;
    const calls = info.render.calls;
    const triangles = info.render.triangles;
    const geometries = info.memory.geometries;
    const textures = info.memory.textures;

    // Estimate GPU VRAM footprint based on active WebGL buffers & textures
    const textureMemMb = textures * 2.8;
    const geomMemMb = geometries * 0.45;
    const baseBuffersMb = this.renderer.shadowMap.enabled ? 22.0 : 12.0;
    const totalGpuMb = Number((textureMemMb + geomMemMb + baseBuffersMb).toFixed(1));

    let jsHeapMb: number | undefined;
    if (typeof performance !== 'undefined' && (performance as any).memory?.usedJSHeapSize) {
      jsHeapMb = Number(((performance as any).memory.usedJSHeapSize / (1024 * 1024)).toFixed(1));
    }

    return {
      fps: this.currentFps,
      frameTimeMs: this.currentFrameTimeMs,
      drawCalls: calls,
      triangles,
      geometries,
      textures,
      gpuMemoryMb: totalGpuMb,
      jsHeapMb,
    };
  }

  public setVirtualInput(name: keyof typeof this.virtualInputs, value: number | boolean) {
    (this.virtualInputs as any)[name] = value;
  }

  public enterPhotoMode() {
    this.isPhotoMode = true;
    soundManager.updateEngineSound(900, 0, 0);

    // Smoothly calculate initial azimuth from current camera position
    if (this.playerCarModel) {
      const dx = this.camera.position.x - this.playerPos.x;
      const dz = this.camera.position.z - this.playerPos.z;
      this.photoOrbit.azimuth = Math.atan2(dx, dz);
      this.photoOrbit.polar = Math.PI / 4.2;
      this.photoOrbit.distance = 6.2;
      this.photoOrbit.fov = 55;
      this.photoOrbit.roll = 0;
      this.photoOrbit.heightOffset = 0.8;
    }
  }

  public exitPhotoMode() {
    this.isPhotoMode = false;
    this.camera.fov = this.baseFov;
    this.camera.rotation.z = 0;
    this.camera.updateProjectionMatrix();
  }

  public rotatePhotoOrbit(deltaX: number, deltaY: number) {
    this.photoOrbit.azimuth += deltaX * 0.008;
    this.photoOrbit.polar = Math.max(0.08, Math.min(Math.PI * 0.48, this.photoOrbit.polar + deltaY * 0.008));
  }

  public zoomPhotoOrbit(deltaDist: number) {
    this.photoOrbit.distance = Math.max(2.4, Math.min(22.0, this.photoOrbit.distance + deltaDist));
  }

  public setPhotoFov(fov: number) {
    this.photoOrbit.fov = Math.max(25, Math.min(95, fov));
  }

  public setPhotoRoll(rollDeg: number) {
    this.photoOrbit.roll = (rollDeg * Math.PI) / 180;
  }

  public setPhotoHeight(heightOffset: number) {
    this.photoOrbit.heightOffset = heightOffset;
  }

  public captureScreenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('resize', this.handleResize);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    soundManager.init(); // Unlock Web Audio context on first key press
    this.keysHeld[e.code] = true;

    if (e.code === 'KeyC') {
      this.cycleCameraMode();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysHeld[e.code] = false;
  };

  private handleBlur = () => {
    this.keysHeld = {};
    soundManager.setHorn(false);
  };

  private handleResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public start() {
    if (this.isRunning && !this.isPaused) return;
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.lastTime = performance.now();
    soundManager.init();
    soundManager.startMusic();
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  public pause() {
    this.isPaused = true;
    soundManager.stopMusic();
    soundManager.updateEngineSound(900, 0, 0);
  }

  public resume() {
    if (!this.isRunning || this.isGameOver) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    soundManager.startMusic();
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  /**
   * RETRY LEVEL:
   * Completely restarts the current level from its starting line (Z = 0),
   * resetting score, distance, timer, and traffic.
   */
  public retryLevel() {
    this.isGameOver = false;
    this.isPaused = false;
    this.isLevelFinished = false;
    this.speedKmh = 0;
    this.playerHeading = 0;
    this.driftAngle = 0;
    this.rpm = 1000;
    this.currentGear = 1;
    this.distanceTraveled = 0;
    this.elapsedTimeSeconds = 0;
    this.currentScore = 0;
    this.coinsEarned = 0;
    this.nitroGauge = 100;
    this.nearMissStreak = 0;
    this.nearMissCount = 0;
    this.totalDraftSeconds = 0;
    this.maxSpeedAchieved = 0;
    this.invulnerableTimer = 1.0;

    // Reset player position to start line (Lane 2, Z = 0)
    this.playerPos.set(1.85, 0, 0);
    this.playerVelocity.set(0, 0, 0);

    if (this.playerCarModel) {
      this.playerCarModel.group.position.copy(this.playerPos);
      this.playerCarModel.group.rotation.set(0, 0, 0);
    }

    // Reset environment and traffic to starting line
    this.environment.reset(0, this.currentLevelConfig.theme, this.currentLevelConfig.targetDistance);
    this.trafficManager.reset();
    this.trafficManager.setLevelConfig(
      this.currentLevelConfig.trafficDensity,
      this.currentLevelConfig.trafficSpeedKmh,
      this.currentLevelConfig.rivalAllowed
    );

    if (this.currentLevelConfig.id === 0) {
      this.weatherManager.enableDynamicCycle();
    } else {
      this.weatherManager.setLevelWeather(this.currentLevelConfig.weather, this.currentLevelConfig.theme);
    }

    // Instantly anchor camera directly behind vehicle
    this.camera.position.set(1.85, 2.3, -5.8);
    this.camera.lookAt(new THREE.Vector3(1.85, 1.2, 10));

    this.lastTime = performance.now();
    soundManager.startMusic();

    this.isRunning = true;
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  // Alias for backward compatibility
  public restart() {
    this.retryLevel();
  }

  /**
   * CRITICAL BUG FIX — RESPAWN AT CHECKPOINT:
   * Respawns the vehicle at the nearest validated road checkpoint,
   * re-anchoring world chunks, clearing traffic within 60m, clearing physics velocity,
   * and providing 3.0 seconds of invulnerability shield.
   */
  public respawnAtSafeCheckpoint() {
    const safeCoord = this.environment.getNearestSafeCheckpoint(this.playerPos.z);

    // Place car at safe road surface coordinates
    this.playerPos.set(safeCoord.x, safeCoord.y, safeCoord.z);
    this.playerVelocity.set(0, 0, 0);
    this.speedKmh = 0;
    this.playerHeading = 0;
    this.driftAngle = 0;
    this.rpm = 1200;
    this.currentGear = 1;

    if (this.playerCarModel) {
      this.playerCarModel.group.position.copy(this.playerPos);
      this.playerCarModel.group.rotation.set(0, 0, 0);
    }

    // CRITICAL: Re-anchor procedural road chunks around the respawn point
    this.environment.reset(safeCoord.z, this.currentLevelConfig.theme, this.currentLevelConfig.targetDistance);

    // Clear any traffic near the respawn point (60m radius)
    this.trafficManager.clearNearPosition(safeCoord.z, 60);

    // Position camera immediately behind respawned vehicle
    this.camera.position.set(safeCoord.x, safeCoord.y + 2.3, safeCoord.z - 5.8);
    this.camera.lookAt(new THREE.Vector3(safeCoord.x, safeCoord.y + 1.2, safeCoord.z + 10));

    // Reset game-over flags and give 3 seconds invulnerability
    this.isGameOver = false;
    this.isPaused = false;
    this.invulnerableTimer = 3.0;

    this.onPopupNotification('★ RESPAWNED AT SAFE CHECKPOINT ★', 'speed');

    this.lastTime = performance.now();
    soundManager.startMusic();
    this.isRunning = true;
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  private gameLoop = (timestamp: number) => {
    if (!this.isRunning || (this.isPaused && !this.isPhotoMode)) return;

    // Track live FPS and frame rendering time
    this.frameCount++;
    if (this.lastFpsTimestamp === 0) {
      this.lastFpsTimestamp = timestamp;
    }
    const elapsedSinceLastFps = timestamp - this.lastFpsTimestamp;
    if (elapsedSinceLastFps >= 250) {
      this.currentFps = Math.max(1, Math.round((this.frameCount * 1000) / elapsedSinceLastFps));
      this.currentFrameTimeMs = Number((elapsedSinceLastFps / this.frameCount).toFixed(1));
      this.frameCount = 0;
      this.lastFpsTimestamp = timestamp;
    }

    const rawDelta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    // Clamp frame delta time to prevent physics clipping during stutters
    const delta = Math.min(rawDelta, 0.05);

    if (this.isPhotoMode) {
      this.updateCamera(delta);
      this.renderer.render(this.scene, this.camera);
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
      return;
    }

    this.updatePhysics(delta);
    this.updateCamera(delta);
    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private updatePhysics(delta: number) {
    if (!this.playerCarModel || this.isGameOver || this.isLevelFinished) return;

    this.elapsedTimeSeconds += delta;

    // Countdown invulnerability shield
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
      // Ghost visual blink effect
      const blink = Math.sin(this.elapsedTimeSeconds * 20) > 0;
      this.playerCarModel.group.visible = blink || this.invulnerableTimer <= 0;
    } else {
      this.playerCarModel.group.visible = true;
    }

    // Input Aggregation: Combine Keyboard + Virtual Touch Inputs
    const kThrottle = (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) ? 1 : 0;
    const kBrake = (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) ? 1 : 0;
    const kLeft = (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) ? 1 : 0;
    const kRight = (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) ? 1 : 0;
    const kHandbrake = this.keysHeld['Space'] || false;
    const kNitro = this.keysHeld['ShiftLeft'] || this.keysHeld['ShiftRight'] || false;
    const kHorn = this.keysHeld['KeyH'] || false;

    const steerInput = Math.max(-1, Math.min(1, (kLeft - kRight) + (this.virtualInputs.steer || 0)));
    const throttleInput = Math.max(0, Math.min(1, kThrottle + (this.virtualInputs.throttle || 0)));
    const brakeInput = Math.max(0, Math.min(1, kBrake + (this.virtualInputs.brake || 0)));
    const isHandbrake = kHandbrake || this.virtualInputs.handbrake;
    const isNitroRequest = (kNitro || this.virtualInputs.nitro) && this.nitroGauge > 5 && this.speedKmh > 30;

    // Horn audio trigger
    soundManager.setHorn(kHorn || this.virtualInputs.horn);

    // Nitro handling
    if (isNitroRequest) {
      this.isNitroActive = true;
      this.nitroGauge = Math.max(0, this.nitroGauge - delta * 24);
      soundManager.setNitroSound(true);
      this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, 0.18);
    } else {
      this.isNitroActive = false;
      soundManager.setNitroSound(false);
      // Passive nitro refill when driving over 100 km/h
      if (this.speedKmh > 100 && this.nitroGauge < 100) {
        this.nitroGauge = Math.min(100, this.nitroGauge + delta * 3.5);
      }
    }

    // Acceleration & Braking Dynamics
    const effectiveTopSpeed = this.currentCarConfig.topSpeed * (this.isNitroActive ? (1 + this.currentCarConfig.nitroPower * 0.22) : 1.0);
    const accelPower = this.currentCarConfig.acceleration * (this.isNitroActive ? 1.6 : 1.0);

    let isAccelerating = false;
    let isBraking = false;

    if (throttleInput > 0.05 && brakeInput < 0.1) {
      isAccelerating = true;
      const speedRatio = this.speedKmh / effectiveTopSpeed;
      // Exponential power curve: highest torque in 1st/2nd gear
      const torque = Math.max(0.18, 1.0 - Math.pow(speedRatio, 1.6));
      this.speedKmh += accelPower * throttleInput * torque * 55 * delta;
      if (this.speedKmh > effectiveTopSpeed) {
        this.speedKmh = THREE.MathUtils.damp(this.speedKmh, effectiveTopSpeed, 2.0, delta);
      }
    } else if (brakeInput > 0.05) {
      isBraking = true;
      if (this.speedKmh > 2) {
        // Active Braking
        this.speedKmh -= brakeInput * 120 * delta;
        soundManager.setTireScreech(this.speedKmh > 60, 0.6);
      } else {
        // Reverse
        this.speedKmh = Math.max(-35, this.speedKmh - 25 * delta);
      }
    } else {
      // Natural aerodynamic drag & coasting resistance
      this.speedKmh = THREE.MathUtils.damp(this.speedKmh, 0, 0.6, delta);
    }

    const targetSpeedMs = (this.speedKmh * 1000) / 3600;

    // Track record top speed
    if (this.speedKmh > this.maxSpeedAchieved) {
      this.maxSpeedAchieved = Math.floor(this.speedKmh);
    }

    // Calculate RPM and automatic gear ratios
    const gearRatios = [0, 45, 90, 145, 205, 265, 340];
    let prevGear = this.currentGear;
    if (this.speedKmh < -0.1) {
      this.currentGear = 'R';
      this.rpm = 1000 + Math.abs(this.speedKmh) * 120;
    } else if (this.speedKmh < 1) {
      this.currentGear = 'N';
      this.rpm = isAccelerating ? 4500 : 950;
    } else {
      let g = 1;
      for (let i = 1; i < gearRatios.length; i++) {
        if (this.speedKmh > gearRatios[i]) g = i + 1;
      }
      this.currentGear = Math.min(6, g);

      const gearMinSpeed = gearRatios[this.currentGear - 1] || 0;
      const gearMaxSpeed = gearRatios[this.currentGear] || 350;
      const gearProgress = Math.min(
        1,
        (this.speedKmh - gearMinSpeed) / (gearMaxSpeed - gearMinSpeed)
      );
      this.rpm = 2200 + gearProgress * 6000;
    }

    if (prevGear !== this.currentGear && typeof this.currentGear === 'number') {
      soundManager.playGearShift();
    }

    // Dynamic Engine Load Physics (0.0 = idle/coast, 0.5-1.0 = accelerating pull, >1.0 = nitro/torque, negative = engine braking)
    let targetEngineLoad = 0;
    if (isAccelerating) {
      const gearLoadFactor = 0.55 + 0.45 * Math.min(1.0, this.speedKmh / (targetSpeedMs * 3.6 + 1.0));
      targetEngineLoad = gearLoadFactor + (this.isNitroActive ? 0.35 : 0) + (this.speedKmh > 200 ? 0.15 : 0);
    } else if (isBraking) {
      targetEngineLoad = -0.25; // engine braking / deceleration overrun
    } else {
      targetEngineLoad = -0.08; // neutral off-throttle coast
    }
    this.currentEngineLoad = THREE.MathUtils.damp(this.currentEngineLoad, targetEngineLoad, 8.0, delta);

    // Audio update for engine roar with procedural pitch shifting based on RPM and Load
    const throttleAmount = isAccelerating ? 1.0 : 0.0;
    soundManager.updateEngineSound(
      this.rpm,
      throttleAmount,
      this.speedKmh,
      this.currentEngineLoad,
      this.isNitroActive
    );

    // Taillight Brake glow
    for (const tlMat of this.playerCarModel.tailLightMaterials) {
      if (isBraking) {
        tlMat.emissive.setHex(0xef4444);
        tlMat.emissiveIntensity = 2.0;
      } else {
        tlMat.emissive.setHex(0x7f1d1d);
        tlMat.emissiveIntensity = 0.5;
      }
    }

    // Steering, Lateral Drift & Grip Dynamics
    const weatherGrip = this.weatherManager.getGripModifier();
    const gripFactor = this.currentCarConfig.handling * weatherGrip;
    const speedRatio = Math.min(1.0, Math.abs(this.speedKmh) / 80);
    const steerResponsiveness = 1.8 * gripFactor * (0.4 + speedRatio * 0.6);

    // Physical Lateral G-force calculation (high-lateral-force maneuver detection)
    const speedMs = Math.abs(this.speedKmh) / 3.6;
    const yawRate = Math.abs(steerInput * steerResponsiveness);
    const centripetalAcc = speedMs * yawRate * 1.85;
    const lateralVelocityAcc = Math.abs(this.playerVelocity.x) * 1.5;
    this.currentLateralG = (centripetalAcc + lateralVelocityAcc) / 9.81;

    // Detect Sudden High-Lateral-Force Maneuvers (Transient Chirp / Tire Bite Sample)
    const deltaLateralG = this.currentLateralG - this.prevLateralG;
    if (
      (deltaLateralG > 0.30 && this.currentLateralG > 0.52 && this.speedKmh > 65) ||
      (isHandbrake && Math.abs(steerInput) > 0.25 && this.speedKmh > 55 && !this.isDrifting)
    ) {
      // Trigger transient high-lateral-force tire bite/chirp sample!
      soundManager.playTireChirp(Math.min(1.4, this.currentLateralG));
    }
    this.prevLateralG = this.currentLateralG;

    // Handbrake Drifting & Slip Angle Physics
    if (isHandbrake && Math.abs(this.speedKmh) > 50) {
      this.isDrifting = true;
      this.driftAngle = THREE.MathUtils.damp(
        this.driftAngle,
        steerInput * 0.38,
        4.0,
        delta
      );
      // Drifting rewards bonus nitro!
      this.nitroGauge = Math.min(100, this.nitroGauge + delta * 15);
      this.currentScore += Math.floor(delta * 120);
    } else {
      this.isDrifting = false;
      this.driftAngle = THREE.MathUtils.damp(this.driftAngle, 0, 8.0, delta);
    }

    // Continuous multi-layer tire screech and scrub triggered by high lateral G forces
    soundManager.updateTirePhysics(
      this.currentLateralG,
      this.isDrifting,
      isBraking,
      this.speedKmh
    );

    // Lateral Movement (X velocity) with crosswind force from sandstorms/storms
    const lateralSpeed = steerInput * 12.0 * gripFactor * (targetSpeedMs / 35);
    const windForce = this.weatherManager.getWindForce();
    this.playerVelocity.x = THREE.MathUtils.damp(
      this.playerVelocity.x,
      lateralSpeed + windForce * 1.5,
      8.0,
      delta
    );
    this.playerVelocity.z = targetSpeedMs;

    // Crosswind camera buffeting during severe weather
    if (Math.abs(windForce) > 0.4) {
      this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, 0.08 * (Math.abs(windForce) / 3.0));
    }

    this.playerPos.x += this.playerVelocity.x * delta;
    this.playerPos.z += this.playerVelocity.z * delta;

    // Constrain player car within highway road shoulders (-7.2 to 7.2)
    const roadBoundary = this.environment.roadWidth * 0.5 - 0.9;
    if (this.playerPos.x < -roadBoundary) {
      this.playerPos.x = -roadBoundary;
      this.playerVelocity.x = 0;
      this.cameraShakeIntensity = 0.25; // rumble strip bump
    } else if (this.playerPos.x > roadBoundary) {
      this.playerPos.x = roadBoundary;
      this.playerVelocity.x = 0;
      this.cameraShakeIntensity = 0.25;
    }

    // ROAD WATCHDOG: Ensure player vehicle is ALWAYS on valid asphalt surface
    if (this.playerPos.y < -0.2 || Math.abs(this.playerPos.x) > 9.0) {
      this.playerPos.y = 0;
      this.playerPos.x = Math.max(-roadBoundary, Math.min(roadBoundary, this.playerPos.x));
      this.playerVelocity.x = 0;
    }

    // Car Body Orientation, Steering Angle & Suspension Kinematics
    this.playerHeading = -steerInput * 0.12 + this.driftAngle;
    this.playerCarModel.group.position.copy(this.playerPos);
    this.playerCarModel.group.rotation.y = this.playerHeading;

    // Believable Suspension Movement: Lateral roll into turns + pitch dive on brake / squat on throttle
    const rollAmount = -steerInput * (0.05 / Math.max(0.8, this.currentCarConfig.handling));
    const targetPitch = isBraking ? 0.035 : (isAccelerating ? -0.02 : 0);
    this.playerCarModel.group.rotation.z = THREE.MathUtils.damp(this.playerCarModel.group.rotation.z, rollAmount, 10.0, delta);
    this.playerCarModel.group.rotation.x = THREE.MathUtils.damp(this.playerCarModel.group.rotation.x, targetPitch, 8.0, delta);

    // Front wheels steering visual angle
    const wheelSteerAngle = -steerInput * 0.42;
    for (const fw of this.playerCarModel.frontWheels) {
      fw.rotation.y = wheelSteerAngle;
    }

    // Wheel rotation speed
    const wheelRot = (targetSpeedMs * delta) / 0.36;
    for (const w of this.playerCarModel.allWheels) {
      w.rotation.x += wheelRot;
    }

    // Distance and scoring
    const distanceIncrement = targetSpeedMs * delta;
    if (distanceIncrement > 0) {
      this.distanceTraveled += distanceIncrement;
      this.currentScore += Math.floor(distanceIncrement * (1 + this.speedKmh / 150));
    }

    // CHECK LEVEL FINISH LINE TRIGGER (Crosses the real 3D finish line in correct direction)
    if (
      this.currentLevelConfig.targetDistance > 0 &&
      this.distanceTraveled >= this.currentLevelConfig.targetDistance * 0.95 &&
      this.playerPos.z >= this.currentLevelConfig.targetDistance &&
      this.playerVelocity.z >= 0 &&
      !this.isLevelFinished &&
      !this.isGameOver
    ) {
      this.finishLevel();
      return;
    }

    // Particles: Procedural exhaust scaling with RPM & Throttle
    const worldPipes: THREE.Vector3[] = [];
    for (const p of this.playerCarModel.exhaustPipes) {
      const wp = p.clone().applyMatrix4(this.playerCarModel.group.matrixWorld);
      worldPipes.push(wp);
    }
    this.particleSystem.emitExhaust(
      worldPipes,
      this.playerHeading,
      this.rpm,
      throttleAmount,
      this.isNitroActive
    );

    // Tire smoke when drifting
    if (this.isDrifting) {
      const rearWheels: THREE.Vector3[] = [
        new THREE.Vector3(-0.95, 0.1, -1.35).applyMatrix4(this.playerCarModel.group.matrixWorld),
        new THREE.Vector3(0.95, 0.1, -1.35).applyMatrix4(this.playerCarModel.group.matrixWorld),
      ];
      this.particleSystem.emitDriftSmoke(rearWheels, this.playerVelocity);
    }

    // Rain spray when road is wet
    if (this.weatherManager.isWetRoad()) {
      const rearWheels: THREE.Vector3[] = [
        new THREE.Vector3(-0.95, 0.1, -1.35).applyMatrix4(this.playerCarModel.group.matrixWorld),
        new THREE.Vector3(0.95, 0.1, -1.35).applyMatrix4(this.playerCarModel.group.matrixWorld),
      ];
      this.particleSystem.emitWaterSpray(rearWheels, this.speedKmh);
    }

    // Update Particle System
    this.particleSystem.update(delta);

    // Update Environment & Infinite Highway
    this.environment.update(this.playerPos.z);
    this.environment.setWetRoad(this.weatherManager.isWetRoad());

    // Update Dynamic Weather Progression
    this.weatherManager.updateDistance(this.distanceTraveled, delta, this.playerPos);

    // Keep directional sunlight following player
    this.dirLight.position.z = this.playerPos.z - 30;
    this.dirLight.target.position.z = this.playerPos.z + 10;
    this.dirLight.target.updateMatrixWorld();

    // Update Traffic, Near-Misses, and Rival System
    const trafficResult = this.trafficManager.update(
      delta,
      this.playerPos,
      this.speedKmh,
      (nearMissPos) => {
        // Near Miss Event!
        this.nearMissCount++;
        this.nearMissStreak++;
        this.nearMissStreakTimer = 4.0;
        const comboBonus = 150 * this.nearMissStreak;
        this.currentScore += comboBonus;
        this.coinsEarned += 15 * this.nearMissStreak;
        this.nitroGauge = Math.min(100, this.nitroGauge + 25);
        soundManager.playNearMiss();
        soundManager.playCoin();
        this.onPopupNotification(`+${comboBonus} CLOSE CALL! x${this.nearMissStreak}`, 'near_miss');
      },
      () => {
        // Rival Duel Overtake / Draft Won!
        this.coinsEarned += 250;
        this.currentScore += 1500;
        this.nitroGauge = 100;
        soundManager.playCoin();
        this.onPopupNotification('★ RIVAL DEFEATED! +250 COINS ★', 'rival');
      }
    );

    // Near miss streak timer decay
    if (this.nearMissStreakTimer > 0) {
      this.nearMissStreakTimer -= delta;
      if (this.nearMissStreakTimer <= 0) {
        this.nearMissStreak = 0;
      }
    }

    // Drafting Behind Rival Logic
    if (trafficResult.isDrafting) {
      this.totalDraftSeconds += delta;
      this.speedKmh = Math.min(effectiveTopSpeed + 15, this.speedKmh + 22 * delta);
      this.nitroGauge = Math.min(100, this.nitroGauge + delta * 12);
      this.currentScore += Math.floor(delta * 200);
      this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, 0.12);
    }

    // Check Traffic Collision (Crash Sequence!)
    // Only crash if not invulnerable
    if (trafficResult.collidedEntity && this.invulnerableTimer <= 0) {
      this.triggerCrash(trafficResult.collidedEntity);
    }

    // Level telemetry
    const targetDist = this.currentLevelConfig.targetDistance;
    const progressPercent = targetDist > 0 ? Math.min(100, (this.distanceTraveled / targetDist) * 100) : 0;
    const lastCheckpoint = Math.floor(this.playerPos.z / 500) * 500;

    // Query rear threats for overhead proximity warning HUD
    const rearThreats = this.trafficManager.getRearThreats(this.playerPos, this.speedKmh);
    const criticalRearThreat = rearThreats.find((t) => t.isCritical) || null;

    if (criticalRearThreat && criticalRearThreat.distanceMeters <= 14 && criticalRearThreat.isApproaching) {
      soundManager.playProximityWarning();
    }

    // Dispatch player state telemetry to HUD
    this.onStateUpdate({
      speedKmh: Math.floor(this.speedKmh),
      rpm: Math.floor(this.rpm),
      gear: this.currentGear,
      throttle: throttleAmount,
      brake: isBraking ? 1.0 : 0.0,
      steer: steerInput,
      isDrifting: this.isDrifting,
      isNitroActive: this.isNitroActive,
      nitroGauge: Math.floor(this.nitroGauge),
      distanceMeters: Math.floor(this.distanceTraveled),
      score: this.currentScore,
      coinsEarned: this.coinsEarned,
      health: 100,
      nearMissCombo: this.nearMissStreak,
      isDrafting: trafficResult.isDrafting,
      draftTime: this.totalDraftSeconds,
      rivalActive: this.trafficManager.activeRival !== null,
      rivalAheadDist: trafficResult.rivalDist,
      currentWeather: this.weatherManager.currentWeather,
      weatherProgress: this.weatherManager.transitionFactor,
      levelId: this.currentLevelConfig.id,
      levelName: this.currentLevelConfig.name,
      targetDistance: targetDist,
      levelProgressPercent: Math.floor(progressPercent),
      isInvulnerable: this.invulnerableTimer > 0,
      lastCheckpointDist: lastCheckpoint,
      elapsedTimeSeconds: Math.floor(this.elapsedTimeSeconds),
      rearThreats,
      criticalRearThreat,
      activeWeatherEvent: this.weatherManager.getActiveEvent(),
      diagnostics: this.showDiagnostics ? this.getDiagnostics() : undefined,
    });
  }

  private triggerCrash(collidedVehicle: any) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    soundManager.playCrash();
    soundManager.stopMusic();
    this.cameraShakeIntensity = 1.2;

    // Explode sparks and particles at impact point
    this.particleSystem.emitCrashSparks(this.playerPos.clone().add(new THREE.Vector3(0, 0.5, 1.5)), 60);

    // Rebound physics impulse
    this.playerVelocity.z = -15;
    this.playerVelocity.x = (this.playerPos.x > collidedVehicle.group.position.x ? 1 : -1) * 12;

    setTimeout(() => {
      this.onGameOver({
        distance: Math.floor(this.distanceTraveled),
        topSpeed: this.maxSpeedAchieved,
        nearMisses: this.nearMissCount,
        draftTimeSeconds: Math.floor(this.totalDraftSeconds),
        coinsEarned: this.coinsEarned,
        score: this.currentScore,
        isNewRecord: false,
        cause: 'collision',
        levelId: this.currentLevelConfig.id,
      });
    }, 1200);
  }

  private finishLevel() {
    if (this.isLevelFinished || this.isGameOver) return;
    this.isLevelFinished = true;
    this.speedKmh = Math.max(90, this.speedKmh * 0.85); // Smooth cruising victory rollout
    soundManager.playVictoryFanfare();
    soundManager.playCoin();
    this.onPopupNotification('🏁 FINISH! LEVEL COMPLETE 🏁', 'speed');

    // Calculate stars (1 to 3)
    let stars = 1;
    const timeBenchmark = this.currentLevelConfig.targetTimeSeconds;
    const [star1, star2, star3] = this.currentLevelConfig.starScoreThresholds;

    if (this.currentScore >= star3 || (timeBenchmark > 0 && this.elapsedTimeSeconds <= timeBenchmark)) {
      stars = 3;
    } else if (this.currentScore >= star2 || (timeBenchmark > 0 && this.elapsedTimeSeconds <= timeBenchmark * 1.25)) {
      stars = 2;
    }

    // Finishing position relative to grid
    let finishPosition = 1;
    if (timeBenchmark > 0) {
      if (this.elapsedTimeSeconds > timeBenchmark * 1.35) {
        finishPosition = 3;
      } else if (this.elapsedTimeSeconds > timeBenchmark * 1.15) {
        finishPosition = 2;
      }
    }

    const overtakes = Math.max(this.nearMissCount, Math.floor(this.distanceTraveled / 220));
    const cleanDrivingBonus = this.elapsedTimeSeconds <= timeBenchmark ? 2000 : 800;
    const totalCoins = this.coinsEarned + this.currentLevelConfig.rewardCoins;

    // Centiseconds formatted time: MM:SS.cc
    const m = Math.floor(this.elapsedTimeSeconds / 60);
    const s = Math.floor(this.elapsedTimeSeconds % 60);
    const cs = Math.floor((this.elapsedTimeSeconds % 1) * 100);
    const formattedTime = `${m}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;

    setTimeout(() => {
      if (this.onLevelComplete) {
        this.onLevelComplete({
          levelId: this.currentLevelConfig.id,
          levelName: this.currentLevelConfig.name,
          stars,
          timeSeconds: Math.floor(this.elapsedTimeSeconds),
          formattedTime,
          distance: Math.floor(this.distanceTraveled),
          topSpeed: this.maxSpeedAchieved,
          nearMisses: this.nearMissCount,
          overtakes,
          finishPosition,
          totalRacers: 8,
          cleanDrivingBonus,
          score: this.currentScore + cleanDrivingBonus,
          coinsEarned: totalCoins,
          isNewBest: true,
          unlockedNextLevel: this.currentLevelConfig.id < 10,
        });
      }
    }, 1200);
  }

  private updateCamera(delta: number) {
    if (!this.playerCarModel) return;

    // Photo Mode: Spherical orbit around player's car
    if (this.isPhotoMode) {
      const targetPos = this.playerPos.clone().add(new THREE.Vector3(0, this.photoOrbit.heightOffset, 0));
      const sinPolar = Math.sin(this.photoOrbit.polar);
      const cosPolar = Math.cos(this.photoOrbit.polar);
      const sinAzimuth = Math.sin(this.photoOrbit.azimuth);
      const cosAzimuth = Math.cos(this.photoOrbit.azimuth);

      const x = targetPos.x + this.photoOrbit.distance * sinPolar * sinAzimuth;
      const y = targetPos.y + this.photoOrbit.distance * cosPolar;
      const z = targetPos.z + this.photoOrbit.distance * sinPolar * cosAzimuth;

      this.camera.position.set(x, y, z);
      this.camera.fov = this.photoOrbit.fov;
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(targetPos);
      if (this.photoOrbit.roll !== 0) {
        this.camera.rotation.z += this.photoOrbit.roll;
      }
      return;
    }

    // Camera Mode Positioning
    if (this.cameraMode === 'cockpit') {
      _vOffset.set(0, 1.15, 0.2);
      _vLook.set(0, 1.1, 25);
    } else if (this.cameraMode === 'chase-far') {
      _vOffset.set(0, 3.8, -9.2);
      _vLook.set(0, 1.3, 14);
    } else {
      _vOffset.set(0, 2.3, -5.8);
      _vLook.set(0, 1.2, 10);
    }

    // Dynamic FOV based on speed & nitro (widens up to 88 degrees for sensation of speed)
    const speedRatio = Math.min(1.0, this.speedKmh / this.currentCarConfig.topSpeed);
    const targetFov = this.baseFov + speedRatio * 18 + (this.isNitroActive ? 8 : 0);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 4.0, delta);
    this.camera.updateProjectionMatrix();

    // Smooth camera follow position
    const targetCamPos = this.playerPos.clone().add(_vOffset);

    // Apply camera shake if any
    if (this.cameraShakeIntensity > 0.01) {
      targetCamPos.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      targetCamPos.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = THREE.MathUtils.damp(this.cameraShakeIntensity, 0, 4.0, delta);
    }

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamPos.x, 9.0, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamPos.y, 9.0, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamPos.z, 14.0, delta);

    const lookTarget = this.playerPos.clone().add(_vLook);
    this.camera.lookAt(lookTarget);
  }

  public dispose() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('resize', this.handleResize);

    soundManager.stopAll();

    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
    }
    this.renderer.dispose();
    if (this.container && this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
