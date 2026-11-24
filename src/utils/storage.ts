import { StreakState, ZorbPersistedState } from '../types/zorb';

const STORAGE_KEY = 'zorb_app_state_v1';
const OFFLINE_CACHE_NAME = 'zorb-offline-audio-v1';

export const STREAK_DAILY_THRESHOLD_SECONDS = 600; // 10 minutes per day
export const INITIAL_IMPORT_SPACE = 10;
export const PRE_DAY15_MAX_IMPORT_SPACE = 25;
export const OFFLINE_AD_UNLOCK_MS = 6 * 60 * 60 * 1000; // 6 Hours
export const MAX_OFFLINE_CARRY_ONS = 2;

export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPreviousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return getLocalDateKey(dt);
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function getUserRank(streak: number, dopamine: number): string {
  if (streak >= 200 || dopamine >= 25000) return 'ZORB Legend';
  if (streak >= 50 || dopamine >= 8000) return 'ZORB Elite';
  if (streak >= 15 || dopamine >= 2500) return 'Isagi Level';
  if (streak >= 3 || dopamine >= 400) return 'Flow Striker';
  return 'ZORB Rookie';
}

export function calculateQuadraticDopamine(minutes: number): number {
  const safeMin = Math.max(0, minutes);
  return Math.round(safeMin * safeMin * 0.45 + safeMin * 6);
}

export function hasUnlimitedImportReward(state: Pick<ZorbPersistedState, 'streak' | 'claimedRewardIds'>): boolean {
  return (
    state.streak.currentStreak >= 15 ||
    state.streak.bestStreak >= 15 ||
    state.claimedRewardIds.includes('reward-day-15')
  );
}

export function hasPermanentOfflineReward(state: Pick<ZorbPersistedState, 'streak' | 'claimedRewardIds'>): boolean {
  return (
    state.streak.currentStreak >= 30 ||
    state.streak.bestStreak >= 30 ||
    state.claimedRewardIds.includes('reward-day-30')
  );
}

export function isOfflineAdPassActive(
  state: Pick<ZorbPersistedState, 'offlineUnlockedUntil' | 'streak' | 'claimedRewardIds'>,
  nowMs: number = Date.now()
): boolean {
  if (hasPermanentOfflineReward(state)) return true;
  return Boolean(state.offlineUnlockedUntil && state.offlineUnlockedUntil > nowMs);
}

export function formatOfflineLeft(unlockedUntil: number | null, nowMs: number = Date.now()): string {
  if (!unlockedUntil || unlockedUntil <= nowMs) return '0h 00m';
  const remainingSec = Math.max(0, Math.floor((unlockedUntil - nowMs) / 1000));
  const hrs = Math.floor(remainingSec / 3600);
  const mins = Math.floor((remainingSec % 3600) / 60);
  return `${hrs}h ${String(mins).padStart(2, '0')}m`;
}

export function createDefaultState(): ZorbPersistedState {
  const today = getLocalDateKey();
  return {
    hasOnboarded: false,
    profile: null,
    themeId: 'red-ego',
    likedSongIds: [],
    offlineSongIds: [],
    playlists: [],
    history: [],
    searchHistory: [],
    dopamineScore: 0,
    coins: 100,
    dopamineHistory: [
      { label: '0m', score: 0, minutes: 0 },
      { label: '5m', score: calculateQuadraticDopamine(5), minutes: 5 },
      { label: '10m', score: calculateQuadraticDopamine(10), minutes: 10 },
      { label: '15m', score: calculateQuadraticDopamine(15), minutes: 15 },
      { label: '20m', score: calculateQuadraticDopamine(20), minutes: 20 },
      { label: '30m', score: calculateQuadraticDopamine(30), minutes: 30 },
    ],
    totalListenSeconds: 0,
    streak: {
      currentStreak: 0,
      bestStreak: 0,
      totalDays: 0,
      completedDates: [],
      dailyListenSeconds: { [today]: 0 },
      lastEvaluatedDate: today,
      streakBrokenModalPending: false,
    },
    claimedRewardIds: [],
    notificationsEnabled: false,
    hapticsEnabled: true,
    lastPlayedSongId: null,
    songsPlayedSinceAd: 0,
    adSkipShields: 0,
    unlockedThemeIds: [],
    importSpaceLimit: INITIAL_IMPORT_SPACE,
    hasPromptedMusicScan: false,
    offlineUnlockedUntil: null,
    offlineCarryOnCount: 0,
    pendingSkippedAd: false,
    songBookmarks: {},
    excludedShuffleSongIds: [],
    crossfadeSeconds: 0,
    songPlayCounts: {},
    listeningHours: {},
  };
}

