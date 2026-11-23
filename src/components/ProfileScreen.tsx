import React, { useState } from 'react';
import {
  ArrowLeft,
  Award,
  Bell,
  BellOff,
  Camera,
  Check,
  Crown,
  Flame,
  Lock,
  LogOut,
  Palette,
  Save,
} from 'lucide-react';
import { REWARD_MILESTONES } from '../data/rewards';
import { ALL_MUSIC_PREFERENCES } from '../data/songs';
import { THEME_OPTIONS } from '../data/themes';
import { getUserRank } from '../utils/storage';
import { MusicPreference, Playlist, StreakState, UserProfile } from '../types/zorb';
import { AvatarCropperModal } from './AvatarCropperModal';

interface ProfileScreenProps {
  profile: UserProfile;
  themeId: string;
  accentHex: string;
  totalListenSeconds: number;
  dopamineScore: number;
  streak: StreakState;
  playlists: Playlist[];
  claimedRewardIds: string[];
  notificationsEnabled: boolean;
  onBackHome: () => void;
  onUpdateProfile: (next: UserProfile) => void;
  onSelectTheme: (themeId: string) => void;
  onToggleNotifications: () => void;
  onSendTestReminder: () => void;
  onRemoveAdsClick: () => void;
  onOpenPlaylist: (playlistId: string) => void;
  onOpenRewards?: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  themeId,
  accentHex,
  totalListenSeconds,
  dopamineScore,
  streak,
  playlists,
  claimedRewardIds,
  notificationsEnabled,
  onBackHome,
  onUpdateProfile,
  onSelectTheme,
  onToggleNotifications,
  onSendTestReminder,
  onRemoveAdsClick,
  onOpenPlaylist,
  onOpenRewards,
  onLogout,
}) => {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [preferences, setPreferences] = useState<MusicPreference[]>(profile.preferences);
  const [cropOpen, setCropOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

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

        <span
          className="text-xs font-mono-tabular font-semibold uppercase tracking-widest"
          style={{ color: accentHex }}
        >
          {currentRank}
        </span>
      </div>

      {/* Top Avatar + Rank Card */}
      <div className="rounded-2xl bg-[#0B0D12] border border-white/10 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5">
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
          <p className="text-xs text-[#B3B3B3]">Current Rank</p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white mt-1 truncate">
            {currentRank}
          </p>
        </button>
      </div>

      {/* Claimed Badges Showcase */}
      {claimedBadges.length > 0 && (
        <section className="rounded-2xl bg-[#0B0D12] border border-white/10 p-5 flex flex-col gap-3">
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
      <section className="rounded-2xl bg-[#0B0D12] border border-white/10 p-5 flex flex-col gap-3">
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
      <section className="rounded-2xl bg-[#0B0D12] border border-white/10 p-5 flex flex-col gap-5">
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
              streak.currentStreak >= t.unlockDay;
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
                  {isUnlocked ? (t.unlockDay === 0 ? 'Starter' : `Day ${t.unlockDay} Unlocked`) : `Unlock in ${daysRemaining}d`}
                </p>
              </button>
            );
          })}
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

      {/* Reset Local Data Confirmation Modal (never window.confirm) */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0B0D12] border border-white/15 p-5 flex flex-col gap-4">
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
