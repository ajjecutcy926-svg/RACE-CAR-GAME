import { Achievement, CarConfig, DailyChallenge, GameSettings, LevelRecord, Mission } from '../types.ts';
import { DEFAULT_ACHIEVEMENTS } from './Achievements.ts';

export const CARS_CATALOG: CarConfig[] = [
  {
    id: 'bmw_m4',
    name: 'BMW M4 Competition',
    manufacturer: 'BMW M',
    category: 'Twin-Turbo Sport Coupe',
    topSpeed: 290,
    acceleration: 15.0,
    handling: 1.05,
    nitroPower: 1.35,
    price: 0,
    unlockedByDefault: true,
    description: 'Muscular German sports coupe with iconic twin-kidney grille, carbon-fiber roof, and high-revving 503 hp inline-6 twin-turbo.',
    colors: ['#065f46', '#111111', '#f8fafc', '#dc2626', '#94a3b8', '#eab308', '#2563eb'],
    soundProfile: 'i6_turbo',
    specs: {
      horsepower: 503,
      zeroToHundred: '3.4s',
      topSpeedKmh: 290,
      weightKg: 1725,
    },
  },
  {
    id: 'mercedes_amg_gt',
    name: 'Mercedes-AMG GT',
    manufacturer: 'Mercedes-AMG',
    category: 'V8 Biturbo Luxury GT',
    topSpeed: 315,
    acceleration: 16.2,
    handling: 1.08,
    nitroPower: 1.45,
    price: 1500,
    unlockedByDefault: false,
    description: 'Aggressive Panamericana grille, long sculpted hood, and a roaring 4.0L handcrafted V8 biturbo producing 577 hp of raw torque.',
    colors: ['#94a3b8', '#111111', '#f8fafc', '#dc2626', '#064e3b', '#eab308'],
    soundProfile: 'v8_crossplane',
    specs: {
      horsepower: 577,
      zeroToHundred: '3.1s',
      topSpeedKmh: 315,
      weightKg: 1615,
    },
  },
  {
    id: 'ferrari_296',
    name: 'Ferrari 296 GTB',
    manufacturer: 'Ferrari',
    category: 'Mid-Engine Hybrid Berlinetta',
    topSpeed: 330,
    acceleration: 17.6,
    handling: 1.22,
    nitroPower: 1.52,
    price: 3200,
    unlockedByDefault: false,
    description: 'Sensual aerodynamic styling, active rear aero bridge, and a screaming 120° V6 turbo hybrid generating 819 hp of pure Maranello passion.',
    colors: ['#dc2626', '#111111', '#f8fafc', '#94a3b8', '#064e3b', '#eab308'],
    soundProfile: 'v6_turbo',
    specs: {
      horsepower: 819,
      zeroToHundred: '2.9s',
      topSpeedKmh: 330,
      weightKg: 1470,
    },
  },
  {
    id: 'mclaren_750s',
    name: 'McLaren 750S',
    manufacturer: 'McLaren',
    category: 'Ultra-Lightweight Aero Supercar',
    topSpeed: 332,
    acceleration: 18.4,
    handling: 1.26,
    nitroPower: 1.58,
    price: 4800,
    unlockedByDefault: false,
    description: 'Monocage carbon chassis, dihedral aerodynamic doors, high-mounted central exhaust, and 740 hp twin-turbo flat-plane crank V8.',
    colors: ['#f97316', '#111111', '#f8fafc', '#dc2626', '#94a3b8', '#064e3b'],
    soundProfile: 'v8_flatplane',
    specs: {
      horsepower: 740,
      zeroToHundred: '2.8s',
      topSpeedKmh: 332,
      weightKg: 1389,
    },
  },
  {
    id: 'porsche_gt3rs',
    name: 'Porsche 911 GT3 RS',
    manufacturer: 'Porsche Motorsport',
    category: 'Track-Focused Aero Weapon',
    topSpeed: 296,
    acceleration: 17.2,
    handling: 1.42,
    nitroPower: 1.42,
    price: 6500,
    unlockedByDefault: false,
    description: 'Gigantic swan-neck rear wing with active DRS, fender ventilation louvers, and a razor-sharp 9,000 RPM naturally aspirated 4.0L flat-6.',
    colors: ['#f8fafc', '#111111', '#dc2626', '#94a3b8', '#064e3b', '#10b981'],
    soundProfile: 'boxer6_na',
    specs: {
      horsepower: 518,
      zeroToHundred: '3.0s',
      topSpeedKmh: 296,
      weightKg: 1450,
    },
  },
  {
    id: 'lamborghini_revuelto',
    name: 'Lamborghini Revuelto',
    manufacturer: 'Automobili Lamborghini',
    category: 'V12 HPEV Flagship Hypercar',
    topSpeed: 350,
    acceleration: 19.8,
    handling: 1.30,
    nitroPower: 1.75,
    price: 9000,
    unlockedByDefault: false,
    description: 'Extreme stealth-fighter aerospace styling, Y-shaped signature light motifs, high-mounted hex exhausts, and 1,001 hp V12 hybrid beast.',
    colors: ['#f59e0b', '#111111', '#f8fafc', '#dc2626', '#94a3b8', '#064e3b', '#06b6d4'],
    soundProfile: 'v12_hybrid',
    specs: {
      horsepower: 1001,
      zeroToHundred: '2.5s',
      topSpeedKmh: 350,
      weightKg: 1772,
    },
  },
];

const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'high',
  soundVolume: 0.8,
  musicVolume: 0.5,
  radioStation: 'synthwave',
  radioMuted: false,
  cameraMode: 'chase-close',
  touchControls: false,
  showDiagnostics: false,
};

