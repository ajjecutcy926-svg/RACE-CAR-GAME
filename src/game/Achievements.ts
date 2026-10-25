import { Achievement } from '../types.ts';

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_draft_100',
    title: 'Slipstream Master',
    description: 'Draft behind rival traffic for 100 seconds',
    icon: '⚡',
    category: 'draft',
    target: 100,
    current: 0,
    unit: 's',
    rewardCoins: 1500,
    unlocked: false,
  },
  {
    id: 'ach_speed_300',
    title: 'Mach Velocity',
    description: 'Reach a blistering top speed of 300 KPH',
    icon: '🏎️',
    category: 'speed',
    target: 300,
    current: 0,
    unit: 'KPH',
    rewardCoins: 1200,
    unlocked: false,
  },
  {
    id: 'ach_draft_30',
    title: 'Slipstream Stalker',
    description: 'Draft in the slipstream for 30 seconds',
    icon: '⚡',
    category: 'draft',
    target: 30,
    current: 0,
    unit: 's',
    rewardCoins: 600,
    unlocked: false,
  },
  {
    id: 'ach_speed_250',
    title: 'High Velocity',
    description: 'Reach 250 KPH on the open road',
    icon: '💨',
    category: 'speed',
    target: 250,
    current: 0,
    unit: 'KPH',
    rewardCoins: 500,
    unlocked: false,
  },
  {
    id: 'ach_dist_5k',
    title: 'Highway Cruiser',
    description: 'Travel a total distance of 5,000 meters',
    icon: '🛣️',
    category: 'distance',
    target: 5000,
    current: 0,
    unit: 'm',
    rewardCoins: 750,
    unlocked: false,
  },
  {
    id: 'ach_dist_25k',
    title: 'Road Legend',
    description: 'Travel a total distance of 25,000 meters',
    icon: '🌐',
    category: 'distance',
    target: 25000,
    current: 0,
    unit: 'm',
    rewardCoins: 2500,
    unlocked: false,
  },
  {
    id: 'ach_near_miss_20',
    title: 'Needle Threader',
    description: 'Execute 20 close-call near misses in traffic',
    icon: '🎯',
    category: 'skills',
    target: 20,
    current: 0,
    unit: 'times',
    rewardCoins: 800,
    unlocked: false,
  },
  {
    id: 'ach_combo_5',
    title: 'Combo King',
    description: 'Chain a 5x near-miss combo streak without crashing',
    icon: '🔥',
    category: 'skills',
    target: 5,
    current: 0,
    unit: 'combo',
    rewardCoins: 1000,
    unlocked: false,
  },
  {
    id: 'ach_drift_30',
    title: 'Tarmac Sculptor',
    description: 'Drift for 30 seconds across all sessions',
    icon: '🌪️',
    category: 'skills',
    target: 30,
    current: 0,
    unit: 's',
    rewardCoins: 900,
    unlocked: false,
  },
  {
    id: 'ach_rivals_3',
    title: 'Rival Hunter',
    description: 'Overtake and defeat 3 Rival racers in duels',
    icon: '👑',
    category: 'career',
    target: 3,
    current: 0,
    unit: 'rivals',
    rewardCoins: 1500,
    unlocked: false,
  },
  {
    id: 'ach_stage_5',
    title: 'Midway Champion',
    description: 'Conquer and complete Stage 5',
    icon: '🏁',
    category: 'career',
    target: 5,
    current: 0,
    unit: 'stages',
    rewardCoins: 2000,
    unlocked: false,
  },
  {
    id: 'ach_garage_3',
    title: 'Supercar Collector',
    description: 'Unlock and own at least 3 supercars',
    icon: '🏆',
    category: 'career',
    target: 3,
    current: 0,
    unit: 'cars',
    rewardCoins: 2500,
    unlocked: false,
  },
];

export interface AchievementEvaluationInput {
  currentSpeedKmh: number;
  runDraftSeconds: number;
  totalDraftSeconds: number;
  totalDriftSeconds: number;
  nearMissCombo: number;
  totalNearMisses: number;
  totalDistance: number;
  rivalsDefeated: number;
  completedStagesCount: number;
  unlockedCarsCount: number;
}

/**
 * Checks all milestone achievements against latest telemetry & career stats.
 * Returns newly unlocked achievements and the updated achievement list.
 */
export function evaluateAchievements(
  currentAchievements: Achievement[],
  stats: AchievementEvaluationInput
): { updatedAchievements: Achievement[]; newlyUnlocked: Achievement[] } {
  const newlyUnlocked: Achievement[] = [];

  const updatedAchievements = currentAchievements.map((ach) => {
    if (ach.unlocked) return ach; // Already unlocked

    let newCurrent = ach.current;

    switch (ach.id) {
      case 'ach_speed_300':
      case 'ach_speed_250':
        newCurrent = Math.max(ach.current, Math.floor(stats.currentSpeedKmh));
        break;

      case 'ach_draft_100':
      case 'ach_draft_30':
        // Max between career draft total and current session draft
        newCurrent = Math.max(ach.current, Math.floor(Math.max(stats.totalDraftSeconds, stats.runDraftSeconds)));
        break;

      case 'ach_dist_5k':
      case 'ach_dist_25k':
        newCurrent = Math.max(ach.current, Math.floor(stats.totalDistance));
        break;

      case 'ach_near_miss_20':
        newCurrent = Math.max(ach.current, stats.totalNearMisses);
        break;

      case 'ach_combo_5':
        newCurrent = Math.max(ach.current, stats.nearMissCombo);
        break;

      case 'ach_drift_30':
        newCurrent = Math.max(ach.current, Math.floor(stats.totalDriftSeconds));
        break;

      case 'ach_rivals_3':
        newCurrent = Math.max(ach.current, stats.rivalsDefeated);
        break;

      case 'ach_stage_5':
        newCurrent = Math.max(ach.current, stats.completedStagesCount);
        break;

      case 'ach_garage_3':
        newCurrent = Math.max(ach.current, stats.unlockedCarsCount);
        break;

      default:
        break;
    }

    if (newCurrent >= ach.target && !ach.unlocked) {
      const unlockedAch: Achievement = {
        ...ach,
        current: ach.target,
        unlocked: true,
        unlockedAt: Date.now(),
        claimed: true, // Coins granted on unlock
      };
      newlyUnlocked.push(unlockedAch);
      return unlockedAch;
    }

    return {
      ...ach,
      current: newCurrent,
    };
  });

  return { updatedAchievements, newlyUnlocked };
}
