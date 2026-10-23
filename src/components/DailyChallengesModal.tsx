import React, { useState, useEffect } from 'react';
import { Award, Calendar, Check, Clock, Trophy, X } from 'lucide-react';
import { DailyChallenge, Mission } from '../types.ts';

interface DailyChallengesModalProps {
  challenges: DailyChallenge[];
  missions: Mission[];
  lastResetTime: number;
  onClaimDailyChallenge: (id: string) => void;
  onClaimMission: (id: string) => void;
  onClose: () => void;
}

export const DailyChallengesModal: React.FC<DailyChallengesModalProps> = ({
  challenges,
  missions,
  lastResetTime,
  onClaimDailyChallenge,
  onClaimMission,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'missions'>('daily');
  const [timeRemaining, setTimeRemaining] = useState('');

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

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/85 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="font-racing text-2xl font-black text-slate-100">OBJECTIVES & TRIALS</h2>
            <p className="text-xs text-slate-400 font-semibold">Complete distance, speed, and rival challenges for coins</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & 24h Countdown */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-racing font-bold tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> DAILY CHALLENGES
            </button>
            <button
              onClick={() => setActiveTab('missions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-racing font-bold tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'missions'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> CAREER MISSIONS
            </button>
          </div>

          {activeTab === 'daily' && (
            <div className="flex items-center gap-1 text-[11px] font-racing text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Resets in: <strong className="text-amber-300">{timeRemaining}</strong></span>
            </div>
          )}
        </div>

        {/* Challenge List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {activeTab === 'daily' ? (
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

                  {/* Action */}
                  {item.claimed ? (
                    <div className="text-xs font-racing font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> REWARD CLAIMED
                    </div>
                  ) : canClaim ? (
                    <button
                      onClick={() => onClaimDailyChallenge(item.id)}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-racing font-black text-xs tracking-wider transition cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      CLAIM {item.rewardCoins} COINS
                    </button>
                  ) : null}
                </div>
              );
            })
          ) : (
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
            })
          )}
        </div>
      </div>
    </div>
  );
};
