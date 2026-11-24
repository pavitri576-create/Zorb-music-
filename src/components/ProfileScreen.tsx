import React, { useState } from 'react';
import {
  ArrowLeft,
  AudioLines,
  Award,
  Bell,
  BellOff,
  Camera,
  Check,
  Coins,
  Crown,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  Lock,
  LogOut,
  Palette,
  Save,
  Sparkles,
  Terminal,
  Unlock,
  Vibrate,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { REWARD_MILESTONES } from '../data/rewards';
import { ALL_MUSIC_PREFERENCES } from '../data/songs';
import { THEME_OPTIONS } from '../data/themes';
import { getUserRank } from '../utils/storage';
import { hapticError, hapticMilestone } from '../utils/haptics';
import { MusicPreference, Playlist, StreakState, UserProfile } from '../types/zorb';
import { AvatarCropperModal } from './AvatarCropperModal';

export type DeveloperAction =
  | 'add-streak-day'
  | 'set-streak-15'
  | 'set-streak-30'
  | 'reset-streak'
  | 'add-500-coins'
  | 'add-1000-dopamine'
  | 'unlock-6h-offline'
  | 'clear-offline-locks'
  | 'trigger-ad-now'
  | 'replay-splash'
  | 'reset-scan-prompt';

interface ProfileScreenProps {
  profile: UserProfile;
  themeId: string;
  accentHex: string;
  totalListenSeconds: number;
  dopamineScore: number;
  coins: number;
  streak: StreakState;
  playlists: Playlist[];
  claimedRewardIds: string[];
  unlockedThemeIds: string[];
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  isOnline: boolean;
  hasPermanentOffline: boolean;
  offlineStatusText: string;
  crossfadeSeconds: number;
  onChangeCrossfade: (seconds: number) => void;
  onOpenWrapped: () => void;
  onBackHome: () => void;
  onUpdateProfile: (next: UserProfile) => void;
  onSelectTheme: (themeId: string) => void;
  onToggleNotifications: () => void;
  onToggleHaptics: () => void;
  onSendTestReminder: () => void;
  onRemoveAdsClick: () => void;
  onOpenPlaylist: (playlistId: string) => void;
  onOpenRewards?: () => void;
  onDevAction: (action: DeveloperAction) => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  themeId,
  accentHex,
  totalListenSeconds,
  dopamineScore,
  coins,
  streak,
  playlists,
  claimedRewardIds,
  unlockedThemeIds,
  notificationsEnabled,
  hapticsEnabled,
  isOnline,
  hasPermanentOffline,
  offlineStatusText,
  crossfadeSeconds,
  onChangeCrossfade,
  onOpenWrapped,
  onBackHome,
  onUpdateProfile,
  onSelectTheme,
  onToggleNotifications,
  onToggleHaptics,
  onSendTestReminder,
  onRemoveAdsClick,
  onOpenPlaylist,
  onOpenRewards,
  onDevAction,
  onLogout,
}) => {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [preferences, setPreferences] = useState<MusicPreference[]>(profile.preferences);
  const [cropOpen, setCropOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Developer Mode state
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [devPasswordModalOpen, setDevPasswordModalOpen] = useState(false);
  const [devPasswordInput, setDevPasswordInput] = useState('');
  const [devPasswordError, setDevPasswordError] = useState('');
  const [showDevPassword, setShowDevPassword] = useState(false);

  const totalHours = (totalListenSeconds / 3600).toFixed(2);
  const currentRank = getUserRank(streak.currentStreak, dopamineScore);
  const hasCrown = claimedRewardIds.includes('reward-day-200');

  const claimedBadges = REWARD_MILESTONES.filter((m) => claimedRewardIds.includes(m.id));

  const togglePref = (pref: MusicPreference) => {
    setPreferences((prev) => {
      if (prev.includes(pref)) {
        return prev.length > 1 ? prev.filter((p) => p !== pref) : prev;
      }
      return [...prev, pref];
    });
  };

  const handleSaveProfile = () => {
    onUpdateProfile({
      ...profile,
      name: name.trim() || profile.name,
      bio: bio.trim() || 'Locked into Z = M × D²',
      preferences,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white min-h-[44px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono-tabular font-semibold text-zinc-300">
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" style={{ color: accentHex }} />
            )}
            {offlineStatusText}
          </span>
          <span
            className="text-xs font-mono-tabular font-semibold uppercase tracking-widest"
            style={{ color: accentHex }}
          >
            {currentRank}
          </span>
        </div>
      </div>

      {/* Top Avatar + Rank Card */}
      <div className="rounded-2xl bg-[#121212] border border-white/10 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5">
        <div className="relative shrink-0">
          {hasCrown && (
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-7 h-7 rounded-full bg-black border flex items-center justify-center"
              style={{ borderColor: accentHex, color: accentHex }}
              title="Day 200 ZORB LEGEND Crown"
            >
              <Crown className="w-4 h-4" />
            </div>
          )}
          <div
            className="w-24 h-24 rounded-full overflow-hidden border-2 p-0.5 bg-black"
            style={{
              borderColor: accentHex,
              boxShadow: `0 0 24px rgba(var(--zorb-accent-rgb), 0.32)`,
            }}
          >
            <img
              src={profile.avatar}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <button
            type="button"
            onClick={() => setCropOpen(true)}
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full text-black flex items-center justify-center shadow-lg cursor-pointer"
            style={{ backgroundColor: accentHex }}
            aria-label="Edit profile photo"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 w-full flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="profile-name-edit" className="text-[11px] font-medium text-zinc-400">
                Name
              </label>
              <input
                id="profile-name-edit"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={32}
                className="h-11 px-3.5 rounded-xl bg-black border border-white/15 text-sm font-semibold text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="profile-bio-edit" className="text-[11px] font-medium text-zinc-400">
                Bio
              </label>
              <input
                id="profile-bio-edit"
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={90}
                className="h-11 px-3.5 rounded-xl bg-black border border-white/15 text-sm text-white focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-zinc-400">Music Preferences</span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_MUSIC_PREFERENCES.map((pref) => {
                const active = preferences.includes(pref);
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => togglePref(pref)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      active
                        ? 'text-black border-transparent'
                        : 'bg-black text-zinc-400 border-white/10 hover:text-white'
                    }`}
                    style={active ? { backgroundColor: accentHex } : undefined}
                  >
                    {pref}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSaveProfile}
              className="h-10 px-4 rounded-xl text-xs font-bold text-black inline-flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
              style={{ backgroundColor: accentHex }}
            >
              {savedNotice ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {savedNotice ? 'Profile Saved' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-[#121212] border border-white/10 p-4">
          <p className="text-xs text-[#B3B3B3]">Hours Listened</p>
          <p className="font-display text-3xl font-extrabold tabular-nums text-white mt-1">
            {totalHours} <span className="text-sm font-normal text-[#B3B3B3]">hrs</span>
          </p>
        </div>

        <div className="rounded-2xl bg-[#121212] border border-white/10 p-4">
          <p className="text-xs text-[#B3B3B3]">Total Dopamine</p>
          <p className="font-display text-3xl font-extrabold tabular-nums mt-1" style={{ color: accentHex }}>
            {dopamineScore.toLocaleString()}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenRewards?.()}
          className="rounded-2xl bg-[#121212] border border-white/10 hover:border-white/25 p-4 text-left active:scale-[0.97] transition-transform cursor-pointer"
        >
          <p className="text-xs text-[#B3B3B3]">Best Streak</p>
          <p className="font-display text-3xl font-extrabold tabular-nums text-white mt-1 inline-flex items-center gap-1.5">
            <Flame className="w-5 h-5" style={{ color: accentHex }} />
            {streak.bestStreak}d
          </p>
        </button>

        <button
          type="button"
          onClick={() => onOpenRewards?.()}
          className="rounded-2xl bg-[#121212] border border-white/10 hover:border-white/25 p-4 text-left active:scale-[0.97] transition-transform cursor-pointer"
        >
          <p className="text-xs text-[#B3B3B3]">ZORB Coins &amp; Rank</p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1 inline-flex items-center gap-1.5 truncate">
            <Coins className="w-5 h-5 shrink-0" style={{ color: accentHex }} />
            {coins.toLocaleString()}
          </p>
          <p className="text-[10px] font-mono-tabular text-[#B3B3B3] uppercase mt-0.5 truncate">
            {currentRank} · {hasPermanentOffline ? 'FULL OFFLINE' : offlineStatusText}
          </p>
        </button>
      </div>

      {/* Live "ZORB Wrapped" Anytime Card */}
      <button
        type="button"
        onClick={onOpenWrapped}
        className="rounded-2xl bg-[#121212] hover:bg-[#181818] border border-white/15 p-4 sm:p-5 flex items-center justify-between gap-4 text-left active:scale-[0.98] transition-all cursor-pointer"
        style={{
          boxShadow: `0 0 28px rgba(var(--zorb-accent-rgb), 0.14)`,
        }}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-black shrink-0"
            style={{ backgroundColor: accentHex }}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-mono-tabular uppercase tracking-wider" style={{ color: accentHex }}>
              Year-Round Live Stats
            </p>
            <h2 className="text-base sm:text-lg font-bold text-white truncate">
              Open Your Live ZORB Wrapped
            </h2>
            <p className="text-xs text-[#B3B3B3] truncate">
              Top played tracks, peak hour, vibe &amp; shareable card anytime
            </p>
          </div>
        </div>
        <span
          className="px-4 py-2 rounded-full text-xs font-bold text-black shrink-0"
          style={{ backgroundColor: accentHex }}
        >
          View Wrapped
        </span>
      </button>

      {/* Claimed Badges Showcase */}
      {claimedBadges.length > 0 && (
        <section className="rounded-2xl bg-[#121212] border border-white/10 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4" style={{ color: accentHex }} />
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">
              Claimed Badges ({claimedBadges.length})
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {claimedBadges.map((b) => (
              <span
                key={b.id}
                className="px-3 py-1.5 rounded-xl bg-black border text-xs font-semibold text-white inline-flex items-center gap-1.5"
                style={{ borderColor: accentHex }}
              >
                <Award className="w-3.5 h-3.5" style={{ color: accentHex }} />
                {b.badgeName}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* My Playlists Preview */}
      <section className="rounded-2xl bg-[#121212] border border-white/10 p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">
            My Playlists
          </h2>
          <span className="text-xs font-mono-tabular text-zinc-400">{playlists.length} saved</span>
        </div>
        {playlists.length === 0 ? (
          <p className="text-xs text-zinc-500">
            Create playlists in Library to see them featured on your profile.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {playlists.slice(0, 6).map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={() => onOpenPlaylist(pl.id)}
                className="p-2.5 rounded-xl bg-black border border-white/10 hover:border-white/25 flex items-center gap-3 text-left cursor-pointer"
              >
                <img
                  src={pl.cover}
                  alt={pl.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{pl.name}</p>
                  <p className="text-[11px] text-zinc-400 font-mono-tabular">
                    {pl.songIds.length} tracks
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Settings: Theme Color Change, Notifications, Logout */}
      <section className="rounded-2xl bg-[#121212] border border-white/10 p-5 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" style={{ color: accentHex }} />
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide">
            Theme Color System
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {THEME_OPTIONS.map((t) => {
            const isUnlocked =
              t.unlockDay === 0 ||
              streak.bestStreak >= t.unlockDay ||
              streak.currentStreak >= t.unlockDay ||
              unlockedThemeIds.includes(t.id);
            const selected = themeId === t.id;
            const daysRemaining = Math.max(0, t.unlockDay - streak.currentStreak);

            return (
              <button
                key={t.id}
                type="button"
                disabled={!isUnlocked}
                onClick={() => isUnlocked && onSelectTheme(t.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                  isUnlocked
                    ? 'bg-black hover:border-white/30 cursor-pointer active:scale-95'
                    : 'bg-black/40 border-white/5 opacity-55 cursor-not-allowed'
                }`}
                style={selected ? { borderColor: t.hex, boxShadow: `0 0 18px ${t.hex}40` } : undefined}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="w-5 h-5 rounded-full border border-white/20"
                    style={{ backgroundColor: t.hex }}
                  />
                  {selected ? (
                    <Check className="w-4 h-4" style={{ color: t.hex }} />
                  ) : !isUnlocked ? (
                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  ) : null}
                </div>
                <p className="text-xs font-bold text-white truncate">{t.name}</p>
                <p className="text-[10px] font-mono-tabular text-zinc-400">
                  {isUnlocked
                    ? t.unlockDay === 0
                      ? 'Starter'
                      : unlockedThemeIds.includes(t.id) && streak.bestStreak < t.unlockDay
                      ? 'Shop Unlocked'
                      : `Day ${t.unlockDay} Unlocked`
                    : `Unlock in ${daysRemaining}d`}
                </p>
              </button>
            );
          })}
        </div>

        {/* Smooth Crossfade Between Tracks (0s - 6s) */}
        <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-zinc-300">
                <AudioLines className="w-4 h-4" style={{ color: accentHex }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Smooth Crossfade</p>
                <p className="text-xs text-zinc-400">
                  Gapless fade out/in transition between consecutive tracks
                </p>
              </div>
            </div>
            <span className="text-xs font-mono-tabular font-bold" style={{ color: accentHex }}>
              {crossfadeSeconds === 0 ? 'Off' : `${crossfadeSeconds}s`}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={6}
            step={1}
            value={crossfadeSeconds}
            onChange={(e) => onChangeCrossfade(Number(e.target.value))}
            aria-label="Crossfade duration in seconds"
            className="w-full h-1.5 rounded-full bg-white/15 appearance-none cursor-pointer"
            style={{ accentColor: accentHex }}
          />
        </div>

        <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-zinc-300">
              {notificationsEnabled ? (
                <Bell className="w-4 h-4" style={{ color: accentHex }} />
              ) : (
                <BellOff className="w-4 h-4 text-zinc-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Daily Streak Notifications</p>
              <p className="text-xs text-zinc-400">
                &ldquo;Time for ZORB — Your streak is waiting&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notificationsEnabled && (
              <button
                type="button"
                onClick={onSendTestReminder}
                className="h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-200 cursor-pointer"
              >
                Test Reminder
              </button>
            )}
            <button
              type="button"
              onClick={onToggleNotifications}
              className={`h-10 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                notificationsEnabled ? 'text-black' : 'bg-white/10 text-white'
              }`}
              style={notificationsEnabled ? { backgroundColor: accentHex } : undefined}
            >
              {notificationsEnabled ? 'Notifications On' : 'Turn On'}
            </button>
          </div>
        </div>

        {/* Haptic Feedback (navigator.vibrate) Toggle */}
        <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-zinc-300">
              <Vibrate
                className="w-4 h-4"
                style={hapticsEnabled ? { color: accentHex } : undefined}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Haptic Feedback</p>
              <p className="text-xs text-zinc-400">
                Tactile vibration for taps, track skips &amp; streak milestones
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleHaptics}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              hapticsEnabled ? 'text-black' : 'bg-white/10 text-white'
            }`}
            style={hapticsEnabled ? { backgroundColor: accentHex } : undefined}
          >
            {hapticsEnabled ? 'Haptics On' : 'Off'}
          </button>
        </div>

        {/* Remove Ads — ZORB Premium (Offline Placeholder) */}
        <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-black border flex items-center justify-center"
              style={{ borderColor: accentHex, color: accentHex }}
            >
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Remove Ads — ZORB Premium</p>
              <p className="text-xs text-[#B3B3B3]">
                Play unlimited music &amp; beats without 6-track breaks
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRemoveAdsClick}
            className="h-10 px-4 rounded-xl text-xs font-bold text-black cursor-pointer shrink-0 active:scale-95 transition-transform"
            style={{ backgroundColor: accentHex }}
          >
            ZORB Premium
          </button>
        </div>

        <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-black border border-white/15 flex items-center justify-center shrink-0"
              style={devUnlocked ? { borderColor: accentHex, color: accentHex } : undefined}
            >
              <Terminal className="w-4 h-4 text-zinc-300" style={devUnlocked ? { color: accentHex } : undefined} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Developer Mode</p>
              <p className="text-xs text-zinc-400">
                {devUnlocked
                  ? 'Unlocked — Quick streak, coins, offline & splash controls'
                  : 'Password-protected testing & studio tools'}
              </p>
            </div>
          </div>

          {devUnlocked ? (
            <button
              type="button"
              onClick={() => setDevUnlocked(false)}
              className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Lock className="w-3.5 h-3.5" /> Lock
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDevPasswordInput('');
                setDevPasswordError('');
                setShowDevPassword(false);
                setDevPasswordModalOpen(true);
              }}
              className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5" /> Unlock
            </button>
          )}
        </div>

        {/* Unlocked Developer Console Panel */}
        {devUnlocked && (
          <div className="rounded-xl bg-black border border-white/15 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Unlock className="w-4 h-4" style={{ color: accentHex }} />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Developer Controls
                </span>
              </div>
              <span className="text-[11px] font-mono-tabular text-zinc-400">
                Streak {streak.currentStreak}d · {coins} Coins
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onDevAction('add-streak-day')}
                className="min-h-[40px] px-3 py-2 rounded-lg bg-[#121212] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white text-left cursor-pointer"
              >
                +1 Day Streak
              </button>
              <button
                type="button"
                onClick={() => onDevAction('set-streak-15')}
                className="min-h-[40px] px-3 py-2 rounded-lg bg-[#121212] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white text-left cursor-pointer"
              >
                Set Day 15 (25+ Slots)
              </button>
              <button
                type="button"
                onClick={() => onDevAction('set-streak-30')}
                className="min-h-[40px] px-3 py-2 rounded-lg bg-[#121212] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white text-left cursor-pointer"
              >
                Set Day 30 (Full Offline)
              </button>
              <button
                type="button"
                onClick={() => onDevAction('add-500-coins')}
                className="min-h-[40px] px-3 py-2 rounded-lg bg-[#121212] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white text-left cursor-pointer"
              >
                +500 Coins
              </button>
              <button
                type="button"
                onClick={() => onDevAction('add-1000-dopamine')}
                className="min-h-[40px] px-3 py-2 rounded-lg bg-[#121212] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white text-left cursor-pointer"
              >
                +1,000 Dopamine
              </button>
              <button
                type="button"
                onClick={() => onDevAction('unlock-6h-offline')}
                className="min-h-[40px] px-3 py-2 rounded-lg bg-[#121212] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white text-left cursor-pointer"
              >
                Grant 6h Offline Pass
              </button>
              <button
                type="button"
                onClick={() => onDevAction('trigger-ad-now')}
                className="min-h-[40px] px-3 py-2 rounded-lg bg-[#121212] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white text-left cursor-pointer"
              >
                Preview 15s Video Ad
              </button>
              <button
                type="button"
                onClick={() => onDevAction('replay-splash')}
                className="min-h-[40px] px-3 py-2 rounded-lg bg-[#121212] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white text-left cursor-pointer"
              >
                Replay Intro Animation
              </button>
              <button
                type="button"
                onClick={() => onDevAction('clear-offline-locks')}
                className="min-h-[40px] px-3 py-2 rounded-lg bg-[#121212] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white text-left cursor-pointer"
              >
                Reset Ad &amp; Skip Locks
              </button>
              <button
                type="button"
                onClick={() => onDevAction('reset-scan-prompt')}
                className="min-h-[40px] px-3 py-2 rounded-lg bg-[#121212] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white text-left cursor-pointer"
              >
                Re-arm Music Scan
              </button>
              <button
                type="button"
                onClick={() => onDevAction('reset-streak')}
                className="min-h-[40px] px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-xs font-semibold text-rose-400 text-left cursor-pointer"
              >
                Reset Streak to 0
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Local Offline Storage</p>
            <p className="text-xs text-zinc-400">Reset local profile &amp; streak data on this device</p>
          </div>

          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className="h-10 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-xs font-semibold text-rose-400 inline-flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Reset Profile
          </button>
        </div>
      </section>

      {/* Developer Mode Password Modal */}
      {devPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Developer Mode Password"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (devPasswordInput.trim().toLowerCase() === 'aditya') {
                hapticMilestone();
                setDevUnlocked(true);
                setDevPasswordModalOpen(false);
                setDevPasswordInput('');
                setDevPasswordError('');
              } else {
                hapticError();
                setDevPasswordError('Incorrect password. Please try again.');
              }
            }}
            className="w-full max-w-sm rounded-2xl bg-[#121212] border border-white/15 p-5 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl bg-black border flex items-center justify-center shrink-0"
                style={{ borderColor: accentHex, color: accentHex }}
              >
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold uppercase leading-none text-white">
                  Developer Mode
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Enter developer password to continue
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="dev-mode-password" className="text-[11px] font-medium text-zinc-400">
                Password
              </label>
              <div className="relative">
                <input
                  id="dev-mode-password"
                  type={showDevPassword ? 'text' : 'password'}
                  value={devPasswordInput}
                  onChange={(e) => {
                    setDevPasswordInput(e.target.value);
                    if (devPasswordError) setDevPasswordError('');
                  }}
                  placeholder="Enter password"
                  autoFocus
                  className="w-full h-11 pl-3.5 pr-11 rounded-xl bg-black border border-white/15 text-sm text-white focus:outline-none focus:border-white/40"
                />
                <button
                  type="button"
                  onClick={() => setShowDevPassword((v) => !v)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                  aria-label={showDevPassword ? 'Hide password' : 'Show password'}
                >
                  {showDevPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {devPasswordError && (
                <p className="text-xs font-medium text-rose-400">{devPasswordError}</p>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDevPasswordModalOpen(false);
                  setDevPasswordError('');
                }}
                className="flex-1 h-11 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-11 rounded-xl text-xs font-bold text-black cursor-pointer active:scale-95 transition-transform"
                style={{ backgroundColor: accentHex }}
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Local Data Confirmation Modal (never window.confirm) */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#121212] border border-white/15 p-5 flex flex-col gap-4">
            <h3 className="font-display text-2xl font-bold uppercase">Reset Local Profile?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This clears your local offline ZORB profile, playlists, and streak history on this device and returns to Onboarding.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="flex-1 h-11 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmLogout(false);
                  onLogout();
                }}
                className="flex-1 h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-bold text-white cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <AvatarCropperModal
        isOpen={cropOpen}
        initialImage={profile.avatar}
        accentHex={accentHex}
        onClose={() => setCropOpen(false)}
        onSave={(cropped) => {
          onUpdateProfile({ ...profile, avatar: cropped });
          setCropOpen(false);
        }}
      />
    </div>
  );
};
