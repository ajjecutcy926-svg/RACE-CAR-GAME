export type WeatherType = 'clear' | 'sunset' | 'rain' | 'night';

export type DynamicWeatherEventType = 'none' | 'dense_fog' | 'torrential_rain' | 'sandstorm';

export interface DynamicWeatherEvent {
  type: DynamicWeatherEventType;
  name: string;
  intensity: number; // 0 to 1
  durationRemaining: number;
  description: string;
  gripModifier: number; // e.g. 0.70 to 1.0
  windForce: number; // lateral wind drift in m/s^2
}

export type LevelTheme =
  | 'highway'
  | 'city'
  | 'mountain'
  | 'desert'
  | 'night_city'
  | 'rainy'
  | 'coastal'
  | 'heavy_traffic'
  | 'sunset_supercar'
  | 'pro_championship';

export interface LevelConfig {
  id: number; // 1-10 (0 for endless)
  name: string;
  subtitle: string;
  description: string;
  targetDistance: number; // in meters (0 for endless)
  targetTimeSeconds: number; // benchmark for 3-star time
  theme: LevelTheme;
  weather: WeatherType;
  trafficDensity: number; // 0.5 (light) to 1.8 (very dense)
  trafficSpeedKmh: [number, number]; // [min, max]
  rivalAllowed: boolean;
  rewardCoins: number;
  starScoreThresholds: [number, number, number]; // [1-star, 2-star, 3-star]
}

export interface LevelRecord {
  completed: boolean;
  stars: number; // 0 to 3
  bestTimeSeconds: number;
  highScore: number;
}

export interface LevelCompleteSummary {
  levelId: number;
  levelName: string;
  stars: number;
  timeSeconds: number;
  formattedTime?: string;
  distance: number;
  topSpeed: number;
  nearMisses: number;
  overtakes?: number;
  finishPosition?: number;
  totalRacers?: number;
  cleanDrivingBonus?: number;
  score: number;
  coinsEarned: number;
  isNewBest: boolean;
  unlockedNextLevel: boolean;
}

export interface CarConfig {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  topSpeed: number;     // max km/h
  acceleration: number; // m/s^2 factor
  handling: number;     // turn responsiveness
  nitroPower: number;   // boost multiplier
  price: number;        // coin cost
  unlockedByDefault: boolean;
  description: string;
  colors: string[];
  soundProfile: 'i6_turbo' | 'v12_hybrid' | 'v6_turbo' | 'v8_flatplane' | 'boxer6_na' | 'v8_crossplane';
  specs: {
    horsepower: number;
    zeroToHundred: string;
    topSpeedKmh: number;
    weightKg: number;
  };
}

export interface RearThreat {
  id: number;
  lane: 'left' | 'center-left' | 'center-right' | 'right';
  laneIndex: number;
  distanceMeters: number;
  relativeSpeedKmh: number; // positive = closing in, negative = falling behind
  isApproaching: boolean;
  isCritical: boolean;
  vehicleType: 'sedan' | 'suv' | 'truck' | 'sports' | 'rival';
  lateralOffset: number; // relative to player car X
}

export interface PlayerCarState {
  speedKmh: number;
  rpm: number;
  gear: number | 'R' | 'N';
  throttle: number;
  brake: number;
  steer: number;
  isDrifting: boolean;
  isNitroActive: boolean;
  nitroGauge: number;    // 0 to 100
  distanceMeters: number;
  score: number;
  coinsEarned: number;
  health: number;        // 0 to 100
  nearMissCombo: number;
  isDrafting: boolean;
  draftTime: number;
  rivalActive: boolean;
  rivalAheadDist: number | null;
  currentWeather: WeatherType;
  weatherProgress: number; // 0 to 1 transition progress
  // Level & Checkpoint Telemetry
  levelId: number;
  levelName: string;
  targetDistance: number;
  levelProgressPercent: number;
  isInvulnerable: boolean;
  lastCheckpointDist: number;
  elapsedTimeSeconds: number;
  // Rear Proximity & Blind Spot Detection
  rearThreats: RearThreat[];
  criticalRearThreat: RearThreat | null;
  // Dynamic Weather Event Telemetry
  activeWeatherEvent: DynamicWeatherEvent | null;
  // Real-Time Engine Diagnostics
  diagnostics?: EngineDiagnostics;
}

export interface EngineDiagnostics {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  gpuMemoryMb: number;
  jsHeapMb?: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
  metric: 'distance' | 'top_speed' | 'draft_rival' | 'near_miss' | 'rain_distance';
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
  metric: 'distance_total' | 'coins_total' | 'speed_record' | 'near_misses_total';
}

export type AchievementCategory = 'speed' | 'draft' | 'distance' | 'skills' | 'career';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  target: number;
  current: number;
  unit: string;
  rewardCoins: number;
  unlocked: boolean;
  unlockedAt?: number;
  claimed?: boolean;
}

export type RadioStationId = 'synthwave' | 'darksynth' | 'eurobeat' | 'chillwave' | 'off';

export interface RadioStation {
  id: RadioStationId;
  name: string;
  frequency: string;
  genre: string;
  description: string;
  bpm: number;
  accentColor: string;
}

export interface GameSettings {
  graphicsQuality: 'low' | 'med' | 'high';
  soundVolume: number;
  musicVolume: number;
  radioStation: RadioStationId;
  radioMuted: boolean;
  cameraMode: 'chase-close' | 'chase-far' | 'cockpit';
  touchControls: boolean;
  showDiagnostics?: boolean;
}

export interface GameSummary {
  distance: number;
  topSpeed: number;
  nearMisses: number;
  draftTimeSeconds: number;
  coinsEarned: number;
  score: number;
  isNewRecord: boolean;
  cause: 'collision' | 'finished';
  levelId?: number;
}

export interface LeaderboardRecord {
  id: string;
  playerName: string;
  carName: string;
  score: number;
  distance: number; // in meters
  topSpeed: number; // in km/h
  timestamp: number;
  country: string;
}

export interface LeaderboardResponse {
  success: boolean;
  sortBy: 'score' | 'distance' | 'speed';
  totalRecords: number;
  records: LeaderboardRecord[];
}
