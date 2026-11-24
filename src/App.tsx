import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Flame, Home, Library, Search, User } from 'lucide-react';
import { INITIAL_SONGS } from './data/songs';
import { getThemeById, THEME_OPTIONS } from './data/themes';
import {
  AppScreen,
  AudioSpeedMode,
  BeatMood,
  BeatPattern,
  CoinShopItemId,
  EqPresetId,
  LibraryTab,
  Playlist,
  RepeatMode,
  RewardMilestone,
  SleepTimerMode,
  Song,
  UserProfile,
  ZorbPersistedState,
} from './types/zorb';
import {
  cacheSongOffline,
  clearPersistedState,
  createDefaultState,
  formatOfflineLeft,
  getLocalDateKey,
  hasPermanentOfflineReward,
  hasUnlimitedImportReward,
  isOfflineAdPassActive,
  isUrlCachedOffline,
  loadPersistedState,
  OFFLINE_AD_UNLOCK_MS,
  PRE_DAY15_MAX_IMPORT_SPACE,
  removeSongOfflineCache,
  savePersistedState,
  STREAK_DAILY_THRESHOLD_SECONDS,
} from './utils/storage';
import {
  CustomSongWithFlag,
  deleteCustomTrack,
  loadCustomTracks,
  saveCustomTrack,
  StoredCustomTrack,
} from './utils/customTracksDb';
import {
  processScannedAudioFiles,
  scanSavedMusicDirectorySilently,
} from './utils/musicScanner';
import { applyEqPreset, applyPlaybackSpeed } from './utils/audioFx';
import { clipSongSegmentToWav } from './utils/audioClipper';
import {
  hapticError,
  hapticMilestone,
  hapticSkip,
  hapticTap,
  hapticToggle,
  setHapticsEnabled,
} from './utils/haptics';
import {
  updateMediaSessionMetadata,
  updateMediaSessionPositionAndState,
} from './utils/mediaNotification';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ProfileSetup } from './components/ProfileSetup';
import { HomeScreen } from './components/HomeScreen';
import { SearchScreen } from './components/SearchScreen';
import { SoloBeatMaker } from './components/SoloBeatMaker';
import { LibraryScreen } from './components/LibraryScreen';
import { RewardsScreen } from './components/RewardsScreen';
import { DeveloperAction, ProfileScreen } from './components/ProfileScreen';
import { MiniPlayer, SystemMiniPlayerBar } from './components/MiniPlayer';
import { FullPlayerModal } from './components/FullPlayerModal';
import { LiveWrappedModal } from './components/LiveWrappedModal';
import { AddToPlaylistModal, CreatePlaylistModal } from './components/PlaylistModals';
import { ImportSongModal } from './components/ImportSongModal';
import { AdInterstitialModal } from './components/AdInterstitialModal';
import { MusicScanModal } from './components/MusicScanModal';
import { OfflineGateModal } from './components/OfflineGateModal';
import { DemoAdPlayerModal } from './components/DemoAdPlayerModal';
import { PuzzlePieceIcon, ZorbLogo } from './components/ZorbLogo';

