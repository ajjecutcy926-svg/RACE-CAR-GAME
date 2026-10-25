import React, { useState, useEffect } from 'react';
import { Award, Calendar, Check, Clock, Lock, Sparkles, Trophy, X } from 'lucide-react';
import { Achievement, AchievementCategory, DailyChallenge, Mission } from '../types.ts';

interface DailyChallengesModalProps {
  challenges: DailyChallenge[];
  missions: Mission[];
  achievements?: Achievement[];
  lastResetTime: number;
  initialTab?: 'daily' | 'missions' | 'achievements';
  onClaimDailyChallenge: (id: string) => void;
  onClaimMission: (id: string) => void;
  onClose: () => void;
}

export const DailyChallengesModal: React.FC<DailyChallengesModalProps> = ({
  challenges,
  missions,
  achievements = [],
  lastResetTime,
  initialTab = 'daily',
  onClaimDailyChallenge,
  onClaimMission,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'missions' | 'achievements'>(initialTab);
  const [achievementCategory, setAchievementCategory] = useState<AchievementCategory | 'all'>('all');
  const [timeRemaining, setTimeRemaining] = useState('');

  const unlockedAchievementsCount = achievements.filter((a) => a.unlocked).length;

  useEffect(() => {
    const updateCountdown = () => {
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const nextReset = lastResetTime + ONE_DAY_MS;
      const diff = Math.max(0, nextReset - Date.now());

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${mins}m ${secs}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastResetTime]);

  const filteredAchievements = achievements.filter((ach) => {
    if (achievementCategory === 'all') return true;
    return ach.category === achievementCategory;
  });

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/85 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="font-racing text-2xl font-black text-slate-100">OBJECTIVES & ACHIEVEMENTS</h2>
            <p className="text-xs text-slate-400 font-semibold">
              Milestone achievements, career progression, and daily trials
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & 24h Countdown */}
        <div className="flex flex-wrap items-center justify-between px-5 py-2.5 bg-slate-950 border-b border-slate-800 gap-2">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-3 py-1.5 rounded-lg text-xs font-racing font-bold tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'achievements'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>ACHIEVEMENTS</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/30 font-mono font-bold">
                {unlockedAchievementsCount}/{achievements.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-racing font-bold tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> DAILY
            </button>

            <button
              onClick={() => setActiveTab('missions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-racing font-bold tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'missions'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> MISSIONS
            </button>
          </div>

          {activeTab === 'daily' && (
            <div className="flex items-center gap-1 text-[11px] font-racing text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Resets in: <strong className="text-amber-300">{timeRemaining}</strong></span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {/* TAB 1: MILESTONE ACHIEVEMENTS */}
          {activeTab === 'achievements' && (
            <div className="space-y-3">
              {/* Overall Progress Banner */}
              <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-cyan-950/60 border border-amber-500/40 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                    <span className="font-racing font-black text-xs sm:text-sm text-slate-100 uppercase tracking-wider">
                      MILESTONES UNLOCKED
                    </span>
                  </div>
                  <span className="font-racing font-black text-amber-300 text-sm">
                    {unlockedAchievementsCount} / {achievements.length} ({Math.round((unlockedAchievementsCount / Math.max(1, achievements.length)) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-cyan-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${(unlockedAchievementsCount / Math.max(1, achievements.length)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Category Filter Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(['all', 'speed', 'draft', 'skills', 'distance', 'career'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAchievementCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-racing font-bold tracking-wider uppercase transition cursor-pointer border ${
                      achievementCategory === cat
                        ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-md'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Achievement Cards */}
              <div className="space-y-2.5">
                {filteredAchievements.map((ach) => {
                  const progressPct = Math.min(100, Math.round((ach.current / ach.target) * 100));

                  return (
                    <div
                      key={ach.id}
                      className={`rounded-2xl p-3.5 sm:p-4 border transition-all ${
                        ach.unlocked
                          ? 'bg-slate-950/90 border-amber-500/50 shadow-md shadow-amber-500/10'
                          : 'bg-slate-950/50 border-slate-800/80 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                              ach.unlocked
                                ? 'bg-gradient-to-br from-amber-500/30 to-yellow-600/20 border-amber-400/60 shadow-lg shadow-amber-500/20'
                                : 'bg-slate-900 border-slate-800 text-slate-600'
                            }`}
                          >
                            {ach.unlocked ? ach.icon : <Lock className="w-5 h-5 text-slate-500" />}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4
                                className={`font-racing font-bold text-sm ${
                                  ach.unlocked ? 'text-amber-200' : 'text-slate-200'
                                }`}
                              >
                                {ach.title}
                              </h4>
                              {ach.unlocked && (
                                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-racing font-black px-1.5 py-0.2 rounded-full uppercase">
                                  COMPLETED
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{ach.description}</p>
                          </div>
                        </div>

                        {/* Reward */}
                        <div
                          className={`flex items-center gap-1 font-racing font-black text-xs px-2 py-1 rounded-lg shrink-0 border ${
                            ach.unlocked
                              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                              : 'bg-yellow-950/40 border-yellow-800/40 text-yellow-300'
                          }`}
                        >
                          <span>+{ach.rewardCoins.toLocaleString()}</span>
                          <span>🪙</span>
                        </div>
                      </div>

                      {/* Progress Bar & Numeric Status */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              ach.unlocked
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-400'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-racing text-slate-400 tabular-nums shrink-0">
                          {ach.current.toLocaleString()} / {ach.target.toLocaleString()} {ach.unit} ({progressPct}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DAILY CHALLENGES */}
          {activeTab === 'daily' &&
            challenges.map((item) => {
              const progressPct = Math.min(100, Math.round((item.current / item.target) * 100));
              const canClaim = item.completed && !item.claimed;

              return (
                <div
                  key={item.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-racing font-bold text-sm text-slate-100 flex items-center gap-2">
                        {item.title}
                        {item.completed && <Award className="w-4 h-4 text-yellow-400" />}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-300 font-racing font-black text-sm bg-yellow-950/50 border border-yellow-800/50 px-2.5 py-1 rounded-lg">
                      <span>+{item.rewardCoins}</span>
                      <span>🪙</span>
                    </div>
                  </div>

                  {/* Progress Bar & Status */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-racing text-slate-400 tabular-nums">
                      {item.current} / {item.target}
                    </span>
                  </div>

                  {item.claimed ? (
                    <div className="text-xs font-racing font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> COMPLETED & CLAIMED
                    </div>
                  ) : canClaim ? (
                    <button
                      onClick={() => onClaimDailyChallenge(item.id)}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-racing font-black text-xs tracking-wider transition cursor-pointer shadow-lg"
                    >
                      CLAIM {item.rewardCoins} COINS
                    </button>
                  ) : null}
                </div>
              );
            })}

          {/* TAB 3: CAREER MISSIONS */}
          {activeTab === 'missions' &&
            missions.map((m) => {
              const progressPct = Math.min(100, Math.round((m.current / m.target) * 100));
              const canClaim = m.completed && !m.claimed;

              return (
                <div
                  key={m.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-racing font-bold text-sm text-slate-100 flex items-center gap-2">
                        {m.title}
                        {m.completed && <Award className="w-4 h-4 text-yellow-400" />}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-300 font-racing font-black text-sm bg-yellow-950/50 border border-yellow-800/50 px-2.5 py-1 rounded-lg">
                      <span>+{m.rewardCoins}</span>
                      <span>🪙</span>
                    </div>
                  </div>

                  {/* Progress Bar & Status */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-racing text-slate-400 tabular-nums">
                      {m.current} / {m.target}
                    </span>
                  </div>

                  {m.claimed ? (
                    <div className="text-xs font-racing font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> COMPLETED & CLAIMED
                    </div>
                  ) : canClaim ? (
                    <button
                      onClick={() => onClaimMission(m.id)}
                      className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-racing font-black text-xs tracking-wider transition cursor-pointer shadow-lg"
                    >
                      CLAIM {m.rewardCoins} COINS
                    </button>
                  ) : null}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
