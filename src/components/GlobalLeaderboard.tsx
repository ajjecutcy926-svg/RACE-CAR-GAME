import React, { useState, useEffect } from 'react';
import { Award, Compass, Edit3, Flame, Gauge, Globe2, RefreshCw, Trophy, Users, X, Zap } from 'lucide-react';
import { LeaderboardRecord, LeaderboardResponse } from '../types.ts';

interface GlobalLeaderboardProps {
  onClose: () => void;
  playerBestScore: number;
  playerBestDistance: number;
  playerTopSpeed: number;
  pendingSubmission?: {
    score: number;
    distance: number;
    topSpeed: number;
    carName: string;
  } | null;
  onSubmissionComplete?: () => void;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  onClose,
  playerBestScore,
  playerBestDistance,
  playerTopSpeed,
  pendingSubmission,
  onSubmissionComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'score' | 'distance' | 'speed'>('score');
  const [records, setRecords] = useState<LeaderboardRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Player handle
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('road_legends_player_name') || 'LEGEND_RACER';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  const fetchLeaderboard = async (sortBy: 'score' | 'distance' | 'speed') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaderboard?sortBy=${sortBy}&limit=50`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data: LeaderboardResponse = await res.json();
      if (data.success) {
        setRecords(data.records);
      } else {
        setError('Failed to load global standings');
      }
    } catch (err: any) {
      console.error('Leaderboard fetch error:', err);
      setError('Unable to connect to leaderboard service');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  const handleSaveName = () => {
    const trimmed = nameInput.trim().toUpperCase().replace(/[^A-Z0-9_\-\s]/g, '').slice(0, 16);
    const validName = trimmed || 'LEGEND_RACER';
    setPlayerName(validName);
    localStorage.setItem('road_legends_player_name', validName);
    setIsEditingName(false);
  };

  const handleSubmitScore = async () => {
    if (!pendingSubmission) return;
    setIsSubmitting(true);
    setSubmissionFeedback(null);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          carName: pendingSubmission.carName,
          score: pendingSubmission.score,
          distance: pendingSubmission.distance,
          topSpeed: pendingSubmission.topSpeed,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedId(data.record.id);
        setSubmissionFeedback(`★ RANK #${data.ranks.scoreRank} WORLDWIDE! ★`);
        fetchLeaderboard(activeTab);
        if (onSubmissionComplete) {
          onSubmissionComplete();
        }
      } else {
        setSubmissionFeedback('Submission error. Please try again.');
      }
    } catch {
      setSubmissionFeedback('Failed to connect to leaderboard service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-racing font-black text-xs shadow-md">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 font-racing font-black text-xs shadow-md">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-amber-600 to-orange-700 text-white font-racing font-black text-xs shadow-md">
          3
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-slate-400 font-racing font-bold text-xs">
        {rank}
      </span>
    );
  };

  const formatDistance = (m: number) => `${(m / 1000).toFixed(2)} KM`;
  const formatSpeed = (s: number) => `${s} KM/H`;
  const formatTimeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Globe2 className="w-6 h-6 text-cyan-400 animate-pulse" />
            <div>
              <h2 className="font-racing text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                GLOBAL LEADERBOARD
              </h2>
              <p className="text-xs text-slate-400 font-semibold">Live world rankings & records across all drivers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLeaderboard(activeTab)}
              disabled={isLoading}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              title="Refresh Leaderboard"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player Profile & Stats Banner */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">CALLSIGN:</span>
            {isEditingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={16}
                  className="bg-slate-900 border border-cyan-500 rounded px-2 py-0.5 text-xs font-racing font-bold text-cyan-300 uppercase w-32 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="px-2 py-0.5 bg-cyan-500 text-slate-950 rounded text-xs font-racing font-black cursor-pointer"
                >
                  SAVE
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setNameInput(playerName);
                  setIsEditingName(true);
                }}
                className="flex items-center gap-1.5 font-racing font-black text-sm text-cyan-400 hover:text-cyan-300 transition cursor-pointer group"
              >
                <span>{playerName}</span>
                <Edit3 className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
              </button>
            )}
          </div>

          {/* Player Personal Best Highlights */}
          <div className="flex items-center gap-4 text-xs font-racing">
            <div>
              <span className="text-slate-500 text-[10px] block">BEST SCORE</span>
              <span className="text-amber-400 font-black tabular-nums">{playerBestScore.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">MAX DISTANCE</span>
              <span className="text-slate-200 font-bold tabular-nums">{(playerBestDistance / 1000).toFixed(2)} km</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">TOP SPEED</span>
              <span className="text-cyan-400 font-black tabular-nums">{playerTopSpeed} km/h</span>
            </div>
          </div>
        </div>

        {/* Pending Run Submission Banner (if active) */}
        {pendingSubmission && !submittedId && (
          <div className="p-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border-b border-amber-500/40 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-racing font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" /> RECENT RUN AVAILABLE FOR SUBMISSION
              </span>
              <div className="text-xs text-slate-200 font-semibold mt-0.5">
                Score: <strong className="text-amber-300 font-racing">{pendingSubmission.score.toLocaleString()}</strong> ·
                Dist: <strong className="text-slate-100 font-racing">{(pendingSubmission.distance / 1000).toFixed(2)} km</strong> ·
                Speed: <strong className="text-cyan-300 font-racing">{pendingSubmission.topSpeed} km/h</strong>
              </div>
            </div>

            <button
              onClick={handleSubmitScore}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-racing font-black text-xs tracking-wider transition cursor-pointer shadow-lg shadow-amber-500/20 shrink-0"
            >
              {isSubmitting ? 'UPLOADING...' : 'POST RECORD'}
            </button>
          </div>
        )}

        {submissionFeedback && (
          <div className="p-2.5 bg-emerald-950/80 border-b border-emerald-500 text-emerald-300 text-xs font-racing font-bold text-center animate-pulse">
            {submissionFeedback}
          </div>
        )}

        {/* Tab Navigation: Score / Distance / Speed */}
        <div className="flex border-b border-slate-800 bg-slate-950">
          <button
            onClick={() => setActiveTab('score')}
            className={`flex-1 py-3 text-xs font-racing font-black tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === 'score'
                ? 'border-amber-400 text-amber-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" /> TOP SCORES
          </button>

          <button
            onClick={() => setActiveTab('distance')}
            className={`flex-1 py-3 text-xs font-racing font-black tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === 'distance'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" /> LONGEST DISTANCE
          </button>

          <button
            onClick={() => setActiveTab('speed')}
            className={`flex-1 py-3 text-xs font-racing font-black tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === 'speed'
                ? 'border-red-400 text-red-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-4 h-4" /> TOP VELOCITY
          </button>
        </div>

        {/* Leaderboard Table List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
              <span className="font-racing text-xs tracking-wider">SYNCING GLOBAL STANDINGS...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <p className="text-sm font-semibold text-red-400">{error}</p>
              <button
                onClick={() => fetchLeaderboard(activeTab)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-racing font-bold cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-racing text-sm">
              NO GLOBAL RECORDS RECORDED YET. BE THE FIRST!
            </div>
          ) : (
            records.map((entry, idx) => {
              const rank = idx + 1;
              const isPlayer = entry.playerName === playerName || entry.id === submittedId;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isPlayer
                      ? 'bg-cyan-950/40 border-cyan-500/70 shadow-lg shadow-cyan-500/10'
                      : rank <= 3
                      ? 'bg-slate-950/80 border-slate-800'
                      : 'bg-slate-950/50 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  {/* Left: Rank, Player Name, Car, Country */}
                  <div className="flex items-center gap-3">
                    {getRankBadge(rank)}

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-racing font-black text-sm tracking-wide ${
                            isPlayer ? 'text-cyan-300' : 'text-slate-100'
                          }`}
                        >
                          {entry.playerName}
                        </span>
                        {isPlayer && (
                          <span className="bg-cyan-500/20 text-cyan-400 text-[9px] font-racing font-black px-1.5 py-0.2 rounded border border-cyan-500/40">
                            YOU
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded text-slate-400 font-bold">
                          {entry.country}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="text-slate-300 font-semibold">{entry.carName}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(entry.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Key metric according to active tab */}
                  <div className="flex flex-col items-end">
                    {activeTab === 'score' && (
                      <>
                        <span className="font-racing text-base sm:text-lg font-black text-amber-400 tabular-nums">
                          {entry.score.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {formatDistance(entry.distance)} · {formatSpeed(entry.topSpeed)}
                        </span>
                      </>
                    )}

                    {activeTab === 'distance' && (
                      <>
                        <span className="font-racing text-base sm:text-lg font-black text-cyan-400 tabular-nums">
                          {formatDistance(entry.distance)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {entry.score.toLocaleString()} pts · {formatSpeed(entry.topSpeed)}
                        </span>
                      </>
                    )}

                    {activeTab === 'speed' && (
                      <>
                        <span className="font-racing text-base sm:text-lg font-black text-red-400 tabular-nums">
                          {formatSpeed(entry.topSpeed)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {entry.score.toLocaleString()} pts · {formatDistance(entry.distance)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Showing Top {records.length} Drivers Worldwide
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-racing font-bold text-xs tracking-wider transition cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
