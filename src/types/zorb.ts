export type MusicPreference =
  | 'Phonk'
  | 'Chill Phonk'
  | 'Aggressive Phonk'
  | 'Drift Phonk'
  | 'Gym Phonk'
  | 'Night Drive'
  | 'Study'
  | 'Focus';

export type AppScreen =
  | 'home'
  | 'search'
  | 'library'
  | 'profile'
  | 'beat-maker'
  | 'rewards';

export type LibraryTab = 'playlists' | 'liked' | 'beats' | 'downloaded' | 'history';

export type LibrarySortOption = 'default' | 'title-asc' | 'artist-asc' | 'duration-desc';

export type RepeatMode = 'off' | 'all' | 'one';

export type AudioSpeedMode = 'normal' | 'slowed' | 'sped';

export type EqPresetId = 'flat' | 'sub-bass' | 'vocal-crisp';

export type SleepTimerMode = 'off' | '15m' | '30m' | '60m' | 'end-of-track';

export type CoinShopItemId = 'offline-6h' | 'ad-shield' | 'extra-space-5' | 'unlock-next-theme';

export type BeatMood = 'DARK' | 'AGGRESSIVE' | 'CHILL';

export type BeatLengthSeconds = 30 | 60 | 120;

export type BeatRowCategory = 'KICK' | 'BASS / 808' | 'HI-HAT / SNARE' | 'MELODY / FX';

export type BeatPadId =
  | 'kick-hard'
  | 'kick-deep'
  | 'kick-punchy'
  | 'kick-soft'
  | '808-dark'
  | '808-slide'
  | '808-heavy'
  | '808-sub'
  | 'hh-fast'
  | 'hh-slow'
  | 'snare'
  | 'clap'
  | 'dark-bell'
  | 'cowbell'
  | 'synth-pad'
  | 'vocal-hey';

export type BeatPattern = Record<BeatPadId, boolean[]>;

export interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  duration: number; // seconds
  genre: 'Phonk';
  tags: MusicPreference[];
  bpm: number;
}

export interface UserProfile {
  name: string;
  bio: string;
  avatar: string; // data URL or preset path
  preferences: MusicPreference[];
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  cover: string;
  songIds: string[];
  createdAt: string;
}

export interface HistoryEntry {
  songId: string;
  playedAt: string;
}

export interface SongBookmark {
  id: string;
  time: number;
  label: string;
}

export interface ThemeOption {
  id: string;
  name: string;
  hex: string;
  rgb: string;
  unlockDay: number; // 0 = available initially
  badgeLabel?: string;
}

export interface RewardMilestone {
  id: string;
  day: number;
  title: string;
  subtitle: string;
  type: 'theme' | 'space' | 'offline' | 'coins' | 'frame' | 'banner' | 'elite' | 'master' | 'legend';
  badgeName: string;
  themeId?: string;
  coinsBonus?: number;
  description: string;
}

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  totalDays: number;
  completedDates: string[]; // YYYY-MM-DD
  dailyListenSeconds: Record<string, number>;
  lastEvaluatedDate: string; // YYYY-MM-DD
  streakBrokenModalPending: boolean;
}

export interface ZorbPersistedState {
  hasOnboarded: boolean;
  profile: UserProfile | null;
  themeId: string;
  likedSongIds: string[];
  offlineSongIds: string[];
  playlists: Playlist[];
  history: HistoryEntry[];
  searchHistory: string[];
  dopamineScore: number;
  coins: number;
  dopamineHistory: { label: string; score: number; minutes: number }[];
  totalListenSeconds: number;
  streak: StreakState;
  claimedRewardIds: string[];
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  lastPlayedSongId: string | null;
  songsPlayedSinceAd?: number;
  adSkipShields: number;
  unlockedThemeIds: string[];
  // Extra Space & Auto Scan
  importSpaceLimit: number; // Starts at 10, expandable +5 up to 25 before Day 15
  hasPromptedMusicScan: boolean;
  // Offline Ad Unlock System
  offlineUnlockedUntil: number | null; // Epoch ms (6 hours per ad)
  offlineCarryOnCount: number; // Max 2 carry-ons before Watch Ad is mandatory
  pendingSkippedAd: boolean; // True if user clicked Carry On and hasn't watched ad yet
  // Spotify-Upgrade Features
  songBookmarks: Record<string, SongBookmark[]>;
  excludedShuffleSongIds: string[];
  crossfadeSeconds: number; // 0 to 6 seconds
  songPlayCounts: Record<string, number>;
  listeningHours: Record<number, number>; // hour 0..23 -> total seconds
}
