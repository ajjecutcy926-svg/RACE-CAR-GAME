import * as THREE from 'three';
import { DynamicWeatherEvent, DynamicWeatherEventType, LevelTheme, WeatherType } from '../types.ts';

interface WeatherPreset {
  skyColor: THREE.Color;
  fogColor: THREE.Color;
  fogDensity: number;
  dirLightColor: THREE.Color;
  dirLightIntensity: number;
  hemiSkyColor: THREE.Color;
  hemiGroundColor: THREE.Color;
  hemiIntensity: number;
  isWet: boolean;
  hasRain: boolean;
  streetlightsOn: boolean;
}

export class WeatherManager {
  public currentWeather: WeatherType = 'clear';
  public targetWeather: WeatherType = 'clear';
  public transitionFactor = 0; // 0 to 1

  private scene: THREE.Scene;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Particle systems
  private rainParticles: THREE.Points | null = null;
  private rainGeo: THREE.BufferGeometry | null = null;
  private starParticles: THREE.Points | null = null;
  private sandParticles: THREE.Points | null = null;
  private sandGeo: THREE.BufferGeometry | null = null;

  private isLevelFixed = false;
  private currentTheme: LevelTheme = 'highway';
  private weatherCycle: WeatherType[] = ['clear', 'sunset', 'night', 'rain'];
  private cycleDistance = 1200; // transition every 1200m in endless mode

  // Dynamic Mid-Race Weather Event State Machine
  private eventPhase: 'idle' | 'warning' | 'active' | 'clearing' = 'idle';
  private timeUntilNextEvent = 22 + Math.random() * 16; // procedural timer between 22s and 38s
  private activeEventDuration = 0;
  private activeEventElapsedTime = 0;
  private currentEventType: DynamicWeatherEventType = 'none';
  private pendingEventType: DynamicWeatherEventType = 'none';
  private eventIntensity = 0; // 0.0 to 1.0 smooth ramp
  private windDirection = 1; // 1 = blowing right, -1 = blowing left
  private windGustPhase = 0;

  // Alert Callback to notify GameEngine & HUD toasts
  public onWeatherAlert: ((message: string, type: 'weather' | 'warning' | 'cleared') => void) | null = null;

  private presets: Record<WeatherType, WeatherPreset> = {
    clear: {
      skyColor: new THREE.Color(0x38bdf8),
      fogColor: new THREE.Color(0x93c5fd),
      fogDensity: 0.0035,
      dirLightColor: new THREE.Color(0xfff7ed),
      dirLightIntensity: 1.85,
      hemiSkyColor: new THREE.Color(0xbae6fd),
      hemiGroundColor: new THREE.Color(0x1e293b),
      hemiIntensity: 0.95,
      isWet: false,
      hasRain: false,
      streetlightsOn: false,
    },
    sunset: {
      skyColor: new THREE.Color(0xe11d48), // deep red-amber sunset
      fogColor: new THREE.Color(0xfb923c), // warm amber fog
      fogDensity: 0.004,
      dirLightColor: new THREE.Color(0xfdba74),
      dirLightIntensity: 1.6,
      hemiSkyColor: new THREE.Color(0xf43f5e),
      hemiGroundColor: new THREE.Color(0x4c0519),
      hemiIntensity: 0.8,
      isWet: false,
      hasRain: false,
      streetlightsOn: true,
    },
    night: {
      skyColor: new THREE.Color(0x060814),
      fogColor: new THREE.Color(0x0a0f1d),
      fogDensity: 0.005,
      dirLightColor: new THREE.Color(0x38bdf8),
      dirLightIntensity: 0.45,
      hemiSkyColor: new THREE.Color(0x1e1b4b),
      hemiGroundColor: new THREE.Color(0x030712),
      hemiIntensity: 0.5,
      isWet: false,
      hasRain: false,
      streetlightsOn: true,
    },
    rain: {
      skyColor: new THREE.Color(0x1e293b),
      fogColor: new THREE.Color(0x334155),
      fogDensity: 0.0062,
      dirLightColor: new THREE.Color(0x94a3b8),
      dirLightIntensity: 0.65,
      hemiSkyColor: new THREE.Color(0x475569),
      hemiGroundColor: new THREE.Color(0x0f172a),
      hemiIntensity: 0.6,
      isWet: true,
      hasRain: true,
      streetlightsOn: true,
    },
  };

