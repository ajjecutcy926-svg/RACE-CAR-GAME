import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine.ts';
import { CARS_CATALOG, StorageManager } from './game/Storage.ts';
import { getLevelConfig } from './game/LevelConfig.ts';
import { soundManager } from './audio/SoundEngine.ts';
import { CarConfig, GameSettings, GameSummary, LevelCompleteSummary, PlayerCarState } from './types.ts';
import { HUD } from './components/HUD.tsx';
import { MobileControls } from './components/MobileControls.tsx';
import { StartMenu } from './components/StartMenu.tsx';
import { GarageModal } from './components/GarageModal.tsx';
import { DailyChallengesModal } from './components/DailyChallengesModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { PauseModal } from './components/PauseModal.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { GlobalLeaderboard } from './components/GlobalLeaderboard.tsx';
import { PhotoMode } from './components/PhotoMode.tsx';
import { LevelSelectModal } from './components/LevelSelectModal.tsx';
import { LevelCompleteModal } from './components/LevelCompleteModal.tsx';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"
type GameMode = 'menu' | 'playing' | 'paused' | 'gameover' | 'photo';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Persistent save data
  const [saveData, setSaveData] = useState(() => StorageManager.loadData());
  const [currentCarConfig, setCurrentCarConfig] = useState<CarConfig>(() => {
    const saved = StorageManager.loadData();
    return CARS_CATALOG.find((c) => c.id === saved.selectedCar) || CARS_CATALOG[0];
  });
  const [carColor, setCarColor] = useState<string>(() => {
    const saved = StorageManager.loadData();
    return saved.carColors?.[saved.selectedCar] || '#ef4444';
  });

  // Current Level selection
  const [selectedLevelId, setSelectedLevelId] = useState<number>(() => {
    const saved = StorageManager.loadData();
    return saved.selectedLevel !== undefined ? saved.selectedLevel : 1;
  });

  // UI state
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [playerState, setPlayerState] = useState<PlayerCarState | null>(null);
  const [gameSummary, setGameSummary] = useState<GameSummary | null>(null);
  const [levelCompleteSummary, setLevelCompleteSummary] = useState<LevelCompleteSummary | null>(null);
  const [popupMessage, setPopupMessage] = useState<{ text: string; type: string } | null>(null);

  // Active Modals from Menu
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState(false);
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Pending run for leaderboard submission
  const [pendingSubmission, setPendingSubmission] = useState<{
    score: number;
    distance: number;
    topSpeed: number;
    carName: string;
  } | null>(null);

  // Audio mute
  const [isMuted, setIsMuted] = useState(false);

  // Touch device detection
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Initialize GameEngine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    // Refresh daily challenges if 24 hours have passed
    StorageManager.checkAndRefreshDailyChallenges(saveData);

    const initialLevel = getLevelConfig(selectedLevelId);

    const engine = new GameEngine(
      canvasMountRef.current,
      currentCarConfig,
      carColor,
      saveData.settings,
      (state) => {
        setPlayerState(state);
      },
      (summary) => {
        handleGameOver(summary);
      },
      (text, type) => {
        setPopupMessage({ text, type });
        setTimeout(() => setPopupMessage(null), 2500);
      },
      (completeSummary) => {
        handleLevelComplete(completeSummary);
      }
    );

    engine.setLevel(initialLevel);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update volume & settings on engine
  useEffect(() => {
    soundManager.setSoundVolume(saveData.settings.soundVolume);
    soundManager.setMusicVolume(saveData.settings.musicVolume);
    soundManager.setRadioStation(saveData.settings.radioStation);
    soundManager.setRadioMuted(saveData.settings.radioMuted);
    soundManager.setMuted(isMuted);
    engineRef.current?.setQuality(saveData.settings.graphicsQuality);
    engineRef.current?.setCameraMode(saveData.settings.cameraMode);
  }, [saveData.settings, isMuted]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (gameMode === 'playing') {
          handlePause();
        } else if (gameMode === 'paused') {
          handleResume();
        } else if (gameMode === 'photo') {
          handleExitPhotoMode();
        } else if (isGarageOpen || isLevelSelectOpen || isChallengesOpen || isLeaderboardOpen || isSettingsOpen) {
          setIsGarageOpen(false);
          setIsLevelSelectOpen(false);
          setIsChallengesOpen(false);
          setIsLeaderboardOpen(false);
          setIsSettingsOpen(false);
        }
      } else if (e.code === 'KeyP') {
        if (gameMode === 'playing' || gameMode === 'paused') {
          handleEnterPhotoMode();
        } else if (gameMode === 'photo') {
          handleExitPhotoMode();
        }
      } else if (e.code === 'KeyR') {
        handleCycleRadio();
      } else if (
        (e.code === 'Enter' || e.code === 'Space') &&
        gameMode === 'menu' &&
        !isGarageOpen &&
        !isLevelSelectOpen &&
        !isChallengesOpen &&
        !isLeaderboardOpen &&
        !isSettingsOpen
      ) {
        handlePlay();
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [gameMode, isGarageOpen, isLevelSelectOpen, isChallengesOpen, isLeaderboardOpen, isSettingsOpen, saveData.settings]);

  const handlePlay = () => {
    setGameMode('playing');
    setGameSummary(null);
    setLevelCompleteSummary(null);
    engineRef.current?.start();
  };

  const handlePause = () => {
    setGameMode('paused');
    engineRef.current?.pause();
  };

  const handleResume = () => {
    setGameMode('playing');
    engineRef.current?.resume();
  };

  const handleEnterPhotoMode = () => {
    setGameMode('photo');
    engineRef.current?.enterPhotoMode();
  };

  const handleExitPhotoMode = () => {
    engineRef.current?.exitPhotoMode();
    setGameMode('playing');
  };

  /**
   * RESPAWN AT CHECKPOINT:
   * Continues current attempt from safe road coordinates with ghost shield
   */
  const handleRespawnAtCheckpoint = () => {
    setGameSummary(null);
    setGameMode('playing');
    engineRef.current?.respawnAtSafeCheckpoint();
  };

  /**
   * RETRY LEVEL:
   * Restarts current level from start line Z = 0
   */
  const handleRetryLevel = () => {
    setGameSummary(null);
    setLevelCompleteSummary(null);
    setGameMode('playing');
    engineRef.current?.retryLevel();
  };

  const handleSelectLevel = (levelId: number) => {
    setSelectedLevelId(levelId);
    const newSave = {
      ...saveData,
      selectedLevel: levelId,
    };
    setSaveData(newSave);
    StorageManager.saveData(newSave);

    const config = getLevelConfig(levelId);
    engineRef.current?.setLevel(config);
    setIsLevelSelectOpen(false);

    setPopupMessage({
      text: levelId > 0 ? `STAGE ${levelId}: ${config.name.toUpperCase()}` : 'ENDLESS FREEWAY SELECTED',
      type: 'speed',
    });
    setTimeout(() => setPopupMessage(null), 2500);
  };

  const handleLevelComplete = (summary: LevelCompleteSummary) => {
    const nextLevelId = summary.levelId + 1;
    const currentUnlocked = saveData.unlockedLevels || [1];
    const newUnlocked =
      summary.unlockedNextLevel && nextLevelId <= 10 && !currentUnlocked.includes(nextLevelId)
        ? [...currentUnlocked, nextLevelId]
        : currentUnlocked;

    const existingRecord = saveData.levelRecords?.[summary.levelId];
    const newStars = Math.max(existingRecord?.stars || 0, summary.stars);
    const newBestTime = existingRecord?.bestTimeSeconds
      ? Math.min(existingRecord.bestTimeSeconds, summary.timeSeconds)
      : summary.timeSeconds;
    const newHighScore = Math.max(existingRecord?.highScore || 0, summary.score);

    const newSave = {
      ...saveData,
      coins: saveData.coins + summary.coinsEarned,
      unlockedLevels: newUnlocked,
      levelRecords: {
        ...(saveData.levelRecords || {}),
        [summary.levelId]: {
          completed: true,
          stars: newStars,
          bestTimeSeconds: newBestTime,
          highScore: newHighScore,
        },
      },
    };

    setSaveData(newSave);
    StorageManager.saveData(newSave);

    setLevelCompleteSummary(summary);
    setGameMode('paused');
  };

  const handleNextLevel = () => {
    if (levelCompleteSummary) {
      const nextId = levelCompleteSummary.levelId < 10 ? levelCompleteSummary.levelId + 1 : 1;
      setLevelCompleteSummary(null);
      handleSelectLevel(nextId);
      handlePlay();
    }
  };

  const handleQuitToMenu = () => {
    setGameMode('menu');
    setGameSummary(null);
    setLevelCompleteSummary(null);
    engineRef.current?.retryLevel();
    engineRef.current?.pause();
  };

  const handleCycleCamera = () => {
    engineRef.current?.cycleCameraMode();
  };

  const handleCycleRadio = () => {
    soundManager.init();
    const nextStation = soundManager.cycleRadioStation();
    const newSettings: GameSettings = {
      ...saveData.settings,
      radioStation: nextStation.id,
      radioMuted: nextStation.id === 'off',
    };
    const newSave = { ...saveData, settings: newSettings };
    setSaveData(newSave);
    StorageManager.saveData(newSave);

    if (nextStation.id === 'off') {
      setPopupMessage({ text: '📻 RADIO MUTED (ENGINE SOUNDS ACTIVE)', type: 'radio' });
    } else {
      setPopupMessage({
        text: `📻 ${nextStation.name} • ${nextStation.frequency} • ${nextStation.genre.toUpperCase()}`,
        type: 'radio',
      });
    }
    setTimeout(() => setPopupMessage(null), 2500);
  };

  const handleToggleRadioMute = () => {
    soundManager.init();
    const newRadioMuted = !saveData.settings.radioMuted;
    soundManager.setRadioMuted(newRadioMuted);
    const newSettings: GameSettings = { ...saveData.settings, radioMuted: newRadioMuted };
    const newSave = { ...saveData, settings: newSettings };
    setSaveData(newSave);
    StorageManager.saveData(newSave);
    const currentStation = soundManager.getRadioStationInfo(saveData.settings.radioStation);
    setPopupMessage({
      text: newRadioMuted
        ? '📻 RADIO MUTED (ENGINE AUDIO ACTIVE)'
        : `📻 RADIO RESUMED (${currentStation.name})`,
      type: 'radio',
    });
    setTimeout(() => setPopupMessage(null), 2500);
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundManager.setMuted(newMuted);
  };

  const handleGameOver = (summary: GameSummary) => {
    const isNewRecord = summary.score > saveData.highScore;
    const newSave = {
      ...saveData,
      coins: saveData.coins + summary.coinsEarned,
      highScore: Math.max(saveData.highScore, summary.score),
      bestDistance: Math.max(saveData.bestDistance, summary.distance),
      topSpeedRecord: Math.max(saveData.topSpeedRecord, summary.topSpeed),
      totalDistance: saveData.totalDistance + summary.distance,
      totalNearMisses: saveData.totalNearMisses + summary.nearMisses,
    };

    // Update Daily Challenges progress
    newSave.dailyChallenges = newSave.dailyChallenges.map((ch: any) => {
      let progress = ch.current;
      if (ch.metric === 'distance') progress = Math.max(progress, summary.distance);
      if (ch.metric === 'top_speed') progress = Math.max(progress, summary.topSpeed);
      if (ch.metric === 'near_miss') progress = progress + summary.nearMisses;
      if (ch.metric === 'draft_rival' && summary.draftTimeSeconds > 3) progress += 1;
      const completed = progress >= ch.target;
      return { ...ch, current: progress, completed };
    });

    // Update Missions progress
    newSave.missions = newSave.missions.map((m: any) => {
      let progress = m.current;
      if (m.metric === 'distance_total') progress = newSave.totalDistance;
      if (m.metric === 'speed_record') progress = Math.max(progress, summary.topSpeed);
      if (m.metric === 'near_misses_total') progress = newSave.totalNearMisses;
      const completed = progress >= m.target;
      return { ...m, current: progress, completed };
    });

    setSaveData(newSave);
    StorageManager.saveData(newSave);

    setPendingSubmission({
      score: summary.score,
      distance: summary.distance,
      topSpeed: summary.topSpeed,
      carName: currentCarConfig.name,
    });

    setGameSummary({
      ...summary,
      isNewRecord,
    });
    setGameMode('gameover');
  };

  const handleSelectCar = (car: CarConfig, color: string, shouldDrive = false) => {
    setCurrentCarConfig(car);
    setCarColor(color);
    const newSave = {
      ...saveData,
      selectedCar: car.id,
      carColors: {
        ...saveData.carColors,
        [car.id]: color,
      },
    };
    setSaveData(newSave);
    StorageManager.saveData(newSave);
    engineRef.current?.setCar(car, color);
    setIsGarageOpen(false);
    if (shouldDrive) {
      handlePlay();
    }
  };

  const handleUnlockCar = (car: CarConfig): boolean => {
    if (saveData.coins >= car.price) {
      const newSave = {
        ...saveData,
        coins: saveData.coins - car.price,
        unlockedCars: [...saveData.unlockedCars, car.id],
      };
      setSaveData(newSave);
      StorageManager.saveData(newSave);
      soundManager.playCoin();
      return true;
    }
    return false;
  };

  const handleClaimDailyChallenge = (id: string) => {
    const ch = saveData.dailyChallenges.find((c: any) => c.id === id);
    if (!ch || ch.claimed) return;

    const newSave = {
      ...saveData,
      coins: saveData.coins + ch.rewardCoins,
      dailyChallenges: saveData.dailyChallenges.map((c: any) =>
        c.id === id ? { ...c, claimed: true } : c
      ),
    };
    setSaveData(newSave);
    StorageManager.saveData(newSave);
    soundManager.playCoin();
  };

  const handleClaimMission = (id: string) => {
    const m = saveData.missions.find((item: any) => item.id === id);
    if (!m || m.claimed) return;

    const newSave = {
      ...saveData,
      coins: saveData.coins + m.rewardCoins,
      missions: saveData.missions.map((item: any) =>
        item.id === id ? { ...item, claimed: true } : item
      ),
    };
    setSaveData(newSave);
    StorageManager.saveData(newSave);
    soundManager.playCoin();
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
    const newSave = {
      ...saveData,
      settings: newSettings,
    };
    setSaveData(newSave);
    StorageManager.saveData(newSave);
  };

  const handleMobileInput = (
    name: 'throttle' | 'brake' | 'steer' | 'handbrake' | 'nitro' | 'horn',
    value: number | boolean
  ) => {
    engineRef.current?.setVirtualInput(name, value);
  };

  const unclaimedDailyCount =
    saveData.dailyChallenges?.filter((c: any) => c.completed && !c.claimed).length || 0;

  const currentLevelConfig = getLevelConfig(selectedLevelId);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-hud select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full game-touch-surface"
    analytics  />

      {/* Start Menu Overlay */}
      {gameMode === 'menu' && (
        <StartMenu
          onPlay={handlePlay}
          onOpenGarage={() => setIsGarageOpen(true)}
          onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
          onOpenChallenges={() => setIsChallengesOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          selectedCar={currentCarConfig}
          carColor={carColor}
          selectedLevelName={currentLevelConfig.name}
          selectedLevelId={selectedLevelId}
          coins={saveData.coins}
          highScore={saveData.highScore}
          bestDistance={saveData.bestDistance}
          dailyChallengeCount={unclaimedDailyCount}
        />
      )}

      {/* In-Game HUD Overlay */}
      {(gameMode === 'playing' || gameMode === 'paused') && !levelCompleteSummary && (
        <HUD
          state={playerState}
          isMuted={isMuted}
          radioStation={saveData.settings.radioStation}
          isRadioMuted={saveData.settings.radioMuted}
          onToggleMute={handleToggleMute}
          onCycleRadio={handleCycleRadio}
          onToggleRadioMute={handleToggleRadioMute}
          onPause={handlePause}
          onCycleCamera={handleCycleCamera}
          onEnterPhotoMode={handleEnterPhotoMode}
          popupMessage={popupMessage}
        />
      )}

      {/* Mobile Touch Controls Overlay */}
      {gameMode === 'playing' && isTouchDevice && !levelCompleteSummary && (
        <MobileControls onInput={handleMobileInput} />
      )}

      {/* Pause Modal */}
      {gameMode === 'paused' && !levelCompleteSummary && (
        <PauseModal
          onResume={handleResume}
          onRespawnAtCheckpoint={handleRespawnAtCheckpoint}
          onRestart={handleRetryLevel}
          onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
          onEnterPhotoMode={handleEnterPhotoMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* Level Complete Finish Slide Modal */}
      {levelCompleteSummary && (
        <LevelCompleteModal
          summary={levelCompleteSummary}
          carConfig={currentCarConfig}
          carColor={carColor}
          onNextLevel={handleNextLevel}
          onRetry={handleRetryLevel}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* Photo Mode Overlay */}
      {gameMode === 'photo' && (
        <PhotoMode
          carConfig={currentCarConfig}
          onRotateOrbit={(dx, dy) => engineRef.current?.rotatePhotoOrbit(dx, dy)}
          onZoomOrbit={(delta) => engineRef.current?.zoomPhotoOrbit(delta)}
          onSetFov={(fov) => engineRef.current?.setPhotoFov(fov)}
          onSetRoll={(roll) => engineRef.current?.setPhotoRoll(roll)}
          onSetHeight={(h) => engineRef.current?.setPhotoHeight(h)}
          onCaptureScreenshot={() => engineRef.current?.captureScreenshot() || ''}
          onExit={handleExitPhotoMode}
        />
      )}

      {/* Game Over Modal */}
      {gameMode === 'gameover' && gameSummary && (
        <GameOverModal
          summary={gameSummary}
          onRespawnAtCheckpoint={handleRespawnAtCheckpoint}
          onRetryLevel={handleRetryLevel}
          onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
          onOpenGarage={() => {
            setGameMode('menu');
            setIsGarageOpen(true);
          }}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* Level Select Modal */}
      {isLevelSelectOpen && (
        <LevelSelectModal
          unlockedLevels={saveData.unlockedLevels || [1]}
          selectedLevelId={selectedLevelId}
          levelRecords={saveData.levelRecords || {}}
          onSelectLevel={handleSelectLevel}
          onClose={() => setIsLevelSelectOpen(false)}
        />
      )}

      {/* Global Leaderboard Modal */}
      {isLeaderboardOpen && (
        <GlobalLeaderboard
          playerBestScore={saveData.highScore}
          playerBestDistance={saveData.bestDistance}
          playerTopSpeed={saveData.topSpeedRecord}
          pendingSubmission={pendingSubmission}
          onSubmissionComplete={() => setPendingSubmission(null)}
          onClose={() => {
            setIsLeaderboardOpen(false);
            setPendingSubmission(null);
          }}
        />
      )}

      {/* Garage Supercar Showcase Modal */}
      {isGarageOpen && (
        <GarageModal
          currentCarId={currentCarConfig.id}
          currentColor={carColor}
          unlockedCars={saveData.unlockedCars}
          coins={saveData.coins}
          onSelectCar={handleSelectCar}
          onUnlockCar={handleUnlockCar}
          onClose={() => setIsGarageOpen(false)}
        />
      )}

      {/* Daily Challenges Modal */}
      {isChallengesOpen && (
        <DailyChallengesModal
          challenges={saveData.dailyChallenges}
          missions={saveData.missions}
          lastResetTime={saveData.dailyChallengesLastReset || Date.now()}
          onClaimDailyChallenge={handleClaimDailyChallenge}
          onClaimMission={handleClaimMission}
          onClose={() => setIsChallengesOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={saveData.settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Vercel Speed Insights */}
      <SpeedInsights />
    </div>
  );
}