export default function App() {
  const [state, setState] = useState<ZorbPersistedState>(() => loadPersistedState());
  const [showSplash, setShowSplash] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(() => loadPersistedState().hasOnboarded);
  const [activeScreen, setActiveScreen] = useState<AppScreen>('home');
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('liked');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Custom user-imported songs from IndexedDB
  const [customSongs, setCustomSongs] = useState<CustomSongWithFlag[]>([]);
  const allSongs = useMemo<Song[]>(() => [...customSongs, ...INITIAL_SONGS], [customSongs]);

  // Playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(() => {
    const initial = loadPersistedState();
    return INITIAL_SONGS.find((s) => s.id === initial.lastPlayedSongId) || null;
  });
  const [queue, setQueue] = useState<Song[]>(INITIAL_SONGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [speedMode, setSpeedMode] = useState<AudioSpeedMode>('normal');
  const [eqPreset, setEqPreset] = useState<EqPresetId>('flat');
  const [sleepTimerMode, setSleepTimerMode] = useState<SleepTimerMode>('off');
  const [sleepRemainingSec, setSleepRemainingSec] = useState<number | null>(null);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const [showSystemBar, setShowSystemBar] = useState(false);

  // Modals & Toasts
  const [playlistPickerSong, setPlaylistPickerSong] = useState<Song | null>(null);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const [importSongOpen, setImportSongOpen] = useState(false);
  const [musicScanOpen, setMusicScanOpen] = useState(false);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [offlineGateMode, setOfflineGateMode] = useState<'offline-prompt' | 'forced-reconnect-ad' | null>(null);
  const [offlineAdPlayerOpen, setOfflineAdPlayerOpen] = useState(false);
  const [createPlaylistInitialSongId, setCreatePlaylistInitialSongId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dopamineGainToast, setDopamineGainToast] = useState<number | null>(null);

  // Network & Offline Pass timers
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [customTracksLoaded, setCustomTracksLoaded] = useState(false);

  const lastTickTimeRef = useRef<number>(0);
  const dismissedOfflinePromptRef = useRef<boolean>(false);
  const startupScanCheckedRef = useRef<boolean>(false);
  const prevOfflinePassActiveRef = useRef<boolean>(false);
  const crossfadeTriggeredRef = useRef<boolean>(false);
  const fadeInTimerRef = useRef<number | null>(null);
  const currentTheme = useMemo(() => getThemeById(state.themeId), [state.themeId]);

  const usedImportSlots = useMemo(
    () => customSongs.filter((s) => s.sourceType !== 'beat').length,
    [customSongs]
  );
  const isUnlimitedImports = useMemo(() => hasUnlimitedImportReward(state), [state]);
  const maxImportSlots = isUnlimitedImports ? 9999 : state.importSpaceLimit;
  const canExpandMoreSpace = !isUnlimitedImports && state.importSpaceLimit < PRE_DAY15_MAX_IMPORT_SPACE;

  const hasPermanentOffline = useMemo(() => hasPermanentOfflineReward(state), [state]);
  const offlinePassActive = useMemo(
    () => isOfflineAdPassActive(state, nowMs),
    [state, nowMs]
  );
  const offlineLeftText = useMemo(
    () => (hasPermanentOffline ? 'FULL OFFLINE' : formatOfflineLeft(state.offlineUnlockedUntil, nowMs)),
    [hasPermanentOffline, state.offlineUnlockedUntil, nowMs]
  );

  const nextLockedTheme = useMemo(
    () =>
      THEME_OPTIONS.find(
        (t) =>
          t.unlockDay > 0 &&
          state.streak.bestStreak < t.unlockDay &&
          state.streak.currentStreak < t.unlockDay &&
          !(state.unlockedThemeIds || []).includes(t.id)
      ) || null,
    [state.streak.bestStreak, state.streak.currentStreak, state.unlockedThemeIds]
  );

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2600);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Listen to browser online / offline events (App never crashes or shows "Disconnected")
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNowMs(Date.now());
      dismissedOfflinePromptRef.current = false;
    };
    const handleOffline = () => {
      setIsOnline(false);
      setNowMs(Date.now());
      dismissedOfflinePromptRef.current = false;
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keep offline countdown timer accurate across app focus & 10s ticks
  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    const id = window.setInterval(tick, 10000);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', tick);
    };
  }, []);

  // Re-arm offline prompt if a 6h timer just expired while offline
  useEffect(() => {
    if (prevOfflinePassActiveRef.current && !offlinePassActive && !isOnline) {
      dismissedOfflinePromptRef.current = false;
    }
    prevOfflinePassActiveRef.current = offlinePassActive;
  }, [offlinePassActive, isOnline]);

  // Offline Mode + Reconnect Skipped-Ad Enforcement Gate
  useEffect(() => {
    if (showSplash || !onboardingDone || !state.hasOnboarded) return;
    if (hasPermanentOffline) {
      if (offlineGateMode) setOfflineGateMode(null);
      return;
    }
    if (offlineAdPlayerOpen) return;

    if (isOnline && state.pendingSkippedAd) {
      setOfflineGateMode('forced-reconnect-ad');
      return;
    }

    if (!isOnline && !offlinePassActive && !dismissedOfflinePromptRef.current) {
      setOfflineGateMode('offline-prompt');
      return;
    }

    if (offlinePassActive && offlineGateMode === 'offline-prompt') {
      setOfflineGateMode(null);
    }
  }, [
    showSplash,
    onboardingDone,
    state.hasOnboarded,
    state.pendingSkippedAd,
    hasPermanentOffline,
    isOnline,
    offlinePassActive,
    offlineAdPlayerOpen,
    offlineGateMode,
  ]);

  // Persist state on changes & sync haptics preference
  useEffect(() => {
    savePersistedState(state);
    setHapticsEnabled(state.hapticsEnabled !== false);
  }, [state]);

  // Global tactile click haptic for every button interaction across screens & modals
  useEffect(() => {
    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest('button, [role="button"]') as HTMLButtonElement | null;
      if (!btn || btn.disabled) return;
      hapticTap();
    };
    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  }, []);

  // Load device-imported audio tracks from IndexedDB on mount
  useEffect(() => {
    loadCustomTracks().then((tracks) => {
      setCustomSongs(tracks);
      setCustomTracksLoaded(true);
      const lastId = loadPersistedState().lastPlayedSongId;
      if (lastId) {
        const match = tracks.find((t) => t.id === lastId);
        if (match) setCurrentSong(match);
      }
    });
  }, []);

  // Apply dynamic theme CSS variables globally
  useEffect(() => {
    document.documentElement.style.setProperty('--zorb-accent', currentTheme.hex);
    document.documentElement.style.setProperty('--zorb-accent-rgb', currentTheme.rgb);
  }, [currentTheme]);

  // Listen to visibilitychange to surface top Live Pill mini-player when minimized/backgrounded
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && currentSong) {
        setShowSystemBar(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [currentSong]);

  // Log play history helper (strictly last 5 unique songs, newest first) + play counts for Live Wrapped
  const recordHistory = useCallback((songId: string) => {
    setState((prev) => ({
      ...prev,
      lastPlayedSongId: songId,
      songPlayCounts: {
        ...(prev.songPlayCounts || {}),
        [songId]: ((prev.songPlayCounts || {})[songId] || 0) + 1,
      },
      history: [
        { songId, playedAt: new Date().toISOString() },
        ...prev.history.filter((entry) => entry.songId !== songId),
      ].slice(0, 5),
    }));
  }, []);

  // Offline Ads counter (triggers 1 interstitial after every 6 completed tracks, unless Ad-Skip Shield is active)
  const registerCompletedSongForAd = useCallback(() => {
    setState((prev) => {
      const nextCount = (prev.songsPlayedSinceAd || 0) + 1;
      if (nextCount >= 6) {
        if ((prev.adSkipShields || 0) > 0) {
          setTimeout(() => showToast('Ad-Skip Shield used — Continuing ad-free!'), 40);
          return {
            ...prev,
            adSkipShields: prev.adSkipShields - 1,
            songsPlayedSinceAd: 0,
          };
        }
        setTimeout(() => {
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
          }
          setIsPlaying(false);
          setAdModalOpen(true);
        }, 40);
      }
      return {
        ...prev,
        songsPlayedSinceAd: nextCount,
      };
    });
  }, [showToast]);

  const handleScanFiles = useCallback(
    async (files: File[]): Promise<{ added: number; duplicates: number; blockedByLimit: number }> => {
      const remaining = isUnlimitedImports ? 9999 : Math.max(0, state.importSpaceLimit - usedImportSlots);
      const { addedTracks, skippedDuplicates, skippedByLimit } = await processScannedAudioFiles(
        files,
        allSongs,
        remaining
      );
      if (addedTracks.length > 0) {
        for (const track of addedTracks) {
          await saveCustomTrack(track);
        }
        const newSongs: CustomSongWithFlag[] = addedTracks.map((track) => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          cover: track.cover,
          audioUrl: URL.createObjectURL(track.audioBlob),
          duration: track.duration,
          genre: 'Phonk',
          tags: track.tags,
          bpm: track.bpm,
          isCustomImported: true,
          sourceType: 'import',
        }));
        setCustomSongs((prev) => [...newSongs, ...prev]);
        showToast(`Added ${addedTracks.length} track(s) to Library`);
      }
      return {
        added: addedTracks.length,
        duplicates: skippedDuplicates,
        blockedByLimit: skippedByLimit,
      };
    },
    [allSongs, isUnlimitedImports, showToast, state.importSpaceLimit, usedImportSlots]
  );

  // Silent re-scan of saved music folder + first-time "Allow ZORB to find your music" prompt
  useEffect(() => {
    if (showSplash || !onboardingDone || !state.hasOnboarded || !customTracksLoaded) return;
    if (startupScanCheckedRef.current) return;
    startupScanCheckedRef.current = true;

    scanSavedMusicDirectorySilently().then((files) => {
      if (files && files.length > 0) {
        handleScanFiles(files);
      }
    });

    if (!state.hasPromptedMusicScan && !offlineGateMode) {
      setState((prev) => ({ ...prev, hasPromptedMusicScan: true }));
      const t = window.setTimeout(() => setMusicScanOpen(true), 350);
      return () => window.clearTimeout(t);
    }
  }, [showSplash, onboardingDone, state.hasOnboarded, state.hasPromptedMusicScan, customTracksLoaded, offlineGateMode, handleScanFiles]);

  const playSong = useCallback(
    async (song: Song, customQueue?: Song[], options?: { fadeInSeconds?: number }) => {
      if (customQueue) setQueue(customQueue);
      const audio = audioRef.current;
      if (!audio) return;

      const isLocalTrack =
        song.id.startsWith('custom-') ||
        song.id.startsWith('beat-') ||
        state.offlineSongIds.includes(song.id);

      if (!isOnline && !isLocalTrack) {
        const cached = await isUrlCachedOffline(song.audioUrl);
        if (!cached) {
          hapticError();
          showToast('Offline - Saved songs only');
          return;
        }
      }

      if (fadeInTimerRef.current !== null) {
        window.clearInterval(fadeInTimerRef.current);
        fadeInTimerRef.current = null;
      }

      const isSameSong = currentSong?.id === song.id;
      setCurrentSong(song);
      if (!isSameSong) {
        setLoopA(null);
        setLoopB(null);
        crossfadeTriggeredRef.current = false;
        audio.src = song.audioUrl;
        audio.currentTime = 0;
        setCurrentTime(0);
        lastTickTimeRef.current = 0;
      }

      const fadeSec = options?.fadeInSeconds || 0;
      if (fadeSec > 0 && !isSameSong) {
        audio.volume = 0.08;
      } else {
        audio.volume = 1;
      }

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          recordHistory(song.id);
          if (fadeSec > 0 && !isSameSong) {
            const steps = Math.max(8, Math.round(fadeSec * 16));
            let step = 0;
            fadeInTimerRef.current = window.setInterval(() => {
              step += 1;
              if (!audioRef.current) {
                if (fadeInTimerRef.current !== null) {
                  window.clearInterval(fadeInTimerRef.current);
                  fadeInTimerRef.current = null;
                }
                return;
              }
              const nextVol = Math.min(1, 0.08 + (0.92 * step) / steps);
              audioRef.current.volume = nextVol;
              if (step >= steps) {
                if (fadeInTimerRef.current !== null) {
                  window.clearInterval(fadeInTimerRef.current);
                  fadeInTimerRef.current = null;
                }
              }
            }, Math.round((fadeSec * 1000) / steps));
          }
        })
        .catch(() => {
          audio.volume = 1;
          setIsPlaying(false);
          if (!navigator.onLine) {
            hapticError();
            showToast('Offline - Saved songs only');
          }
        });
    },
    [currentSong, isOnline, recordHistory, showToast, state.offlineSongIds]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    hapticToggle();
    if (!currentSong) {
      playSong(INITIAL_SONGS[0]);
      return;
    }
    if (!audio.src) {
      audio.src = currentSong.audioUrl;
    }
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [currentSong, isPlaying, playSong]);

  const handleNext = useCallback(
    (fadeInSeconds = 0) => {
      if (queue.length === 0) return;
      hapticSkip();
      if (!currentSong) {
        playSong(queue[0], undefined, fadeInSeconds > 0 ? { fadeInSeconds } : undefined);
        return;
      }
      if (shuffle && queue.length > 1) {
        const excluded = state.excludedShuffleSongIds || [];
        const preferred = queue.filter(
          (s) => s.id !== currentSong.id && !excluded.includes(s.id)
        );
        const candidates =
          preferred.length > 0 ? preferred : queue.filter((s) => s.id !== currentSong.id);
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        playSong(pick, undefined, fadeInSeconds > 0 ? { fadeInSeconds } : undefined);
        return;
      }
      const idx = queue.findIndex((s) => s.id === currentSong.id);
      const nextIdx = (idx + 1) % queue.length;
      playSong(queue[nextIdx], undefined, fadeInSeconds > 0 ? { fadeInSeconds } : undefined);
    },
    [queue, currentSong, shuffle, state.excludedShuffleSongIds, playSong]
  );

  const handlePrev = useCallback(() => {
    const audio = audioRef.current;
    hapticSkip();
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      lastTickTimeRef.current = 0;
      return;
    }
    if (queue.length === 0) return;
    if (!currentSong) {
      playSong(queue[0]);
      return;
    }
    const idx = queue.findIndex((s) => s.id === currentSong.id);
    const prevIdx = (idx - 1 + queue.length) % queue.length;
    playSong(queue[prevIdx]);
  }, [queue, currentSong, playSong]);

  const handleSeek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    lastTickTimeRef.current = time;
    setCurrentTime(time);
  }, []);

  // Credit real listening seconds -> dopamine + streak progress + hourly stats for Live Wrapped
  const creditListenSeconds = useCallback(
    (deltaSeconds: number) => {
      if (deltaSeconds <= 0) return;
      const todayKey = getLocalDateKey();
      const hour = new Date().getHours();

      setState((prev) => {
        const prevTodaySec = prev.streak.dailyListenSeconds[todayKey] || 0;
        const nextTodaySec = prevTodaySec + deltaSeconds;
        const alreadyCompletedToday = prev.streak.completedDates.includes(todayKey);
        const justCompletedToday = !alreadyCompletedToday && nextTodaySec >= STREAK_DAILY_THRESHOLD_SECONDS;

        const nextCompletedDates = justCompletedToday
          ? [...prev.streak.completedDates, todayKey]
          : prev.streak.completedDates;

        const nextStreakCount = justCompletedToday
          ? prev.streak.currentStreak + 1
          : prev.streak.currentStreak;

        const nextBestStreak = Math.max(prev.streak.bestStreak, nextStreakCount);
        const nextTotalDays = justCompletedToday ? prev.streak.totalDays + 1 : prev.streak.totalDays;

        const nextTotalSeconds = prev.totalListenSeconds + deltaSeconds;
        // Quadratic dopamine growth with time
        const mins = nextTotalSeconds / 60;
        const dopamineFromTime = Math.round(mins * mins * 0.45 + mins * 6);
        const nextDopamine = Math.max(prev.dopamineScore, dopamineFromTime);

        if (justCompletedToday) {
          hapticMilestone();
          setTimeout(() => showToast(`🔥 Day ${nextStreakCount} Streak Locked!`), 50);
        }

        return {
          ...prev,
          totalListenSeconds: nextTotalSeconds,
          dopamineScore: nextDopamine,
          listeningHours: {
            ...(prev.listeningHours || {}),
            [hour]: ((prev.listeningHours || {})[hour] || 0) + deltaSeconds,
          },
          streak: {
            ...prev.streak,
            currentStreak: nextStreakCount,
            bestStreak: nextBestStreak,
            totalDays: nextTotalDays,
            completedDates: nextCompletedDates,
            dailyListenSeconds: {
              ...prev.streak.dailyListenSeconds,
              [todayKey]: nextTodaySec,
            },
          },
        };
      });
    },
    [showToast]
  );

  const mediaActionsRef = useRef({
    play: () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) {
        hapticToggle();
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    },
    pause: () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (!audio.paused) {
        hapticToggle();
        audio.pause();
        setIsPlaying(false);
      }
    },
    prev: () => handlePrev(),
    next: () => handleNext(),
    seek: (time: number) => handleSeek(time),
  });

  useEffect(() => {
    mediaActionsRef.current = {
      play: () => {
        const audio = audioRef.current;
        if (!audio) {
          togglePlay();
          return;
        }
        if (!audio.src && currentSong) {
          audio.src = currentSong.audioUrl;
        }
        if (audio.paused) {
          hapticToggle();
          audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      },
      pause: () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (!audio.paused) {
          hapticToggle();
          audio.pause();
          setIsPlaying(false);
        }
      },
      prev: () => handlePrev(),
      next: () => handleNext(),
      seek: (time: number) => handleSeek(time),
    };
  }, [currentSong, togglePlay, handlePrev, handleNext, handleSeek]);

  // Register MediaSession action handlers once (no flicker on playback ticks)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('play', () => mediaActionsRef.current.play());
      navigator.mediaSession.setActionHandler('pause', () => mediaActionsRef.current.pause());
      navigator.mediaSession.setActionHandler('stop', () => mediaActionsRef.current.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => mediaActionsRef.current.prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => mediaActionsRef.current.next());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') {
          mediaActionsRef.current.seek(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        if (audioRef.current) {
          mediaActionsRef.current.seek(Math.max(0, audioRef.current.currentTime - offset));
        }
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        if (audioRef.current) {
          const max = Number.isFinite(audioRef.current.duration)
            ? audioRef.current.duration
            : audioRef.current.currentTime + offset;
          mediaActionsRef.current.seek(Math.min(max, audioRef.current.currentTime + offset));
        }
      });
    } catch {
      // Ignore unsupported MediaSession actions
    }
  }, []);

  // Update MediaSession metadata cleanly only when track changes (512x512 raster artwork)
  useEffect(() => {
    if (!currentSong) return;
    updateMediaSessionMetadata(currentSong);
  }, [currentSong?.id, currentSong?.title, currentSong?.artist, currentSong?.cover]);

  // Sync MediaSession Play/Pause state & Seek Bar progress cleanly
  const wholeSecondTime = Math.floor(currentTime);
  useEffect(() => {
    if (!currentSong) return;
    const rate = speedMode === 'slowed' ? 0.85 : speedMode === 'sped' ? 1.15 : 1;
    updateMediaSessionPositionAndState(isPlaying, duration, wholeSecondTime, rate);
  }, [currentSong, isPlaying, duration, wholeSecondTime, speedMode]);

  // Listen to Service Worker media notification button actions when sent back
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onSwMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; action?: string } | null;
      if (!data || data.type !== 'ZORB_MEDIA_ACTION') return;
      if (data.action === 'play') mediaActionsRef.current.play();
      else if (data.action === 'pause') mediaActionsRef.current.pause();
      else if (data.action === 'prev') mediaActionsRef.current.prev();
      else if (data.action === 'next') mediaActionsRef.current.next();
    };
    navigator.serviceWorker.addEventListener('message', onSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onSwMessage);
  }, []);

  // Sync Phonk Playback Speed & EQ Preset to <audio> element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    applyPlaybackSpeed(audio, speedMode);
  }, [speedMode, currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    applyEqPreset(audio, eqPreset);
  }, [eqPreset, isPlaying]);

  // Sleep Timer Countdown (15m / 30m / 60m)
  useEffect(() => {
    if (sleepTimerMode === 'off' || sleepTimerMode === 'end-of-track') {
      setSleepRemainingSec(null);
      return;
    }
    const mins = sleepTimerMode === '15m' ? 15 : sleepTimerMode === '30m' ? 30 : 60;
    setSleepRemainingSec(mins * 60);

    const id = window.setInterval(() => {
      setSleepRemainingSec((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
          }
          setIsPlaying(false);
          setSleepTimerMode('off');
          showToast('Sleep timer paused playback');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [sleepTimerMode, showToast]);

  // Desktop Keyboard Shortcuts (Space = Play/Pause, Arrows = Seek, Shift+Arrows or N/P = Skip)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showSplash || !onboardingDone || !state.hasOnboarded) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          handleNext();
        } else if (audioRef.current) {
          const max = Number.isFinite(audioRef.current.duration)
            ? audioRef.current.duration
            : currentTime + 5;
          handleSeek(Math.min(max, audioRef.current.currentTime + 5));
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
          handlePrev();
        } else if (audioRef.current) {
          handleSeek(Math.max(0, audioRef.current.currentTime - 5));
        }
      } else if (e.key === 'n' || e.key === 'N') {
        handleNext();
      } else if (e.key === 'p' || e.key === 'P') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    showSplash,
    onboardingDone,
    state.hasOnboarded,
    togglePlay,
    handleNext,
    handlePrev,
    handleSeek,
    currentTime,
  ]);

  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const now = audio.currentTime;

    // A-B Drop Looper check
    if (loopA !== null && loopB !== null && loopB > loopA + 0.2 && now >= loopB) {
      audio.currentTime = loopA;
      lastTickTimeRef.current = loopA;
      setCurrentTime(loopA);
      return;
    }

    setCurrentTime(now);

    const delta = now - lastTickTimeRef.current;
    if (delta >= 1 && delta < 5) {
      const wholeSec = Math.floor(delta);
      lastTickTimeRef.current += wholeSec;
      creditListenSeconds(wholeSec);
    } else if (delta < 0 || delta >= 5) {
      lastTickTimeRef.current = now;
    }

    // Smooth Crossfade handoff (0-6s)
    const cfSec = state.crossfadeSeconds || 0;
    const loopActive = loopA !== null && loopB !== null && loopB > loopA;
    const trackDur = audio.duration;
    if (
      cfSec > 0 &&
      !loopActive &&
      repeatMode !== 'one' &&
      sleepTimerMode !== 'end-of-track' &&
      Number.isFinite(trackDur) &&
      trackDur > cfSec + 3 &&
      queue.length > 1
    ) {
      const remaining = trackDur - now;
      if (remaining <= cfSec && remaining > 0) {
        audio.volume = Math.max(0.05, Math.min(1, remaining / cfSec));
        if (remaining <= 0.2 && !crossfadeTriggeredRef.current) {
          crossfadeTriggeredRef.current = true;
          setState((prev) => ({
            ...prev,
            dopamineScore: prev.dopamineScore + 10,
          }));
          creditListenSeconds(60);
          setDopamineGainToast(10);
          setTimeout(() => setDopamineGainToast(null), 2200);

          const willTriggerAd =
            (state.songsPlayedSinceAd || 0) + 1 >= 6 && (state.adSkipShields || 0) === 0;
          registerCompletedSongForAd();
          if (willTriggerAd) {
            setIsPlaying(false);
            audio.volume = 1;
            return;
          }
          handleNext(Math.min(cfSec, 2.5));
        }
      } else if (fadeInTimerRef.current === null && audio.volume < 1) {
        audio.volume = 1;
      }
    } else if (fadeInTimerRef.current === null && audio.volume < 1) {
      audio.volume = 1;
    }
  };

  const handleAudioEnded = () => {
    if (audioRef.current) {
      audioRef.current.volume = 1;
    }
    if (crossfadeTriggeredRef.current) {
      crossfadeTriggeredRef.current = false;
      return;
    }

    // Song finished: Dopamine +10 animation & Streak time +1 min bonus
    setState((prev) => ({
      ...prev,
      dopamineScore: prev.dopamineScore + 10,
    }));
    creditListenSeconds(60);
    setDopamineGainToast(10);
    setTimeout(() => setDopamineGainToast(null), 2200);

    if (sleepTimerMode === 'end-of-track') {
      setSleepTimerMode('off');
      setIsPlaying(false);
      showToast('Sleep timer stopped after track');
      return;
    }

    const willTriggerAd =
      (state.songsPlayedSinceAd || 0) + 1 >= 6 && (state.adSkipShields || 0) === 0;
    registerCompletedSongForAd();
    if (willTriggerAd) {
      setIsPlaying(false);
      return;
    }

    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => undefined);
      return;
    }
    handleNext();
  };

  // Likes, Playlists, Offline, Share
  const toggleLike = (songId: string) => {
    hapticToggle();
    setState((prev) => {
      const exists = prev.likedSongIds.includes(songId);
      return {
        ...prev,
        likedSongIds: exists
          ? prev.likedSongIds.filter((id) => id !== songId)
          : [songId, ...prev.likedSongIds],
      };
    });
  };

  const toggleOffline = async (song: Song) => {
    hapticToggle();
    const exists = state.offlineSongIds.includes(song.id);
    if (exists) {
      await removeSongOfflineCache(song.audioUrl);
      setState((prev) => ({
        ...prev,
        offlineSongIds: prev.offlineSongIds.filter((id) => id !== song.id),
      }));
      showToast(`Removed offline copy of ${song.title}`);
    } else {
      const ok = await cacheSongOffline(song.audioUrl);
      setState((prev) => ({
        ...prev,
        offlineSongIds: [...prev.offlineSongIds, song.id],
      }));
      showToast(ok ? `${song.title} saved for offline playback` : `Saved ${song.title} offline`);
    }
  };

  // True Queue Control: Play Next, Move Queue Item, Remove Queue Item, Skip in Shuffle
  const handlePlayNext = useCallback(
    (song: Song) => {
      hapticSkip();
      if (!currentSong) {
        playSong(song, [song, ...allSongs.filter((s) => s.id !== song.id)]);
        return;
      }
      if (song.id === currentSong.id) {
        showToast('Already playing right now');
        return;
      }
      setQueue((prev) => {
        const filtered = prev.filter((s) => s.id !== song.id);
        const curIdx = filtered.findIndex((s) => s.id === currentSong.id);
        if (curIdx === -1) return [song, ...filtered];
        return [...filtered.slice(0, curIdx + 1), song, ...filtered.slice(curIdx + 1)];
      });
      showToast(`Playing next: ${song.title}`);
    },
    [allSongs, currentSong, playSong, showToast]
  );

  const handleMoveQueueItem = useCallback((index: number, direction: -1 | 1) => {
    setQueue((prev) => {
      const targetIdx = index + direction;
      if (index < 0 || targetIdx < 0 || index >= prev.length || targetIdx >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
  }, []);

  const handleRemoveQueueItem = useCallback(
    (songId: string) => {
      if (currentSong?.id === songId) return;
      setQueue((prev) => prev.filter((s) => s.id !== songId));
      showToast('Removed from Up Next');
    },
    [currentSong, showToast]
  );

  const handleToggleExcludeShuffle = useCallback(
    (songId: string) => {
      hapticToggle();
      setState((prev) => {
        const list = prev.excludedShuffleSongIds || [];
        const exists = list.includes(songId);
        showToast(exists ? 'Song allowed in Shuffle' : 'Song will skip in Shuffle');
        return {
          ...prev,
          excludedShuffleSongIds: exists
            ? list.filter((id) => id !== songId)
            : [...list, songId],
        };
      });
    },
    [showToast]
  );

  // Timestamp Bookmarks & Audio Highlight Clipper
  const handleAddBookmark = useCallback(
    (time: number, label: string) => {
      if (!currentSong) return;
      hapticToggle();
      const clamped = Math.max(0, time);
      const newBookmark = {
        id: `bm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        time: clamped,
        label: label.trim() || 'Drop',
      };
      setState((prev) => {
        const existing = (prev.songBookmarks || {})[currentSong.id] || [];
        const updated = [...existing, newBookmark].sort((a, b) => a.time - b.time);
        return {
          ...prev,
          songBookmarks: {
            ...(prev.songBookmarks || {}),
            [currentSong.id]: updated,
          },
        };
      });
      showToast(`Pinned "${newBookmark.label}"`);
    },
    [currentSong, showToast]
  );

  const handleDeleteBookmark = useCallback(
    (bookmarkId: string) => {
      if (!currentSong) return;
      setState((prev) => {
        const existing = (prev.songBookmarks || {})[currentSong.id] || [];
        return {
          ...prev,
          songBookmarks: {
            ...(prev.songBookmarks || {}),
            [currentSong.id]: existing.filter((b) => b.id !== bookmarkId),
          },
        };
      });
    },
    [currentSong]
  );

  const handleSaveClipToBeats = useCallback(
    async (startSec: number, endSec: number) => {
      if (!currentSong) return;
      try {
        const { blob, duration: clipDuration } = await clipSongSegmentToWav(
          currentSong.audioUrl,
          startSec,
          endSec
        );
        const id = `beat-${Date.now()}`;
        const createdAt = new Date().toISOString();
        const clipTitle = `${currentSong.title} (Clip)`;
        const stored: StoredCustomTrack = {
          id,
          title: clipTitle,
          artist: currentSong.artist,
          cover: currentSong.cover,
          duration: clipDuration,
          tags: currentSong.tags.length > 0 ? currentSong.tags : ['Phonk'],
          bpm: currentSong.bpm,
          audioBlob: blob,
          createdAt,
          sourceType: 'beat',
        };
        await saveCustomTrack(stored);
        const objectUrl = URL.createObjectURL(blob);
        const clipSong: CustomSongWithFlag = {
          id,
          title: clipTitle,
          artist: currentSong.artist,
          cover: currentSong.cover,
          audioUrl: objectUrl,
          duration: clipDuration,
          genre: 'Phonk',
          tags: stored.tags,
          bpm: currentSong.bpm,
          isCustomImported: true,
          sourceType: 'beat',
          createdAt,
        };
        setCustomSongs((prev) => [clipSong, ...prev]);
        hapticMilestone();
        showToast(`Saved "${clipTitle}" to My Beats!`);
      } catch {
        hapticError();
        showToast('Could not clip this track offline');
      }
    },
    [currentSong, showToast]
  );

  const handleShareSong = async (song: Song) => {
    const shareText = `Listening to ${song.title} by ${song.artist} on ZORB — Z = M × D²`;
    try {
      if (navigator.share) {
        await navigator.share({ title: song.title, text: shareText });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        showToast('Track info copied to clipboard');
      } else {
        showToast(shareText);
      }
    } catch {
      showToast('Share ready');
    }
  };

  const handleSharePlaylist = async (pl: Playlist) => {
    const shareText = `Check out my ZORB playlist "${pl.name}" (${pl.songIds.length} Phonk tracks) · Z = M × D²`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
      showToast(`Playlist "${pl.name}" link copied`);
    } catch {
      showToast(`Shared "${pl.name}"`);
    }
  };

  const handleCreatePlaylist = (name: string, cover: string, songIds: string[]) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      cover,
      songIds,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      playlists: [newPl, ...prev.playlists],
    }));
    showToast(`Playlist "${name}" created`);
  };

  const handleToggleSongInPlaylist = (playlistId: string, songId: string) => {
    setState((prev) => ({
      ...prev,
      playlists: prev.playlists.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const has = pl.songIds.includes(songId);
        return {
          ...pl,
          songIds: has ? pl.songIds.filter((id) => id !== songId) : [...pl.songIds, songId],
        };
      }),
    }));
  };

  const handleRemoveSongFromPlaylist = (playlistId: string, songId: string) => {
    setState((prev) => ({
      ...prev,
      playlists: prev.playlists.map((pl) =>
        pl.id === playlistId ? { ...pl, songIds: pl.songIds.filter((id) => id !== songId) } : pl
      ),
    }));
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setState((prev) => ({
      ...prev,
      playlists: prev.playlists.filter((p) => p.id !== playlistId),
    }));
    showToast('Playlist deleted');
  };

  const handleClaimReward = (reward: RewardMilestone) => {
    hapticMilestone();
    setState((prev) => {
      if (prev.claimedRewardIds.includes(reward.id)) return prev;
      return {
        ...prev,
        claimedRewardIds: [...prev.claimedRewardIds, reward.id],
        coins: (prev.coins || 0) + (reward.coinsBonus || 0),
        themeId: reward.themeId || prev.themeId,
      };
    });
    showToast(`Claimed: ${reward.badgeName}${reward.coinsBonus ? ` (+${reward.coinsBonus} Coins)` : ''}`);
  };

  const handleAddMoreSpace = useCallback(() => {
    setState((prev) => {
      if (prev.importSpaceLimit >= PRE_DAY15_MAX_IMPORT_SPACE) return prev;
      hapticMilestone();
      const nextLimit = Math.min(PRE_DAY15_MAX_IMPORT_SPACE, prev.importSpaceLimit + 5);
      showToast(`+5 Import Space added (${nextLimit} slots ready)`);
      return {
        ...prev,
        importSpaceLimit: nextLimit,
      };
    });
  }, [showToast]);

  const handleDevAction = useCallback(
    (action: DeveloperAction) => {
      const todayKey = getLocalDateKey();
      switch (action) {
        case 'add-streak-day':
          hapticMilestone();
          setState((prev) => {
            const next = prev.streak.currentStreak + 1;
            const completed = prev.streak.completedDates.includes(todayKey)
              ? prev.streak.completedDates
              : [...prev.streak.completedDates, todayKey];
            return {
              ...prev,
              streak: {
                ...prev.streak,
                currentStreak: next,
                bestStreak: Math.max(prev.streak.bestStreak, next),
                totalDays: prev.streak.totalDays + 1,
                completedDates: completed,
              },
            };
          });
          showToast('Dev: +1 Day Streak added');
          break;
        case 'set-streak-15':
          hapticMilestone();
          setState((prev) => ({
            ...prev,
            streak: {
              ...prev.streak,
              currentStreak: 15,
              bestStreak: Math.max(prev.streak.bestStreak, 15),
              totalDays: Math.max(prev.streak.totalDays, 15),
            },
          }));
          showToast('Dev: Streak set to Day 15 (25+ Imports unlocked)');
          break;
        case 'set-streak-30':
          hapticMilestone();
          setState((prev) => ({
            ...prev,
            streak: {
              ...prev.streak,
              currentStreak: 30,
              bestStreak: Math.max(prev.streak.bestStreak, 30),
              totalDays: Math.max(prev.streak.totalDays, 30),
            },
          }));
          showToast('Dev: Streak set to Day 30 (Full Offline unlocked)');
          break;
        case 'reset-streak':
          setState((prev) => ({
            ...prev,
            streak: {
              ...prev.streak,
              currentStreak: 0,
            },
          }));
          showToast('Dev: Streak reset to 0');
          break;
        case 'add-500-coins':
          setState((prev) => ({ ...prev, coins: (prev.coins || 0) + 500 }));
          showToast('Dev: +500 ZORB Coins added');
          break;
        case 'add-1000-dopamine':
          setState((prev) => ({ ...prev, dopamineScore: prev.dopamineScore + 1000 }));
          showToast('Dev: +1,000 Dopamine added');
          break;
        case 'unlock-6h-offline':
          setNowMs(Date.now());
          setState((prev) => ({
            ...prev,
            offlineUnlockedUntil: Date.now() + OFFLINE_AD_UNLOCK_MS,
            offlineCarryOnCount: 0,
            pendingSkippedAd: false,
          }));
          setOfflineGateMode(null);
          showToast('Dev: 6 Hours Offline Mode unlocked');
          break;
        case 'clear-offline-locks':
          dismissedOfflinePromptRef.current = false;
          setOfflineGateMode(null);
          setState((prev) => ({
            ...prev,
            offlineCarryOnCount: 0,
            pendingSkippedAd: false,
            songsPlayedSinceAd: 0,
          }));
          showToast('Dev: Ad & Carry-On locks cleared');
          break;
        case 'trigger-ad-now':
          setOfflineAdPlayerOpen(true);
          break;
        case 'replay-splash':
          setShowSplash(true);
          break;
        case 'reset-scan-prompt':
          setState((prev) => ({ ...prev, hasPromptedMusicScan: false }));
          setMusicScanOpen(true);
          break;
      }
    },
    [showToast]
  );

  const handleBuyShopItem = useCallback(
    (itemId: CoinShopItemId) => {
      if (itemId === 'offline-6h') {
        if ((state.coins || 0) < 150 || hasPermanentOffline) {
          hapticError();
          return;
        }
        hapticMilestone();
        setNowMs(Date.now());
        setOfflineGateMode(null);
        dismissedOfflinePromptRef.current = false;
        setState((prev) => ({
          ...prev,
          coins: (prev.coins || 0) - 150,
          offlineUnlockedUntil: Date.now() + OFFLINE_AD_UNLOCK_MS,
          offlineCarryOnCount: 0,
          pendingSkippedAd: false,
        }));
        showToast('Purchased 6-Hour Offline Pass!');
      } else if (itemId === 'ad-shield') {
        if ((state.coins || 0) < 100) {
          hapticError();
          return;
        }
        hapticMilestone();
        setState((prev) => ({
          ...prev,
          coins: (prev.coins || 0) - 100,
          adSkipShields: (prev.adSkipShields || 0) + 1,
        }));
        showToast('Purchased +1 Ad-Skip Shield!');
      } else if (itemId === 'extra-space-5') {
        if ((state.coins || 0) < 200 || !canExpandMoreSpace) {
          hapticError();
          return;
        }
        hapticMilestone();
        setState((prev) => ({
          ...prev,
          coins: (prev.coins || 0) - 200,
          importSpaceLimit: Math.min(PRE_DAY15_MAX_IMPORT_SPACE, prev.importSpaceLimit + 5),
        }));
        showToast('Purchased +5 Song Import Space!');
      } else if (itemId === 'unlock-next-theme') {
        if ((state.coins || 0) < 250 || !nextLockedTheme) {
          hapticError();
          return;
        }
        hapticMilestone();
        setState((prev) => ({
          ...prev,
          coins: (prev.coins || 0) - 250,
          unlockedThemeIds: [...(prev.unlockedThemeIds || []), nextLockedTheme.id],
          themeId: nextLockedTheme.id,
        }));
        showToast(`Unlocked & Equipped ${nextLockedTheme.name}!`);
      }
    },
    [state.coins, hasPermanentOffline, canExpandMoreSpace, nextLockedTheme, showToast]
  );

  const sendReminderNotification = useCallback(() => {
    const title = 'ZORB — Z = M × D²';
    const body = 'Time for ZORB — Your streak is waiting';
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch {
        // Fallback toast below
      }
    }
    showToast(body);
  }, [showToast]);

  const handleToggleNotifications = async () => {
    if (!state.notificationsEnabled) {
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch {
          // Ignore permission prompt error
        }
      }
      setState((prev) => ({ ...prev, notificationsEnabled: true }));
      sendReminderNotification();
    } else {
      setState((prev) => ({ ...prev, notificationsEnabled: false }));
      showToast('Daily reminders paused');
    }
  };

  const handleImportedSong = async (track: StoredCustomTrack) => {
    await saveCustomTrack(track);
    const newSong: CustomSongWithFlag = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      cover: track.cover,
      audioUrl: URL.createObjectURL(track.audioBlob),
      duration: track.duration,
      genre: 'Phonk',
      tags: track.tags,
      bpm: track.bpm,
      isCustomImported: true,
      sourceType: 'import',
    };
    setCustomSongs((prev) => [newSong, ...prev]);
    showToast(`Imported "${newSong.title}" from device`);
  };

  const handleDeleteCustomSong = async (songId: string) => {
    const target = customSongs.find((s) => s.id === songId);
    if (target?.audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(target.audioUrl);
    }
    await deleteCustomTrack(songId);
    setCustomSongs((prev) => prev.filter((s) => s.id !== songId));
    setState((prev) => ({
      ...prev,
      likedSongIds: prev.likedSongIds.filter((id) => id !== songId),
      history: prev.history.filter((entry) => entry.songId !== songId),
      playlists: prev.playlists.map((p) => ({
        ...p,
        songIds: p.songIds.filter((id) => id !== songId),
      })),
    }));
    if (currentSong?.id === songId) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setCurrentSong(null);
    }
    showToast('Removed track');
  };

  const handlePauseMainPlayer = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const handleSaveOrUploadBeat = async (payload: {
    title: string;
    cover: string;
    bpm: number;
    mood: BeatMood;
    duration: number;
    steps: BeatPattern;
    wavBlob: Blob;
    publishToCommunity: boolean;
  }) => {
    const id = `beat-${Date.now()}`;
    const creator = state.profile?.name || 'ZORB Producer';
    const createdAt = new Date().toISOString();

    const stored: StoredCustomTrack = {
      id,
      title: payload.title,
      artist: creator,
      cover: payload.cover,
      duration: payload.duration,
      tags: [
        'Phonk',
        payload.mood === 'AGGRESSIVE'
          ? 'Aggressive Phonk'
          : payload.mood === 'CHILL'
          ? 'Chill Phonk'
          : 'Drift Phonk',
      ],
      bpm: payload.bpm,
      audioBlob: payload.wavBlob,
      createdAt,
      sourceType: 'beat',
      mood: payload.mood,
      steps: payload.steps,
      isPublishedToCommunity: false,
    };

    await saveCustomTrack(stored);
    const objectUrl = URL.createObjectURL(payload.wavBlob);
    const beatSong: CustomSongWithFlag = {
      id,
      title: payload.title,
      artist: creator,
      cover: payload.cover,
      audioUrl: objectUrl,
      duration: payload.duration,
      genre: 'Phonk',
      tags: stored.tags,
      bpm: payload.bpm,
      isCustomImported: true,
      sourceType: 'beat',
      mood: payload.mood,
      steps: payload.steps,
      isPublishedToCommunity: false,
      createdAt,
    };
    setCustomSongs((prev) => [beatSong, ...prev]);

    // Reward: +50 Dopamine & +180s streak progress
    creditListenSeconds(180);
    setState((prev) => ({
      ...prev,
      dopamineScore: prev.dopamineScore + 50,
    }));
    registerCompletedSongForAd();
    hapticMilestone();
    showToast(`Saved "${payload.title}" offline · +50 DP`);
  };

  const handleClearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      history: [],
    }));
    showToast('History Cleared');
  }, [showToast]);

  const handleFinishSetup = (profile: UserProfile) => {
    setState((prev) => ({
      ...prev,
      hasOnboarded: true,
      profile,
    }));
    setOnboardingDone(true);
    setActiveScreen('home');
  };

  const handleLogout = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentSong(null);
    clearPersistedState();
    setState(createDefaultState());
    setOnboardingDone(false);
    setActiveScreen('home');
  };

  const navItems: { id: AppScreen; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  // Splash Gate
  if (showSplash) {
    return (
      <SplashScreen
        accentHex={currentTheme.hex}
        onComplete={() => setShowSplash(false)}
      />
    );
  }

  // First-time Onboarding Gate
  if (!onboardingDone) {
    return (
      <OnboardingFlow
        accentHex={currentTheme.hex}
        onComplete={() => setOnboardingDone(true)}
      />
    );
  }

  // First-time Profile Setup Gate
  if (!state.hasOnboarded || !state.profile) {
    return (
      <ProfileSetup
        accentHex={currentTheme.hex}
        onFinish={handleFinishSetup}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      {/* Hidden Persistent HTML5 Audio Element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={() => {
          if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={handleAudioEnded}
        onError={() => {
          setIsPlaying(false);
          if (!navigator.onLine) {
            showToast('Offline - Saved songs only');
          }
        }}
      />

      {/* Top Live Pill / Dynamic Island Mini-Player (when minimized / backgrounded) */}
      <AnimatePresence>
        {showSystemBar && currentSong && (
          <SystemMiniPlayerBar
            song={currentSong}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            accentHex={currentTheme.hex}
            onOpenFull={() => {
              setShowSystemBar(false);
              setFullPlayerOpen(true);
            }}
            onTogglePlay={togglePlay}
            onPrev={handlePrev}
            onNext={() => handleNext()}
            onDismiss={() => setShowSystemBar(false)}
          />
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#0B0D12] border text-xs font-semibold text-white shadow-2xl pointer-events-none whitespace-nowrap"
            style={{ borderColor: currentTheme.hex }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Broken Modal */}
      <AnimatePresence>
        {state.streak.streakBrokenModalPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm rounded-2xl bg-[#0B0D12] border border-white/15 p-6 text-center flex flex-col items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/15 flex items-center justify-center text-zinc-400">
                <PuzzlePieceIcon className="w-7 h-7" color={currentTheme.hex} />
              </div>
              <div>
                <h3 className="font-display text-3xl font-extrabold uppercase">
                  Streak Broken — Start Again
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  You missed yesterday&apos;s 10-minute session. Your current streak reset to 0, while your {state.streak.totalDays} total days and {state.streak.bestStreak}-day best stay locked on your profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    streak: { ...prev.streak, streakBrokenModalPending: false },
                  }))
                }
                className="w-full h-12 rounded-xl text-sm font-bold text-black cursor-pointer"
                style={{ backgroundColor: currentTheme.hex }}
              >
                Start Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Left Navigation Rail */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:justify-between border-r border-white/10 bg-[#05070B] p-5 sticky top-0 h-screen">
        <div className="flex flex-col gap-7">
          <button
            type="button"
            onClick={() => setActiveScreen('home')}
            className="flex items-center justify-between text-left cursor-pointer"
          >
            <ZorbLogo size="md" accentColor={currentTheme.hex} showFormula />
          </button>

          <nav className="flex flex-col gap-1.5" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveScreen(item.id)}
                  className={`h-11 px-3.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-colors cursor-pointer ${
                    active ? 'text-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={active ? { backgroundColor: currentTheme.hex } : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-2xl bg-black border border-white/10 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4" style={{ color: currentTheme.hex }} />
              <span className="text-xs font-semibold text-white">Streak</span>
            </div>
            <span className="text-sm font-mono-tabular font-bold" style={{ color: currentTheme.hex }}>
              {state.streak.currentStreak} Days
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveScreen('profile')}
            className="rounded-2xl bg-black border border-white/10 hover:border-white/25 p-2.5 flex items-center gap-3 text-left cursor-pointer"
          >
            <img
              src={state.profile.avatar}
              alt={state.profile.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border-2 shrink-0"
              style={{ borderColor: currentTheme.hex }}
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{state.profile.name}</p>
              <p className="text-[11px] text-zinc-400 truncate font-mono-tabular">
                {state.dopamineScore} DP
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Responsive Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top App Bar (Compact 54px, Left: ZORB, Right: Profile Circle with Theme Ring) */}
        <header className="lg:hidden sticky top-0 z-30 h-14 px-4 bg-black/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveScreen('home')}
            className="flex items-center cursor-pointer"
            aria-label="Go to ZORB Home"
          >
            <ZorbLogo size="sm" accentColor={currentTheme.hex} />
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('profile')}
            className="w-10 h-10 rounded-full overflow-hidden border-2 p-0.5 active:scale-95 transition-transform cursor-pointer"
            style={{
              borderColor: currentTheme.hex,
              boxShadow: `0 0 14px rgba(var(--zorb-accent-rgb), 0.35)`,
            }}
            aria-label="Open profile"
          >
            <img
              src={state.profile.avatar}
              alt={state.profile.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full"
            />
          </button>
        </header>

        {/* Scrollable Screen Container with Slide + Fade Transitions */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-36 lg:pb-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeScreen === 'home' && (
                <HomeScreen
                  profile={state.profile}
                  accentHex={currentTheme.hex}
                  songs={allSongs}
                  playlists={state.playlists}
                  history={state.history}
                  offlineSongIds={state.offlineSongIds}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  isOnline={isOnline}
                  hasPermanentOffline={hasPermanentOffline}
                  offlinePassActive={offlinePassActive}
                  offlineLeftText={offlineLeftText}
                  likedSongIds={state.likedSongIds}
                  dopamineScore={state.dopamineScore}
                  streak={state.streak}
                  songsPlayedSinceAd={state.songsPlayedSinceAd || 0}
                  onPlaySong={(song, customQueue) => {
                    playSong(song, customQueue || allSongs);
                    setFullPlayerOpen(true);
                  }}
                  onTogglePlay={togglePlay}
                  onToggleLike={toggleLike}
                  onOpenAddToPlaylist={(song) => setPlaylistPickerSong(song)}
                  onOpenPlaylist={(plId) => {
                    setLibraryTab('playlists');
                    setSelectedPlaylistId(plId);
                    setActiveScreen('library');
                  }}
                  onOpenRewards={() => setActiveScreen('rewards')}
                  onOpenBeatMaker={() => setActiveScreen('beat-maker')}
                  onOpenProfile={() => setActiveScreen('profile')}
                  onOpenWrapped={() => setWrappedOpen(true)}
                  onPlayNext={handlePlayNext}
                  onOpenAutoScan={() => setMusicScanOpen(true)}
                  onOpenImportSong={() => setImportSongOpen(true)}
                  onOpenWatchOfflineAd={() => setOfflineAdPlayerOpen(true)}
                />
              )}

              {activeScreen === 'search' && (
                <SearchScreen
                  songs={allSongs}
                  playlists={state.playlists}
                  searchHistory={state.searchHistory}
                  likedSongIds={state.likedSongIds}
                  offlineSongIds={state.offlineSongIds}
                  excludedShuffleSongIds={state.excludedShuffleSongIds || []}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  accentHex={currentTheme.hex}
                  onPlaySong={(song) => {
                    playSong(song, allSongs);
                    setFullPlayerOpen(true);
                  }}
                  onPlayNext={handlePlayNext}
                  onToggleExcludeShuffle={handleToggleExcludeShuffle}
                  onTogglePlay={togglePlay}
                  onAddSearchHistory={(term) =>
                    setState((prev) => ({
                      ...prev,
                      searchHistory: [
                        term,
                        ...prev.searchHistory.filter((t) => t.toLowerCase() !== term.toLowerCase()),
                      ].slice(0, 5),
                    }))
                  }
                  onClearSearchHistory={() => setState((prev) => ({ ...prev, searchHistory: [] }))}
                  onOpenAddToPlaylist={(song) => setPlaylistPickerSong(song)}
                  onToggleLike={toggleLike}
                  onToggleOffline={toggleOffline}
                  onOpenPlaylistFromSearch={(plId) => {
                    setLibraryTab('playlists');
                    setSelectedPlaylistId(plId);
                    setActiveScreen('library');
                  }}
                />
              )}

              {activeScreen === 'beat-maker' && (
                <SoloBeatMaker
                  accentHex={currentTheme.hex}
                  creatorName={state.profile.name}
                  onBack={() => setActiveScreen('home')}
                  onPauseMainPlayer={handlePauseMainPlayer}
                  onSaveOrUploadBeat={handleSaveOrUploadBeat}
                  onOpenMyBeatsLibrary={() => {
                    setLibraryTab('beats');
                    setSelectedPlaylistId(null);
                    setActiveScreen('library');
                  }}
                />
              )}

              {activeScreen === 'library' && (
                <LibraryScreen
                  activeTab={libraryTab}
                  selectedPlaylistId={selectedPlaylistId}
                  songs={allSongs}
                  likedSongIds={state.likedSongIds}
                  offlineSongIds={state.offlineSongIds}
                  excludedShuffleSongIds={state.excludedShuffleSongIds || []}
                  playlists={state.playlists}
                  history={state.history}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  isOnline={isOnline}
                  usedImportSlots={usedImportSlots}
                  maxImportSlots={maxImportSlots}
                  isUnlimitedImports={isUnlimitedImports}
                  canExpandMoreSpace={canExpandMoreSpace}
                  accentHex={currentTheme.hex}
                  onChangeTab={setLibraryTab}
                  onSelectPlaylist={setSelectedPlaylistId}
                  onPlaySong={(song, customQueue) => {
                    playSong(song, customQueue || allSongs);
                    setFullPlayerOpen(true);
                  }}
                  onPlayNext={handlePlayNext}
                  onToggleExcludeShuffle={handleToggleExcludeShuffle}
                  onPlayPlaylist={(pl) => {
                    const plSongs = pl.songIds
                      .map((id) => allSongs.find((s) => s.id === id))
                      .filter((s): s is Song => Boolean(s));
                    if (plSongs.length > 0) {
                      playSong(plSongs[0], plSongs);
                      setFullPlayerOpen(true);
                    }
                  }}
                  onToggleLike={toggleLike}
                  onToggleOffline={toggleOffline}
                  onOpenAddToPlaylist={(song) => setPlaylistPickerSong(song)}
                  onOpenCreatePlaylist={() => {
                    setCreatePlaylistInitialSongId(undefined);
                    setCreatePlaylistOpen(true);
                  }}
                  onOpenAutoScan={() => setMusicScanOpen(true)}
                  onOpenImportSong={() => setImportSongOpen(true)}
                  onAddMoreSpace={handleAddMoreSpace}
                  onOpenBeatMaker={() => setActiveScreen('beat-maker')}
                  onDeleteCustomSong={handleDeleteCustomSong}
                  onRemoveSongFromPlaylist={handleRemoveSongFromPlaylist}
                  onDeletePlaylist={handleDeletePlaylist}
                  onSharePlaylist={handleSharePlaylist}
                  onClearHistory={handleClearHistory}
                />
              )}

              {activeScreen === 'rewards' && (
                <RewardsScreen
                  streak={state.streak}
                  coins={state.coins || 0}
                  adSkipShields={state.adSkipShields || 0}
                  claimedRewardIds={state.claimedRewardIds}
                  importSpaceLimit={state.importSpaceLimit}
                  usedImportCount={usedImportSlots}
                  isUnlimitedImports={isUnlimitedImports}
                  hasPermanentOffline={hasPermanentOffline}
                  nextLockedThemeName={nextLockedTheme ? nextLockedTheme.name : null}
                  accentHex={currentTheme.hex}
                  onClaimReward={handleClaimReward}
                  onAddMoreSpace={handleAddMoreSpace}
                  onBuyShopItem={handleBuyShopItem}
                />
              )}

              {activeScreen === 'profile' && (
                <ProfileScreen
                  profile={state.profile}
                  themeId={state.themeId}
                  accentHex={currentTheme.hex}
                  totalListenSeconds={state.totalListenSeconds}
                  dopamineScore={state.dopamineScore}
                  coins={state.coins || 0}
                  streak={state.streak}
                  playlists={state.playlists}
                  claimedRewardIds={state.claimedRewardIds}
                  unlockedThemeIds={state.unlockedThemeIds || []}
                  notificationsEnabled={state.notificationsEnabled}
                  hapticsEnabled={state.hapticsEnabled !== false}
                  isOnline={isOnline}
                  hasPermanentOffline={hasPermanentOffline}
                  offlineStatusText={
                    hasPermanentOffline
                      ? 'FULL OFFLINE'
                      : offlinePassActive
                      ? `Offline Left: ${offlineLeftText}`
                      : isOnline
                      ? 'Online'
                      : 'Offline - Saved songs only'
                  }
                  crossfadeSeconds={state.crossfadeSeconds || 0}
                  onChangeCrossfade={(sec) => {
                    setState((prev) => ({ ...prev, crossfadeSeconds: sec }));
                    showToast(sec === 0 ? 'Crossfade Off' : `Crossfade set to ${sec}s`);
                  }}
                  onOpenWrapped={() => setWrappedOpen(true)}
                  onBackHome={() => setActiveScreen('home')}
                  onUpdateProfile={(nextProfile) =>
                    setState((prev) => ({ ...prev, profile: nextProfile }))
                  }
                  onSelectTheme={(nextThemeId) => {
                    setState((prev) => ({ ...prev, themeId: nextThemeId }));
                    const themeObj = getThemeById(nextThemeId);
                    showToast(`Theme switched to ${themeObj.name}`);
                  }}
                  onToggleNotifications={handleToggleNotifications}
                  onToggleHaptics={() => {
                    const nextEnabled = !(state.hapticsEnabled !== false);
                    setHapticsEnabled(nextEnabled);
                    setState((prev) => ({ ...prev, hapticsEnabled: nextEnabled }));
                    if (nextEnabled) hapticToggle();
                    showToast(nextEnabled ? 'Haptic feedback enabled' : 'Haptic feedback muted');
                  }}
                  onSendTestReminder={sendReminderNotification}
                  onRemoveAdsClick={() => showToast('ZORB Premium — Remove Ads coming soon!')}
                  onOpenPlaylist={(plId) => {
                    setLibraryTab('playlists');
                    setSelectedPlaylistId(plId);
                    setActiveScreen('library');
                  }}
                  onOpenRewards={() => setActiveScreen('rewards')}
                  onDevAction={handleDevAction}
                  onLogout={handleLogout}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Permanent Bottom Mini Player (Always visible when Full Player is closed) */}
      {!fullPlayerOpen && (
        <div className="fixed bottom-16 lg:bottom-4 left-2 right-2 lg:left-68 lg:right-6 z-30 max-w-5xl lg:mx-auto">
          <MiniPlayer
            song={currentSong}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            accentHex={currentTheme.hex}
            onOpenFull={() => setFullPlayerOpen(true)}
            onTogglePlay={togglePlay}
            onPrev={handlePrev}
            onNext={() => handleNext()}
          />
        </div>
      )}

      {/* Mobile Bottom Navigation Bar — 4 Tabs ONLY (Spotify-Style) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-black/95 backdrop-blur-md border-t border-white/10 grid grid-cols-4 items-center"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveScreen(item.id)}
              className="h-full flex flex-col items-center justify-center gap-1 active:scale-[0.95] transition-transform cursor-pointer"
              style={{
                color: active ? currentTheme.hex : '#B3B3B3',
                filter: active ? `drop-shadow(0 0 8px rgba(var(--zorb-accent-rgb), 0.45))` : 'none',
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Full-Screen Music Player Modal */}
      <FullPlayerModal
        isOpen={fullPlayerOpen}
        song={currentSong}
        queue={queue}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        shuffle={shuffle}
        repeatMode={repeatMode}
        speedMode={speedMode}
        eqPreset={eqPreset}
        crossfadeSeconds={state.crossfadeSeconds || 0}
        sleepTimerMode={sleepTimerMode}
        sleepRemainingSec={sleepRemainingSec}
        loopA={loopA}
        loopB={loopB}
        bookmarks={currentSong ? (state.songBookmarks || {})[currentSong.id] || [] : []}
        excludedShuffleSongIds={state.excludedShuffleSongIds || []}
        isLiked={currentSong ? state.likedSongIds.includes(currentSong.id) : false}
        isOffline={currentSong ? state.offlineSongIds.includes(currentSong.id) : false}
        accentHex={currentTheme.hex}
        dopamineGainToast={dopamineGainToast}
        onClose={() => setFullPlayerOpen(false)}
        onMinimizeToSystemBar={() => {
          setFullPlayerOpen(false);
          setShowSystemBar(true);
        }}
        onTogglePlay={togglePlay}
        onPrev={handlePrev}
        onNext={() => handleNext()}
        onSeek={handleSeek}
        onToggleShuffle={() => {
          hapticToggle();
          setShuffle((s) => !s);
        }}
        onCycleRepeat={() => {
          hapticToggle();
          setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'));
        }}
        onChangeSpeedMode={(mode) => {
          setSpeedMode(mode);
          showToast(
            mode === 'slowed'
              ? 'Phonk Slowed (0.85×)'
              : mode === 'sped'
              ? 'Sped Up (1.15×)'
              : 'Normal Speed (1.0×)'
          );
        }}
        onChangeEqPreset={(preset) => {
          setEqPreset(preset);
          showToast(
            preset === 'sub-bass'
              ? 'EQ: Phonk Sub-Bass'
              : preset === 'vocal-crisp'
              ? 'EQ: Vocal Crisp'
              : 'EQ: Flat'
          );
        }}
        onChangeCrossfade={(sec) => {
          setState((prev) => ({ ...prev, crossfadeSeconds: sec }));
        }}
        onSelectSleepTimer={(mode) => {
          setSleepTimerMode(mode);
          showToast(
            mode === 'off'
              ? 'Sleep timer off'
              : mode === 'end-of-track'
              ? 'Stopping at end of track'
              : `Sleep timer set for ${mode}`
          );
        }}
        onSetLoopA={(t) => {
          hapticToggle();
          setLoopA(t);
          if (t === null) setLoopB(null);
        }}
        onSetLoopB={(t) => {
          hapticToggle();
          setLoopB(t);
        }}
        onAddBookmark={handleAddBookmark}
        onDeleteBookmark={handleDeleteBookmark}
        onSaveClipToBeats={handleSaveClipToBeats}
        onSelectQueueSong={(qSong) => playSong(qSong, queue)}
        onMoveQueueItem={handleMoveQueueItem}
        onRemoveQueueItem={handleRemoveQueueItem}
        onToggleExcludeShuffle={handleToggleExcludeShuffle}
        onToggleLike={toggleLike}
        onOpenAddToPlaylist={(song) => setPlaylistPickerSong(song)}
        onToggleOffline={toggleOffline}
        onShare={handleShareSong}
      />

      {/* Year-Round Live ZORB Wrapped Modal */}
      <LiveWrappedModal
        isOpen={wrappedOpen}
        profile={state.profile}
        songs={allSongs}
        history={state.history}
        songPlayCounts={state.songPlayCounts || {}}
        listeningHours={state.listeningHours || {}}
        totalListenSeconds={state.totalListenSeconds}
        dopamineScore={state.dopamineScore}
        streak={state.streak}
        accentHex={currentTheme.hex}
        onPlaySong={(song) => {
          setWrappedOpen(false);
          playSong(song, allSongs);
          setFullPlayerOpen(true);
        }}
        onClose={() => setWrappedOpen(false)}
      />

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={Boolean(playlistPickerSong)}
        song={playlistPickerSong}
        playlists={state.playlists}
        accentHex={currentTheme.hex}
        onClose={() => setPlaylistPickerSong(null)}
        onToggleSongInPlaylist={handleToggleSongInPlaylist}
        onOpenCreateNew={(initialSongId) => {
          setCreatePlaylistInitialSongId(initialSongId);
          setCreatePlaylistOpen(true);
        }}
      />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={createPlaylistOpen}
        allSongs={allSongs}
        likedSongIds={state.likedSongIds}
        initialSongId={createPlaylistInitialSongId}
        accentHex={currentTheme.hex}
        onClose={() => setCreatePlaylistOpen(false)}
        onCreatePlaylist={handleCreatePlaylist}
      />

      {/* Import Audio From Phone/PC Storage Modal */}
      <ImportSongModal
        isOpen={importSongOpen}
        accentHex={currentTheme.hex}
        usedSlots={usedImportSlots}
        maxSlots={maxImportSlots}
        isUnlimited={isUnlimitedImports}
        canExpandMoreSpace={canExpandMoreSpace}
        onAddMoreSpace={handleAddMoreSpace}
        onClose={() => setImportSongOpen(false)}
        onImported={handleImportedSong}
      />

      {/* Auto Music Scan Prompt ("Allow ZORB to find your music") */}
      <MusicScanModal
        isOpen={musicScanOpen}
        accentHex={currentTheme.hex}
        usedSlots={usedImportSlots}
        maxSlots={maxImportSlots}
        isUnlimited={isUnlimitedImports}
        canExpandMoreSpace={canExpandMoreSpace}
        onAddMoreSpace={handleAddMoreSpace}
        onScanFiles={handleScanFiles}
        onOpenManualImport={() => setImportSongOpen(true)}
        onClose={() => setMusicScanOpen(false)}
      />

      {/* Offline Mode Gate & Reconnect Skipped-Ad Modal */}
      <OfflineGateModal
        isOpen={Boolean(offlineGateMode)}
        mode={offlineGateMode || 'offline-prompt'}
        carryOnCount={state.offlineCarryOnCount || 0}
        accentHex={currentTheme.hex}
        onWatchAdNow={() => {
          setOfflineGateMode(null);
          setOfflineAdPlayerOpen(true);
        }}
        onCarryOnLater={() => {
          dismissedOfflinePromptRef.current = true;
          setOfflineGateMode(null);
          setState((prev) => ({
            ...prev,
            offlineCarryOnCount: (prev.offlineCarryOnCount || 0) + 1,
            pendingSkippedAd: true,
          }));
          showToast('Carry On enabled — Watch Ad when online');
        }}
      />

      {/* 15s Demo Video Ad Player for 6-Hour Offline Unlock */}
      <DemoAdPlayerModal
        isOpen={offlineAdPlayerOpen}
        placement="offline_unlock_6h"
        accentHex={currentTheme.hex}
        onRewardCompleted={() => {
          hapticMilestone();
          setOfflineAdPlayerOpen(false);
          setOfflineGateMode(null);
          dismissedOfflinePromptRef.current = false;
          setNowMs(Date.now());
          setState((prev) => ({
            ...prev,
            offlineUnlockedUntil: Date.now() + OFFLINE_AD_UNLOCK_MS,
            offlineCarryOnCount: 0,
            pendingSkippedAd: false,
          }));
          showToast('6 Hours Offline Mode Unlocked!');
        }}
        onCancel={
          offlineGateMode === 'forced-reconnect-ad' || state.pendingSkippedAd
            ? undefined
            : () => setOfflineAdPlayerOpen(false)
        }
      />

      {/* Offline Full-Screen Ad Interstitial Modal (After every 6 Songs) */}
      <AdInterstitialModal
        isOpen={adModalOpen}
        accentHex={currentTheme.hex}
        onCloseAd={() => {
          setAdModalOpen(false);
          setState((prev) => ({ ...prev, songsPlayedSinceAd: 0 }));
        }}
        onLearnMorePremium={() => showToast('ZORB Premium — Remove Ads coming soon!')}
      />
    </div>
  );
}