  constructor(scene: THREE.Scene, dirLight: THREE.DirectionalLight, hemiLight: THREE.HemisphereLight) {
    this.scene = scene;
    this.dirLight = dirLight;
    this.hemiLight = hemiLight;

    this.scene.fog = new THREE.FogExp2(this.presets.clear.fogColor, this.presets.clear.fogDensity);
    this.scene.background = this.presets.clear.skyColor;

    this.initRain();
    this.initStars();
    this.initSandstorm();
  }

  private initRain() {
    const rainCount = 2000;
    this.rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 70;
      positions[i * 3 + 1] = Math.random() * 32;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }

    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.22,
      transparent: true,
      opacity: 0.65,
    });

    this.rainParticles = new THREE.Points(this.rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  private initStars() {
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 250 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * (Math.PI * 0.42); // upper hemisphere

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) + 20;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.4,
      transparent: true,
      opacity: 0,
    });

    this.starParticles = new THREE.Points(starGeo, starMat);
    this.starParticles.name = 'starfield';
    this.scene.add(this.starParticles);
  }

  private initSandstorm() {
    const sandCount = 1400;
    this.sandGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(sandCount * 3);

    for (let i = 0; i < sandCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 65;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 65;
    }

    this.sandGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const sandMat = new THREE.PointsMaterial({
      color: 0xd97706,
      size: 0.38,
      transparent: true,
      opacity: 0,
    });

    this.sandParticles = new THREE.Points(this.sandGeo, sandMat);
    this.sandParticles.visible = false;
    this.scene.add(this.sandParticles);
  }

  /**
   * Reset procedural weather event timer on level start / retry
   */
  public resetEvents() {
    this.eventPhase = 'idle';
    this.timeUntilNextEvent = 20 + Math.random() * 18;
    this.activeEventDuration = 0;
    this.activeEventElapsedTime = 0;
    this.currentEventType = 'none';
    this.pendingEventType = 'none';
    this.eventIntensity = 0;
    if (this.sandParticles) {
      this.sandParticles.visible = false;
      (this.sandParticles.material as THREE.PointsMaterial).opacity = 0;
    }
  }

  /**
   * Configure environment weather for a specific level or theme.
   */
  public setLevelWeather(weather: WeatherType, theme: LevelTheme) {
    this.isLevelFixed = true;
    this.currentTheme = theme;
    this.currentWeather = weather;
    this.targetWeather = weather;
    this.transitionFactor = 0;
    this.resetEvents();

    // Biome-specific custom tints
    if (theme === 'desert') {
      this.presets.clear.skyColor.setHex(0x38bdf8);
      this.presets.clear.fogColor.setHex(0xfef08a);
      this.presets.clear.dirLightColor.setHex(0xffedd5);
    } else if (theme === 'night_city' || weather === 'night') {
      this.presets.night.skyColor.setHex(0x040714);
      this.presets.night.fogColor.setHex(0x080e22);
    }

    this.applyWeather(this.currentWeather, this.targetWeather, 0);
  }

  public enableDynamicCycle() {
    this.isLevelFixed = false;
    this.resetEvents();
  }

  /**
   * Main update tick for weather, procedural timers, particles, and physical modifiers.
   */
  public updateDistance(distanceMeters: number, delta: number, playerPos: THREE.Vector3) {
    // 1. Procedural Weather Event State Machine
    this.updateDynamicWeatherEvents(delta);

    // 2. Base Weather Transition (Endless cycle or Level theme)
    if (!this.isLevelFixed) {
      const cycleIndex = Math.floor(distanceMeters / this.cycleDistance) % this.weatherCycle.length;
      const nextIndex = (cycleIndex + 1) % this.weatherCycle.length;
      const progressInCycle = (distanceMeters % this.cycleDistance) / this.cycleDistance;

      if (progressInCycle > 0.75) {
        this.currentWeather = this.weatherCycle[cycleIndex];
        this.targetWeather = this.weatherCycle[nextIndex];
        this.transitionFactor = (progressInCycle - 0.75) / 0.25;
      } else {
        this.currentWeather = this.weatherCycle[cycleIndex];
        this.targetWeather = this.currentWeather;
        this.transitionFactor = 0;
      }
    }

    // 3. Apply Base & Event Weather Modulations to 3D Fog and Lighting
    this.applyWeather(this.currentWeather, this.targetWeather, this.transitionFactor);

    // 4. Update Stars (Follow player and fade at night)
    if (this.starParticles) {
      this.starParticles.position.z = playerPos.z;
      const isNight = this.currentWeather === 'night' || this.targetWeather === 'night';
      const mat = this.starParticles.material as THREE.PointsMaterial;
      const targetOpacity = isNight ? 0.85 : 0;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, targetOpacity, 2.0, delta);
      this.starParticles.visible = mat.opacity > 0.05;
    }

    // 5. Update Rain Particles (Dynamic intensity)
    this.updateRainParticles(delta, playerPos);

    // 6. Update Sandstorm Particles (Dynamic swirling dust)
    this.updateSandParticles(delta, playerPos);
  }

  /**
   * Procedural timer and state machine to trigger mid-race environmental hazards.
   */
  private updateDynamicWeatherEvents(delta: number) {
    this.windGustPhase += delta * 1.5;

    switch (this.eventPhase) {
      case 'idle': {
        this.timeUntilNextEvent -= delta;
        // Broadcast early warning advisory at 4.5 seconds before onset
        if (this.timeUntilNextEvent <= 4.5) {
          this.eventPhase = 'warning';
          this.pendingEventType = this.selectProceduralEvent();
          const warningMessage = this.getEventWarningMessage(this.pendingEventType);
          this.onWeatherAlert?.(warningMessage, 'warning');
        }
        break;
      }

      case 'warning': {
        this.timeUntilNextEvent -= delta;
        if (this.timeUntilNextEvent <= 0) {
          // Trigger the active event
          this.eventPhase = 'active';
          this.currentEventType = this.pendingEventType;
          this.pendingEventType = 'none';
          this.activeEventDuration = 14 + Math.random() * 8; // 14s to 22s
          this.activeEventElapsedTime = 0;
          this.windDirection = Math.random() > 0.5 ? 1 : -1;
          const activeMessage = this.getEventActiveMessage(this.currentEventType);
          this.onWeatherAlert?.(activeMessage, 'weather');
        }
        break;
      }

      case 'active': {
        this.activeEventElapsedTime += delta;
        const progress = this.activeEventElapsedTime / this.activeEventDuration;

        // Smooth ease-in (first 20%) and ease-out (last 25%)
        if (progress < 0.2) {
          this.eventIntensity = THREE.MathUtils.lerp(0, 1, progress / 0.2);
        } else if (progress > 0.75) {
          this.eventIntensity = THREE.MathUtils.lerp(1, 0, (progress - 0.75) / 0.25);
        } else {
          this.eventIntensity = 1.0;
        }

        if (this.activeEventElapsedTime >= this.activeEventDuration) {
          // Event completed! Clear back to normal and reward player survival
          this.eventPhase = 'clearing';
          const clearedMsg = `☀️ ${this.getEventName(this.currentEventType)} Cleared! Road Traction Restored`;
          this.onWeatherAlert?.(clearedMsg, 'cleared');
          this.currentEventType = 'none';
          this.eventIntensity = 0;
          this.timeUntilNextEvent = 26 + Math.random() * 24; // next event in 26-50s
          this.eventPhase = 'idle';
        }
        break;
      }

      case 'clearing':
      default:
        this.eventPhase = 'idle';
        break;
    }
  }

  /**
   * Procedural weather event selector weighted by the current level theme.
   */
  private selectProceduralEvent(): DynamicWeatherEventType {
    const roll = Math.random();

    if (this.currentTheme === 'desert') {
      // Deserts favor intense sandstorms
      return roll < 0.75 ? 'sandstorm' : 'dense_fog';
    }

    if (this.currentTheme === 'rainy') {
      // Rainy tracks experience torrential downpours
      return roll < 0.8 ? 'torrential_rain' : 'dense_fog';
    }

    if (this.currentTheme === 'mountain') {
      // Alpine ridges favor blinding fog banks and cold rain
      return roll < 0.65 ? 'dense_fog' : 'torrential_rain';
    }

    // Default highway / city / endless: balanced mix
    if (roll < 0.4) return 'dense_fog';
    if (roll < 0.75) return 'torrential_rain';
    return 'sandstorm';
  }

  private getEventWarningMessage(type: DynamicWeatherEventType): string {
    switch (type) {
      case 'dense_fog':
        return '⚠️ WEATHER ADVISORY: Dense Fog Bank Inbound — Prepare for Low Visibility!';
      case 'torrential_rain':
        return '⚠️ STORM WARNING: Torrential Rain Detected — Hydroplaning Hazard!';
      case 'sandstorm':
        return '⚠️ SEVERE WEATHER: Sandstorm Approaching — High Crosswinds!';
      default:
        return '⚠️ WEATHER ALERT: Atmospheric Shift Detected';
    }
  }

  private getEventActiveMessage(type: DynamicWeatherEventType): string {
    switch (type) {
      case 'dense_fog':
        return '🌫️ DENSE FOG BANK ACTIVE — Reduced Visibility Ahead!';
      case 'torrential_rain':
        return '⛈️ TORRENTIAL DOWNPOUR — Traction Reduced by 28%!';
      case 'sandstorm':
        return '🌪️ HABOOB SANDSTORM — Strong Crosswind Buffet!';
      default:
        return '🌪️ SEVERE WEATHER ACTIVE';
    }
  }

  private getEventName(type: DynamicWeatherEventType): string {
    switch (type) {
      case 'dense_fog':
        return 'Fog Bank';
      case 'torrential_rain':
        return 'Heavy Rain';
      case 'sandstorm':
        return 'Sandstorm';
      default:
        return 'Storm';
    }
  }

  /**
   * Update rain particle positions and speed depending on dynamic rain intensity.
   */
  private updateRainParticles(delta: number, playerPos: THREE.Vector3) {
    if (!this.rainParticles || !this.rainGeo) return;

    const baseRaining = this.currentWeather === 'rain' || (this.targetWeather === 'rain' && this.transitionFactor > 0.2);
    const isTorrential = this.currentEventType === 'torrential_rain' && this.eventIntensity > 0.05;
    const isRaining = baseRaining || isTorrential;

    this.rainParticles.visible = isRaining;

    if (isRaining) {
      this.rainParticles.position.x = playerPos.x;
      this.rainParticles.position.z = playerPos.z;

      const mat = this.rainParticles.material as THREE.PointsMaterial;
      const targetOpacity = isTorrential ? 0.92 : 0.65;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, targetOpacity, 3.0, delta);
      mat.size = isTorrential ? 0.32 : 0.22;

      const fallSpeed = isTorrential ? 56 : 35;
      const posAttr = this.rainGeo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] -= fallSpeed * delta;
        if (arr[i] < 0) {
          arr[i] = 26 + Math.random() * 6;
        }
      }
      posAttr.needsUpdate = true;
    }
  }

  /**
   * Update sandstorm particles with lateral crosswind swirl across camera view.
   */
  private updateSandParticles(delta: number, playerPos: THREE.Vector3) {
    if (!this.sandParticles || !this.sandGeo) return;

    const isSandstorm = this.currentEventType === 'sandstorm' && this.eventIntensity > 0.05;
    this.sandParticles.visible = isSandstorm;

    if (isSandstorm) {
      this.sandParticles.position.x = playerPos.x;
      this.sandParticles.position.z = playerPos.z;

      const mat = this.sandParticles.material as THREE.PointsMaterial;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, this.eventIntensity * 0.78, 4.0, delta);

      const lateralWind = this.windDirection * (24 + Math.sin(this.windGustPhase) * 12);
      const posAttr = this.sandGeo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < arr.length; i += 3) {
        // X movement: high lateral swirl
        arr[i] += lateralWind * delta;
        if (arr[i] > 35) arr[i] = -35;
        if (arr[i] < -35) arr[i] = 35;

        // Y movement: turbulent rise and fall
        arr[i + 1] -= (8 + Math.sin(i) * 4) * delta;
        if (arr[i + 1] < 0.2) {
          arr[i + 1] = 16 + Math.random() * 4;
        }

        // Z movement: relative forward/backward stream
        arr[i + 2] -= 18 * delta;
        if (arr[i + 2] < -35) {
          arr[i + 2] = 35;
        }
      }
      posAttr.needsUpdate = true;
    }
  }

  /**
   * Applies base weather blended with active procedural weather events to the scene.
   */
  private applyWeather(from: WeatherType, to: WeatherType, t: number) {
    const fromP = this.presets[from];
    const toP = this.presets[to];

    // Lerp baseline colors & intensities
    const sky = fromP.skyColor.clone().lerp(toP.skyColor, t);
    const fog = fromP.fogColor.clone().lerp(toP.fogColor, t);
    let fogDens = THREE.MathUtils.lerp(fromP.fogDensity, toP.fogDensity, t);

    const dirCol = fromP.dirLightColor.clone().lerp(toP.dirLightColor, t);
    let dirInt = THREE.MathUtils.lerp(fromP.dirLightIntensity, toP.dirLightIntensity, t);

    const hemiSky = fromP.hemiSkyColor.clone().lerp(toP.hemiSkyColor, t);
    const hemiGnd = fromP.hemiGroundColor.clone().lerp(toP.hemiGroundColor, t);
    let hemiInt = THREE.MathUtils.lerp(fromP.hemiIntensity, toP.hemiIntensity, t);

    // Apply procedural mid-race weather event modulations
    if (this.currentEventType !== 'none' && this.eventIntensity > 0) {
      const eInt = this.eventIntensity;

      if (this.currentEventType === 'dense_fog') {
        // Dense Fog: Sky dims, thick misty silver-slate fog up to 0.016
        const fogEventColor = new THREE.Color(0x64748b);
        fog.lerp(fogEventColor, eInt * 0.85);
        sky.lerp(new THREE.Color(0x334155), eInt * 0.7);
        fogDens = THREE.MathUtils.lerp(fogDens, 0.016, eInt);
        dirInt *= 1 - eInt * 0.55;
        hemiInt *= 1 - eInt * 0.4;
      } else if (this.currentEventType === 'torrential_rain') {
        // Torrential Downpour: Dark storm clouds, gloomy atmospheric lighting
        const stormSky = new THREE.Color(0x0f172a);
        const stormFog = new THREE.Color(0x1e293b);
        sky.lerp(stormSky, eInt * 0.9);
        fog.lerp(stormFog, eInt * 0.85);
        fogDens = THREE.MathUtils.lerp(fogDens, 0.0098, eInt);
        dirInt *= 1 - eInt * 0.65;
        hemiInt *= 1 - eInt * 0.45;
      } else if (this.currentEventType === 'sandstorm') {
        // Sandstorm: Golden-amber dust haze, dim ochre sun
        const sandSky = new THREE.Color(0x78350f);
        const sandFog = new THREE.Color(0xd97706);
        sky.lerp(sandSky, eInt * 0.92);
        fog.lerp(sandFog, eInt * 0.9);
        fogDens = THREE.MathUtils.lerp(fogDens, 0.015, eInt);
        dirCol.lerp(new THREE.Color(0xf59e0b), eInt * 0.8);
        dirInt *= 1 - eInt * 0.5;
      }
    }

    this.scene.background = sky;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(fog);
      this.scene.fog.density = fogDens;
    }

    this.dirLight.color.copy(dirCol);
    this.dirLight.intensity = dirInt;
    this.hemiLight.color.copy(hemiSky);
    this.hemiLight.groundColor.copy(hemiGnd);
    this.hemiLight.intensity = hemiInt;
  }

  /**
   * Road is wet if baseline weather is rainy OR if a torrential rain event is active.
   */
  public isWetRoad(): boolean {
    const isBaseRain = this.currentWeather === 'rain' || (this.targetWeather === 'rain' && this.transitionFactor > 0.4);
    const isTorrential = this.currentEventType === 'torrential_rain' && this.eventIntensity > 0.15;
    return isBaseRain || isTorrential;
  }

  /**
   * Physics traction multiplier based on weather conditions (1.0 = dry asphalt, ~0.72 = flooded downpour).
   */
  public getGripModifier(): number {
    let grip = 1.0;

    // Baseline wet road
    if (this.isWetRoad()) {
      grip *= 0.78;
    }

    // Dynamic weather event modifiers
    if (this.currentEventType === 'torrential_rain' && this.eventIntensity > 0) {
      grip *= THREE.MathUtils.lerp(1.0, 0.72, this.eventIntensity);
    } else if (this.currentEventType === 'sandstorm' && this.eventIntensity > 0) {
      grip *= THREE.MathUtils.lerp(1.0, 0.82, this.eventIntensity); // loose dust/sand on asphalt
    } else if (this.currentEventType === 'dense_fog' && this.eventIntensity > 0) {
      grip *= THREE.MathUtils.lerp(1.0, 0.90, this.eventIntensity); // condensation moisture
    }

    return grip;
  }

  /**
   * Physical lateral wind force (m/s^2) applied to the player's car during storms.
   */
  public getWindForce(): number {
    if (this.currentEventType === 'sandstorm' && this.eventIntensity > 0.05) {
      const gust = Math.sin(this.windGustPhase * 1.8) * 0.8 + Math.cos(this.windGustPhase * 3.2) * 0.4;
      return this.windDirection * (2.8 + gust) * this.eventIntensity;
    }
    if (this.currentEventType === 'torrential_rain' && this.eventIntensity > 0.1) {
      return this.windDirection * Math.sin(this.windGustPhase) * 1.2 * this.eventIntensity;
    }
    return 0;
  }

  /**
   * Telemetry object for UI / HUD consumption.
   */
  public getActiveEvent(): DynamicWeatherEvent | null {
    if (this.currentEventType === 'none' || this.eventIntensity <= 0.02) {
      return null;
    }

    const durationRemaining = Math.max(0, this.activeEventDuration - this.activeEventElapsedTime);

    return {
      type: this.currentEventType,
      name: this.getEventName(this.currentEventType),
      intensity: Number(this.eventIntensity.toFixed(2)),
      durationRemaining: Number(durationRemaining.toFixed(1)),
      description: this.getEventActiveMessage(this.currentEventType),
      gripModifier: Number(this.getGripModifier().toFixed(2)),
      windForce: Number(this.getWindForce().toFixed(2)),
    };
  }
}