const DEFAULT_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'First Legend',
    description: 'Drive a total of 1,000 meters in a supercar',
    target: 1000,
    current: 0,
    rewardCoins: 400,
    completed: false,
    claimed: false,
    metric: 'distance_total',
  },
  {
    id: 'm2',
    title: 'Supercar Velocity',
    description: 'Reach a top speed of 280 km/h',
    target: 280,
    current: 0,
    rewardCoins: 800,
    completed: false,
    claimed: false,
    metric: 'speed_record',
  },
  {
    id: 'm3',
    title: 'Autobahn Master',
    description: 'Drive a total of 10,000 meters across runs',
    target: 10000,
    current: 0,
    rewardCoins: 2000,
    completed: false,
    claimed: false,
    metric: 'distance_total',
  },
  {
    id: 'm4',
    title: 'Precision Overtaker',
    description: 'Perform 20 near-miss close calls in traffic',
    target: 20,
    current: 0,
    rewardCoins: 1200,
    completed: false,
    claimed: false,
    metric: 'near_misses_total',
  },
];

export class StorageManager {
  private static STORAGE_KEY = 'road_legends_save_v2';

  public static loadData() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure default car exists in catalog
        if (parsed.selectedCar && CARS_CATALOG.some((c) => c.id === parsed.selectedCar)) {
          // Merge settings with defaults to guarantee new fields like radio are set
          parsed.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
          if (!Array.isArray(parsed.unlockedLevels) || parsed.unlockedLevels.length === 0) {
            parsed.unlockedLevels = [1];
          }
          if (!parsed.levelRecords) {
            parsed.levelRecords = {} as Record<number, LevelRecord>;
          }
          if (parsed.selectedLevel === undefined) {
            parsed.selectedLevel = 1;
          }
          if (!parsed.achievements || !Array.isArray(parsed.achievements)) {
            parsed.achievements = DEFAULT_ACHIEVEMENTS;
          } else {
            parsed.achievements = DEFAULT_ACHIEVEMENTS.map((def) => {
              const existing = parsed.achievements.find((a: any) => a.id === def.id);
              return existing ? { ...def, ...existing } : def;
            });
          }
          if (parsed.totalDraftSeconds === undefined) parsed.totalDraftSeconds = 0;
          if (parsed.totalDriftSeconds === undefined) parsed.totalDriftSeconds = 0;
          return parsed;
        }
      }
    } catch {
      // Fallback
    }

    return this.createNewSave();
  }

  public static createNewSave() {
    const data = {
      coins: 800, // Generous starter coins for supercar progression
      selectedCar: 'bmw_m4',
      carColors: {
        bmw_m4: '#065f46',
        mercedes_amg_gt: '#94a3b8',
        ferrari_296: '#dc2626',
        mclaren_750s: '#f97316',
        porsche_gt3rs: '#f8fafc',
        lamborghini_revuelto: '#f59e0b',
      },
      unlockedCars: ['bmw_m4'],
      unlockedLevels: [1],
      selectedLevel: 1,
      levelRecords: {} as Record<number, LevelRecord>,
      highScore: 0,
      bestDistance: 0,
      topSpeedRecord: 0,
      totalDistance: 0,
      totalNearMisses: 0,
      rivalsDefeated: 0,
      totalDraftSeconds: 0,
      totalDriftSeconds: 0,
      achievements: DEFAULT_ACHIEVEMENTS,
      dailyChallengesLastReset: 0,
      dailyChallenges: [] as DailyChallenge[],
      missions: DEFAULT_MISSIONS,
      settings: DEFAULT_SETTINGS,
    };

    data.dailyChallenges = this.generateDailyChallenges();
    data.dailyChallengesLastReset = Date.now();
    this.saveData(data);
    return data;
  }

  public static saveData(data: unknown) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Fallback
    }
  }

  /**
   * Evaluates if daily challenges should be regenerated (24 hours elapsed)
   */
  public static checkAndRefreshDailyChallenges(data: any): boolean {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (!data.dailyChallenges || data.dailyChallenges.length === 0 || now - data.dailyChallengesLastReset >= ONE_DAY_MS) {
      data.dailyChallenges = this.generateDailyChallenges();
      data.dailyChallengesLastReset = now;
      this.saveData(data);
      return true;
    }
    return false;
  }

  public static generateDailyChallenges(): DailyChallenge[] {
    const templates: Omit<DailyChallenge, 'current' | 'completed' | 'claimed'>[] = [
      {
        id: 'dc_dist_' + Date.now(),
        title: 'Endurance Sprint',
        description: 'Cover 3,500 meters on the open road',
        target: 3500,
        rewardCoins: 500,
        metric: 'distance',
      },
      {
        id: 'dc_speed_' + Date.now(),
        title: 'Velocity Threshold',
        description: 'Reach a top speed of 230 km/h',
        target: 230,
        rewardCoins: 450,
        metric: 'top_speed',
      },
      {
        id: 'dc_draft_' + Date.now(),
        title: 'Slipstream Stalker',
        description: 'Draft behind 2 Rival cars',
        target: 2,
        rewardCoins: 650,
        metric: 'draft_rival',
      },
      {
        id: 'dc_near_' + Date.now(),
        title: 'Threading the Needle',
        description: 'Perform 6 near-miss overtakes in heavy traffic',
        target: 6,
        rewardCoins: 550,
        metric: 'near_miss',
      },
      {
        id: 'dc_rain_' + Date.now(),
        title: 'Storm Chaser',
        description: 'Survive 1,200 meters in rain weather',
        target: 1200,
        rewardCoins: 600,
        metric: 'rain_distance',
      },
    ];

    // Pick 3 random distinct challenges
    const shuffled = [...templates].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map((t) => ({
      ...t,
      current: 0,
      completed: false,
      claimed: false,
    }));
  }
}
