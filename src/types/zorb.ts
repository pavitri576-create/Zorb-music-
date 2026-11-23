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

export type RepeatMode = 'off' | 'all' | 'one';

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
  type: 'theme' | 'cap' | 'hoodie' | 'frame' | 'banner' | 'elite' | 'master' | 'legend';
  badgeName: string;
  themeId?: string;
  image?: string;
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
  dopamineHistory: { label: string; score: number; minutes: number }[];
  totalListenSeconds: number;
  streak: StreakState;
  claimedRewardIds: string[];
  notificationsEnabled: boolean;
  lastPlayedSongId: string | null;
  songsPlayedSinceAd?: number;
}
