import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Flame, Home, Library, Search, User } from 'lucide-react';
import { INITIAL_SONGS } from './data/songs';
import { getThemeById } from './data/themes';
import {
  AppScreen,
  BeatMood,
  BeatPattern,
  LibraryTab,
  Playlist,
  RepeatMode,
  RewardMilestone,
  Song,
  UserProfile,
  ZorbPersistedState,
} from './types/zorb';
import {
  cacheSongOffline,
  clearPersistedState,
  createDefaultState,
  getLocalDateKey,
  loadPersistedState,
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
import { SplashScreen } from './components/SplashScreen';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ProfileSetup } from './components/ProfileSetup';
import { HomeScreen } from './components/HomeScreen';
import { SearchScreen } from './components/SearchScreen';
import { SoloBeatMaker } from './components/SoloBeatMaker';
import { LibraryScreen } from './components/LibraryScreen';
import { RewardsScreen } from './components/RewardsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { MiniPlayer, SystemMiniPlayerBar } from './components/MiniPlayer';
import { FullPlayerModal } from './components/FullPlayerModal';
import { AddToPlaylistModal, CreatePlaylistModal } from './components/PlaylistModals';
import { ImportSongModal } from './components/ImportSongModal';
import { AdInterstitialModal } from './components/AdInterstitialModal';
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
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [showSystemBar, setShowSystemBar] = useState(false);

  // Modals & Toasts
  const [playlistPickerSong, setPlaylistPickerSong] = useState<Song | null>(null);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const [importSongOpen, setImportSongOpen] = useState(false);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [createPlaylistInitialSongId, setCreatePlaylistInitialSongId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dopamineGainToast, setDopamineGainToast] = useState<number | null>(null);

  const lastTickTimeRef = useRef<number>(0);
  const shownOfflineToastRef = useRef<boolean>(false);
  const currentTheme = useMemo(() => getThemeById(state.themeId), [state.themeId]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2600);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    if (!showSplash && onboardingDone && state.hasOnboarded && !shownOfflineToastRef.current) {
      shownOfflineToastRef.current = true;
      showToast('Offline Mode');
    }
  }, [showSplash, onboardingDone, state.hasOnboarded, showToast]);

  // Persist state on changes
  useEffect(() => {
    savePersistedState(state);
  }, [state]);

  // Load device-imported audio tracks from IndexedDB on mount
  useEffect(() => {
    loadCustomTracks().then((tracks) => {
      setCustomSongs(tracks);
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

  // Listen to visibilitychange to surface top system mini-player bar when minimized/backgrounded
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && currentSong && isPlaying) {
        setShowSystemBar(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [currentSong, isPlaying]);

  // Log play history helper (strictly last 5 unique songs, newest first)
  const recordHistory = useCallback((songId: string) => {
    setState((prev) => ({
      ...prev,
      lastPlayedSongId: songId,
      history: [
        { songId, playedAt: new Date().toISOString() },
        ...prev.history.filter((entry) => entry.songId !== songId),
      ].slice(0, 5),
    }));
  }, []);

  // Offline Ads counter (triggers 1 interstitial after every 6 completed tracks)
  const registerCompletedSongForAd = useCallback(() => {
    setState((prev) => {
      const nextCount = (prev.songsPlayedSinceAd || 0) + 1;
      if (nextCount >= 6) {
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
  }, []);

  const playSong = useCallback(
    (song: Song, customQueue?: Song[]) => {
      if (customQueue) setQueue(customQueue);
      const audio = audioRef.current;
      if (!audio) return;

      const isSameSong = currentSong?.id === song.id;
      setCurrentSong(song);
      if (!isSameSong) {
        audio.src = song.audioUrl;
        audio.currentTime = 0;
        setCurrentTime(0);
        lastTickTimeRef.current = 0;
      }

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          recordHistory(song.id);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    },
    [currentSong, recordHistory]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
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

  const handleNext = useCallback(() => {
    if (queue.length === 0) return;
    if (!currentSong) {
      playSong(queue[0]);
      return;
    }
    if (shuffle && queue.length > 1) {
      const candidates = queue.filter((s) => s.id !== currentSong.id);
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      playSong(pick);
      return;
    }
    const idx = queue.findIndex((s) => s.id === currentSong.id);
    const nextIdx = (idx + 1) % queue.length;
    playSong(queue[nextIdx]);
  }, [queue, currentSong, shuffle, playSong]);

  const handlePrev = useCallback(() => {
    const audio = audioRef.current;
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

  // Credit real listening seconds -> dopamine + streak progress
  const creditListenSeconds = useCallback(
    (deltaSeconds: number) => {
      if (deltaSeconds <= 0) return;
      const todayKey = getLocalDateKey();

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
          setTimeout(() => showToast(`🔥 Day ${nextStreakCount} Streak Locked!`), 50);
        }

        return {
          ...prev,
          totalListenSeconds: nextTotalSeconds,
          dopamineScore: nextDopamine,
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

  // Sync MediaSession API for OS / browser lock-screen & notification bar controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: 'ZORB — Z = M × D²',
        artwork: [{ src: currentSong.cover, sizes: '512x512', type: 'image/jpeg' }],
      });
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') handleSeek(details.seekTime);
      });
    } catch {
      // Ignore unsupported MediaSession actions
    }
  }, [currentSong, togglePlay, handlePrev, handleNext, handleSeek]);

  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const now = audio.currentTime;
    setCurrentTime(now);

    const delta = now - lastTickTimeRef.current;
    if (delta >= 1 && delta < 5) {
      const wholeSec = Math.floor(delta);
      lastTickTimeRef.current += wholeSec;
      creditListenSeconds(wholeSec);
    } else if (delta < 0 || delta >= 5) {
      lastTickTimeRef.current = now;
    }
  };

  const handleAudioEnded = () => {
    // Song finished: Dopamine +10 animation & Streak time +1 min bonus
    setState((prev) => ({
      ...prev,
      dopamineScore: prev.dopamineScore + 10,
    }));
    creditListenSeconds(60);
    setDopamineGainToast(10);
    setTimeout(() => setDopamineGainToast(null), 2200);

    const willTriggerAd = (state.songsPlayedSinceAd || 0) + 1 >= 6;
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
    setState((prev) => {
      if (prev.claimedRewardIds.includes(reward.id)) return prev;
      return {
        ...prev,
        claimedRewardIds: [...prev.claimedRewardIds, reward.id],
        themeId: reward.themeId || prev.themeId,
      };
    });
    showToast(`Claimed: ${reward.badgeName}`);
  };

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
      />

      {/* Top System Mini-Player Notification Bar (when minimized / backgrounded) */}
      <AnimatePresence>
        {showSystemBar && currentSong && (
          <SystemMiniPlayerBar
            song={currentSong}
            isPlaying={isPlaying}
            accentHex={currentTheme.hex}
            onOpenFull={() => {
              setShowSystemBar(false);
              setFullPlayerOpen(true);
            }}
            onTogglePlay={togglePlay}
            onNext={handleNext}
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
        <main
          className={`flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 ${
            currentSong ? 'pb-36 lg:pb-28' : 'pb-24 lg:pb-10'
          }`}
        >
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
                  currentSong={currentSong}
                  isPlaying={isPlaying}
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
                  onOpenImportSong={() => setImportSongOpen(true)}
                />
              )}

              {activeScreen === 'search' && (
                <SearchScreen
                  songs={allSongs}
                  playlists={state.playlists}
                  searchHistory={state.searchHistory}
                  likedSongIds={state.likedSongIds}
                  offlineSongIds={state.offlineSongIds}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  accentHex={currentTheme.hex}
                  onPlaySong={(song) => {
                    playSong(song, allSongs);
                    setFullPlayerOpen(true);
                  }}
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
                  playlists={state.playlists}
                  history={state.history}
                  currentSong={currentSong}
                  accentHex={currentTheme.hex}
                  onChangeTab={setLibraryTab}
                  onSelectPlaylist={setSelectedPlaylistId}
                  onPlaySong={(song) => {
                    playSong(song, allSongs);
                    setFullPlayerOpen(true);
                  }}
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
                  onOpenImportSong={() => setImportSongOpen(true)}
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
                  claimedRewardIds={state.claimedRewardIds}
                  accentHex={currentTheme.hex}
                  onClaimReward={handleClaimReward}
                />
              )}

              {activeScreen === 'profile' && (
                <ProfileScreen
                  profile={state.profile}
                  themeId={state.themeId}
                  accentHex={currentTheme.hex}
                  totalListenSeconds={state.totalListenSeconds}
                  dopamineScore={state.dopamineScore}
                  streak={state.streak}
                  playlists={state.playlists}
                  claimedRewardIds={state.claimedRewardIds}
                  notificationsEnabled={state.notificationsEnabled}
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
                  onSendTestReminder={sendReminderNotification}
                  onRemoveAdsClick={() => showToast('ZORB Premium — Remove Ads coming soon!')}
                  onOpenPlaylist={(plId) => {
                    setLibraryTab('playlists');
                    setSelectedPlaylistId(plId);
                    setActiveScreen('library');
                  }}
                  onOpenRewards={() => setActiveScreen('rewards')}
                  onLogout={handleLogout}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Persistent Mini Player (Docked above Bottom Nav on mobile, bottom-right/bar on desktop) */}
      {currentSong && !fullPlayerOpen && (
        <div className="fixed bottom-16 lg:bottom-4 left-2 right-2 lg:left-68 lg:right-6 z-30 max-w-5xl lg:mx-auto">
          <MiniPlayer
            song={currentSong}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            accentHex={currentTheme.hex}
            onOpenFull={() => setFullPlayerOpen(true)}
            onTogglePlay={togglePlay}
            onNext={handleNext}
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
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        shuffle={shuffle}
        repeatMode={repeatMode}
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
        onNext={handleNext}
        onSeek={handleSeek}
        onToggleShuffle={() => setShuffle((s) => !s)}
        onCycleRepeat={() =>
          setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'))
        }
        onToggleLike={toggleLike}
        onOpenAddToPlaylist={(song) => setPlaylistPickerSong(song)}
        onToggleOffline={toggleOffline}
        onShare={handleShareSong}
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
        onClose={() => setImportSongOpen(false)}
        onImported={handleImportedSong}
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
