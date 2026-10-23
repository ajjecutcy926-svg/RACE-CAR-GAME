import * as THREE from 'three';
import { LevelTheme, WeatherType } from '../types.ts';

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
  private rainParticles: THREE.Points | null = null;
  private rainGeo: THREE.BufferGeometry | null = null;
  private starParticles: THREE.Points | null = null;

  private isLevelFixed = false;
  private weatherCycle: WeatherType[] = ['clear', 'sunset', 'night', 'rain'];
  private cycleDistance = 1200; // transition every 1200m in endless mode

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
  }

  private initRain() {
    const rainCount = 1800;
    this.rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }

    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.2,
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

  /**
   * Configure environment weather for a specific level or theme.
   */
  public setLevelWeather(weather: WeatherType, theme: LevelTheme) {
    this.isLevelFixed = true;
    this.currentWeather = weather;
    this.targetWeather = weather;
    this.transitionFactor = 0;

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
  }

  public updateDistance(distanceMeters: number, delta: number, playerPos: THREE.Vector3) {
    if (!this.isLevelFixed) {
      // Endless mode dynamic weather cycle
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

      this.applyWeather(this.currentWeather, this.targetWeather, this.transitionFactor);
    } else {
      this.applyWeather(this.currentWeather, this.targetWeather, 0);
    }

    // Update stars follow player Z & fade in at night
    if (this.starParticles) {
      this.starParticles.position.z = playerPos.z;
      const isNight = this.currentWeather === 'night' || this.targetWeather === 'night';
      const mat = this.starParticles.material as THREE.PointsMaterial;
      const targetOpacity = isNight ? 0.85 : 0;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, targetOpacity, 2.0, delta);
      this.starParticles.visible = mat.opacity > 0.05;
    }

    // Update rain particle positions relative to player car
    if (this.rainParticles && this.rainGeo) {
      const isRaining = this.currentWeather === 'rain' || (this.targetWeather === 'rain' && this.transitionFactor > 0.2);
      this.rainParticles.visible = isRaining;

      if (isRaining) {
        this.rainParticles.position.x = playerPos.x;
        this.rainParticles.position.z = playerPos.z;

        const posAttr = this.rainGeo.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 1; i < arr.length; i += 3) {
          arr[i] -= 35 * delta;
          if (arr[i] < 0) {
            arr[i] = 25 + Math.random() * 5;
          }
        }
        posAttr.needsUpdate = true;
      }
    }
  }

  private applyWeather(from: WeatherType, to: WeatherType, t: number) {
    const fromP = this.presets[from];
    const toP = this.presets[to];

    // Lerp colors & intensities
    const sky = fromP.skyColor.clone().lerp(toP.skyColor, t);
    const fog = fromP.fogColor.clone().lerp(toP.fogColor, t);
    const fogDens = THREE.MathUtils.lerp(fromP.fogDensity, toP.fogDensity, t);

    const dirCol = fromP.dirLightColor.clone().lerp(toP.dirLightColor, t);
    const dirInt = THREE.MathUtils.lerp(fromP.dirLightIntensity, toP.dirLightIntensity, t);

    const hemiSky = fromP.hemiSkyColor.clone().lerp(toP.hemiSkyColor, t);
    const hemiGnd = fromP.hemiGroundColor.clone().lerp(toP.hemiGroundColor, t);
    const hemiInt = THREE.MathUtils.lerp(fromP.hemiIntensity, toP.hemiIntensity, t);

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

  public isWetRoad(): boolean {
    return this.currentWeather === 'rain' || (this.targetWeather === 'rain' && this.transitionFactor > 0.4);
  }
}