export function evaluateStreakRollover(streak: StreakState): StreakState {
  const today = getLocalDateKey();
  if (streak.lastEvaluatedDate === today) {
    return streak;
  }

  const yesterday = getPreviousDateKey(today);
  const completedSet = new Set(streak.completedDates);

  const missedYesterday =
    streak.lastEvaluatedDate < yesterday ||
    (streak.lastEvaluatedDate === yesterday && !completedSet.has(yesterday));

  if (missedYesterday && streak.currentStreak > 0) {
    return {
      ...streak,
      currentStreak: 0,
      lastEvaluatedDate: today,
      streakBrokenModalPending: true,
      dailyListenSeconds: {
        ...streak.dailyListenSeconds,
        [today]: streak.dailyListenSeconds[today] || 0,
      },
    };
  }

  return {
    ...streak,
    lastEvaluatedDate: today,
    dailyListenSeconds: {
      ...streak.dailyListenSeconds,
      [today]: streak.dailyListenSeconds[today] || 0,
    },
  };
}

export function loadPersistedState(): ZorbPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as Partial<ZorbPersistedState>;
    const defaults = createDefaultState();

    const dedupedHistory = (parsed.history || [])
      .filter((entry, index, arr) => arr.findIndex((x) => x.songId === entry.songId) === index)
      .slice(0, 5);
    const dedupedSearch = (parsed.searchHistory || []).slice(0, 5);

    return {
      ...defaults,
      ...parsed,
      history: dedupedHistory,
      searchHistory: dedupedSearch,
      hapticsEnabled: typeof parsed.hapticsEnabled === 'boolean' ? parsed.hapticsEnabled : true,
      coins: typeof parsed.coins === 'number' ? parsed.coins : defaults.coins,
      songsPlayedSinceAd: typeof parsed.songsPlayedSinceAd === 'number' ? parsed.songsPlayedSinceAd : 0,
      adSkipShields: typeof parsed.adSkipShields === 'number' ? Math.max(0, parsed.adSkipShields) : 0,
      unlockedThemeIds: Array.isArray(parsed.unlockedThemeIds) ? parsed.unlockedThemeIds : [],
      importSpaceLimit:
        typeof parsed.importSpaceLimit === 'number'
          ? Math.max(INITIAL_IMPORT_SPACE, parsed.importSpaceLimit)
          : INITIAL_IMPORT_SPACE,
      hasPromptedMusicScan: Boolean(parsed.hasPromptedMusicScan),
      offlineUnlockedUntil:
        typeof parsed.offlineUnlockedUntil === 'number' ? parsed.offlineUnlockedUntil : null,
      offlineCarryOnCount:
        typeof parsed.offlineCarryOnCount === 'number' ? parsed.offlineCarryOnCount : 0,
      pendingSkippedAd: Boolean(parsed.pendingSkippedAd),
      songBookmarks:
        parsed.songBookmarks && typeof parsed.songBookmarks === 'object' ? parsed.songBookmarks : {},
      excludedShuffleSongIds: Array.isArray(parsed.excludedShuffleSongIds)
        ? parsed.excludedShuffleSongIds
        : [],
      crossfadeSeconds:
        typeof parsed.crossfadeSeconds === 'number'
          ? Math.max(0, Math.min(6, parsed.crossfadeSeconds))
          : 0,
      songPlayCounts:
        parsed.songPlayCounts && typeof parsed.songPlayCounts === 'object'
          ? parsed.songPlayCounts
          : {},
      listeningHours:
        parsed.listeningHours && typeof parsed.listeningHours === 'object'
          ? parsed.listeningHours
          : {},
      streak: evaluateStreakRollover({
        ...defaults.streak,
        ...(parsed.streak || {}),
      }),
    };
  } catch {
    return createDefaultState();
  }
}

export function savePersistedState(state: ZorbPersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota warnings cleanly
  }
}

export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export async function cacheSongOffline(audioUrl: string): Promise<boolean> {
  try {
    if (!('caches' in window)) return true;
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    const response = await fetch(audioUrl);
    if (!response.ok) return false;
    await cache.put(audioUrl, response);
    return true;
  } catch {
    return false;
  }
}

export async function removeSongOfflineCache(audioUrl: string): Promise<void> {
  try {
    if (!('caches' in window)) return;
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    await cache.delete(audioUrl);
  } catch {
    // Ignore
  }
}

export async function isUrlCachedOffline(audioUrl: string): Promise<boolean> {
  try {
    if (audioUrl.startsWith('blob:') || audioUrl.startsWith('data:')) return true;
    if (!('caches' in window)) return false;
    const match = await caches.match(audioUrl);
    return Boolean(match);
  } catch {
    return false;
  }
}
