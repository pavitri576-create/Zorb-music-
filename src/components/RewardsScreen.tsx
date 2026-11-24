import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Award, Check, Coins, Crown, Flame, FolderPlus, Lock, Palette, Plus, ShieldCheck, ShoppingBag, Sparkles, WifiOff } from 'lucide-react';
import { REWARD_MILESTONES } from '../data/rewards';
import { formatTime } from '../data/songs';
import { getLocalDateKey, PRE_DAY15_MAX_IMPORT_SPACE, STREAK_DAILY_THRESHOLD_SECONDS } from '../utils/storage';
import { CoinShopItemId, RewardMilestone, StreakState } from '../types/zorb';
import { PuzzlePieceIcon } from './ZorbLogo';

interface RewardsScreenProps {
  streak: StreakState;
  coins: number;
  adSkipShields: number;
  claimedRewardIds: string[];
  importSpaceLimit: number;
  usedImportCount: number;
  isUnlimitedImports: boolean;
  hasPermanentOffline: boolean;
  nextLockedThemeName: string | null;
  accentHex: string;
  onClaimReward: (reward: RewardMilestone) => void;
  onAddMoreSpace: () => void;
  onBuyShopItem: (itemId: CoinShopItemId) => void;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({
  streak,
  coins,
  adSkipShields,
  claimedRewardIds,
  importSpaceLimit,
  usedImportCount,
  isUnlimitedImports,
  hasPermanentOffline,
  nextLockedThemeName,
  accentHex,
  onClaimReward,
  onAddMoreSpace,
  onBuyShopItem,
}) => {
  const [calendarDays, setCalendarDays] = useState<30 | 50 | 200>(30);
  const [confettiPieces, setConfettiPieces] = useState<number[]>([]);

  const todayKey = getLocalDateKey();
  const todaySeconds = streak.dailyListenSeconds[todayKey] || 0;
  const todayCompleted = streak.completedDates.includes(todayKey);
  const todayProgressPct = Math.min(100, (todaySeconds / STREAK_DAILY_THRESHOLD_SECONDS) * 100);

  const nextReward =
    REWARD_MILESTONES.find((m) => m.day > streak.currentStreak) ||
    REWARD_MILESTONES[REWARD_MILESTONES.length - 1];
  const daysToNext = Math.max(0, nextReward.day - streak.currentStreak);
  const canAddMoreSpace = !isUnlimitedImports && importSpaceLimit < PRE_DAY15_MAX_IMPORT_SPACE;

  const calendarCells = useMemo(() => {
    const completedSet = new Set(streak.completedDates);
    const cells: { index: number; dateKey: string; status: 'completed' | 'missed' | 'today' | 'future' }[] = [];
    const today = new Date();
    const pastOffset = Math.min(7, calendarDays - 1);

    for (let i = 0; i < calendarDays; i++) {
      const diff = i - pastOffset;
      const d = new Date(today);
      d.setDate(today.getDate() + diff);
      const key = getLocalDateKey(d);

      let status: 'completed' | 'missed' | 'today' | 'future' = 'future';
      if (diff === 0) {
        status = completedSet.has(key) ? 'completed' : 'today';
      } else if (diff < 0) {
        status = completedSet.has(key) ? 'completed' : 'missed';
      }
      cells.push({ index: i + 1, dateKey: key, status });
    }
    return cells;
  }, [calendarDays, streak.completedDates]);

  const handleClaim = (reward: RewardMilestone) => {
    setConfettiPieces(Array.from({ length: 18 }, (_, i) => i));
    onClaimReward(reward);
    setTimeout(() => setConfettiPieces([]), 1600);
  };

  return (
    <div className="flex flex-col gap-6 pb-8 relative">
      {/* Puzzle Confetti Celebration Overlay */}
      <AnimatePresence>
        {confettiPieces.length > 0 && (
          <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden flex items-center justify-center">
            {confettiPieces.map((idx) => {
              const angle = (idx / confettiPieces.length) * Math.PI * 2;
              const dist = 110 + (idx % 3) * 55;
              return (
                <motion.div
                  key={idx}
                  initial={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: 0 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist - 40,
                    scale: 1.15,
                    opacity: 0,
                    rotate: (idx % 2 === 0 ? 1 : -1) * 140,
                  }}
                  transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute"
                >
                  <PuzzlePieceIcon className="w-6 h-6" color={accentHex} />
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Top Next In-Game Reward Callout */}
      <div
        className="rounded-2xl bg-[#121212] border-2 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{
          borderColor: accentHex,
          boxShadow: `0 12px 36px -14px rgba(var(--zorb-accent-rgb), 0.35)`,
        }}
      >
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono-tabular uppercase tracking-widest" style={{ color: accentHex }}>
            <Flame className="w-4 h-4" />
            Next In-Game Reward In {daysToNext} {daysToNext === 1 ? 'Day' : 'Days'}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight mt-1">
            {nextReward.title}
          </h1>
          <p className="text-xs text-[#B3B3B3] mt-1">
            Listen 10 minutes daily to earn Coins, Themes, Song Space, and Permanent Offline Mode.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 shrink-0">
          <div className="rounded-xl bg-black/70 border border-white/10 px-3 py-2.5 text-center">
            <p className="text-[11px] text-[#B3B3B3]">Streak</p>
            <p className="font-display text-2xl font-extrabold tabular-nums" style={{ color: accentHex }}>
              {streak.currentStreak}d
            </p>
          </div>
          <div className="rounded-xl bg-black/70 border border-white/10 px-3 py-2.5 text-center">
            <p className="text-[11px] text-[#B3B3B3]">Coins</p>
            <p className="font-display text-2xl font-extrabold tabular-nums text-white inline-flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-400" />
              {coins}
            </p>
          </div>
          <div className="rounded-xl bg-black/70 border border-white/10 px-3 py-2.5 text-center">
            <p className="text-[11px] text-[#B3B3B3]">Offline</p>
            <p className="font-display text-lg font-extrabold uppercase text-white mt-0.5">
              {hasPermanentOffline ? 'FREE' : 'AD'}
            </p>
          </div>
        </div>
      </div>

      {/* Extra Space System Card (Pre-Day 15 expandable +5 slots) */}
      <section className="rounded-2xl bg-[#121212] border border-white/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className="w-12 h-12 rounded-xl bg-black border flex items-center justify-center shrink-0"
            style={{ borderColor: accentHex, color: accentHex }}
          >
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {isUnlimitedImports
                ? 'Song Import Vault: Unlimited (25+ Unlocked!)'
                : `Extra Space: ${usedImportCount} / ${importSpaceLimit} Song Slots`}
            </h2>
            <p className="text-xs text-[#B3B3B3] mt-0.5">
              {isUnlimitedImports
                ? 'Day 15 Milestone achieved — import and scan unlimited music files.'
                : `Add +5 More Space anytime up to ${PRE_DAY15_MAX_IMPORT_SPACE} songs. Reach Day 15 to unlock 25+ unlimited songs!`}
            </p>
          </div>
        </div>

        {!isUnlimitedImports && (
          <button
            type="button"
            disabled={!canAddMoreSpace}
            onClick={onAddMoreSpace}
            className="h-11 px-4 rounded-full text-xs font-bold text-black inline-flex items-center justify-center gap-1.5 shrink-0 active:scale-[0.97] transition-transform disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed"
            style={{ backgroundColor: accentHex }}
          >
            <Plus className="w-4 h-4" />
            {canAddMoreSpace ? 'Add +5 More Space' : 'Max 25 Until Day 15'}
          </button>
        )}
      </section>

      {/* ZORB Coin Shop */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: accentHex }} />
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide">
              ZORB Coin Shop
            </h2>
          </div>
          <span className="text-xs font-mono-tabular font-bold text-amber-400 inline-flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" />
            {coins.toLocaleString()} Coins
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              id: 'offline-6h' as CoinShopItemId,
              title: '6-Hour Offline Pass',
              desc: hasPermanentOffline
                ? 'Permanent Full Offline already unlocked'
                : 'Unlock 6 hours of offline playback without watching an ad',
              cost: 150,
              disabled: hasPermanentOffline,
              icon: WifiOff,
            },
            {
              id: 'ad-shield' as CoinShopItemId,
              title: 'Ad-Skip Shield',
              desc: `Auto-skip your next 6-song break · Owned: ${adSkipShields}`,
              cost: 100,
              disabled: false,
              icon: ShieldCheck,
            },
            {
              id: 'extra-space-5' as CoinShopItemId,
              title: '+5 Song Import Space',
              desc: isUnlimitedImports
                ? 'Unlimited slots already unlocked'
                : canAddMoreSpace
                ? `Expand from ${importSpaceLimit} to ${Math.min(PRE_DAY15_MAX_IMPORT_SPACE, importSpaceLimit + 5)} slots`
                : 'Max 25 reached until Day 15',
              cost: 200,
              disabled: !canAddMoreSpace,
              icon: FolderPlus,
            },
            {
              id: 'unlock-next-theme' as CoinShopItemId,
              title: nextLockedThemeName ? `Unlock ${nextLockedThemeName}` : 'All Themes Unlocked',
              desc: nextLockedThemeName
                ? 'Unlock this streak accent color early in Profile'
                : 'Every ZORB theme color is already unlocked',
              cost: 250,
              disabled: !nextLockedThemeName,
              icon: Palette,
            },
          ].map((item) => {
            const Icon = item.icon;
            const canAfford = coins >= item.cost;
            const isDisabled = item.disabled || !canAfford;

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-[#121212] border border-white/10 p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl bg-black border border-white/15 flex items-center justify-center shrink-0"
                    style={{ color: accentHex }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                    <p className="text-xs text-[#B3B3B3] mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onBuyShopItem(item.id)}
                  className="h-10 px-3.5 rounded-full text-xs font-bold text-black shrink-0 inline-flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  style={{ backgroundColor: accentHex }}
                >
                  <Coins className="w-3.5 h-3.5" />
                  {item.disabled ? 'Owned' : item.cost}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Daily 10-Min Habit Progress + Calendar Grid */}
      <section className="rounded-2xl bg-[#121212] border border-white/10 p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide">
              Streak Calendar
            </h2>
            <p className="text-xs text-[#B3B3B3] font-mono-tabular mt-0.5">
              Today: {formatTime(todaySeconds)} / 10:00 min {todayCompleted ? '· Completed' : '· Keep listening'}
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-black border border-white/10 self-start">
            {([30, 50, 200] as const).map((days) => {
              const active = calendarDays === days;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setCalendarDays(days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-tabular font-semibold transition-colors cursor-pointer ${
                    active ? 'text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                  style={active ? { backgroundColor: accentHex } : undefined}
                >
                  {days}D
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${todayProgressPct}%`, backgroundColor: accentHex }}
          />
        </div>

        <div
          className={`grid gap-1.5 ${
            calendarDays === 30
              ? 'grid-cols-6 sm:grid-cols-10'
              : calendarDays === 50
              ? 'grid-cols-10'
              : 'grid-cols-10 sm:grid-cols-20'
          }`}
        >
          {calendarCells.map((cell) => {
            const isDone = cell.status === 'completed';
            const isToday = cell.status === 'today';
            const isMissed = cell.status === 'missed';

            return (
              <div
                key={cell.dateKey}
                title={`${cell.dateKey} · ${cell.status}`}
                className="aspect-square rounded-lg flex items-center justify-center border text-[10px] font-mono-tabular"
                style={{
                  backgroundColor: isDone ? accentHex : isMissed ? '#18181b' : '#05070B',
                  borderColor: isToday ? accentHex : isDone ? accentHex : 'rgba(255,255,255,0.08)',
                  color: isDone ? '#000000' : isMissed ? '#52525b' : '#71717a',
                }}
              >
                {isDone ? <PuzzlePieceIcon className="w-3.5 h-3.5" color="#000000" /> : <span>{cell.index}</span>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Pure In-Game Reward Milestones */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide">
            In-Game Streak Rewards
          </h2>
          <span className="text-xs font-mono-tabular text-[#B3B3B3]">
            {claimedRewardIds.length} / {REWARD_MILESTONES.length} Claimed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {REWARD_MILESTONES.map((reward) => {
            const unlocked = streak.currentStreak >= reward.day || streak.bestStreak >= reward.day;
            const claimed = claimedRewardIds.includes(reward.id);
            const progressDays = Math.min(reward.day, streak.currentStreak);
            const pct = Math.min(100, (progressDays / reward.day) * 100);

            return (
              <div
                key={reward.id}
                className={`rounded-2xl bg-[#121212] border p-4 flex flex-col justify-between gap-3 ${
                  reward.day === 200 ? 'md:col-span-2' : ''
                }`}
                style={{
                  borderColor: unlocked ? accentHex : 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
                    style={{
                      borderColor: unlocked ? accentHex : 'rgba(255,255,255,0.12)',
                      backgroundColor: unlocked ? 'rgba(var(--zorb-accent-rgb), 0.14)' : '#05070B',
                      color: unlocked ? accentHex : '#71717a',
                    }}
                  >
                    {reward.type === 'space' ? (
                      <FolderPlus className="w-5 h-5" />
                    ) : reward.type === 'offline' ? (
                      <WifiOff className="w-5 h-5" />
                    ) : reward.day >= 200 ? (
                      <Crown className="w-5 h-5" />
                    ) : reward.day >= 50 ? (
                      <Award className="w-5 h-5" />
                    ) : unlocked ? (
                      <Sparkles className="w-5 h-5" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[11px] font-mono-tabular font-semibold uppercase tracking-wider"
                        style={{ color: unlocked ? accentHex : '#71717a' }}
                      >
                        {reward.subtitle}
                      </span>
                      <span className="text-[11px] font-mono-tabular text-[#B3B3B3]">
                        {progressDays}/{reward.day} Days
                      </span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-white mt-0.5">
                      {reward.title}
                    </h3>
                    <p className="text-xs text-[#B3B3B3] mt-1 leading-relaxed">
                      {reward.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: unlocked ? accentHex : '#52525b',
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-[#B3B3B3]">
                      Badge: <strong className="text-zinc-200">{reward.badgeName}</strong>
                    </span>

                    {claimed ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/5"
                        style={{ color: accentHex }}
                      >
                        <Check className="w-3.5 h-3.5" /> Claimed
                      </span>
                    ) : unlocked ? (
                      <button
                        type="button"
                        onClick={() => handleClaim(reward)}
                        className="px-4 py-2 rounded-full text-xs font-bold text-black active:scale-95 transition-transform cursor-pointer"
                        style={{ backgroundColor: accentHex }}
                      >
                        CLAIM REWARD
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-mono-tabular text-zinc-500">
                        <Lock className="w-3.5 h-3.5" />
                        {Math.max(0, reward.day - streak.currentStreak)}d left
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
