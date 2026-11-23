import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Award, Check, Crown, Flame, Lock, Sparkles } from 'lucide-react';
import { REWARD_MILESTONES } from '../data/rewards';
import { formatTime } from '../data/songs';
import { getLocalDateKey, STREAK_DAILY_THRESHOLD_SECONDS } from '../utils/storage';
import { RewardMilestone, StreakState } from '../types/zorb';
import { PuzzlePieceIcon } from './ZorbLogo';

interface RewardsScreenProps {
  streak: StreakState;
  claimedRewardIds: string[];
  accentHex: string;
  onClaimReward: (reward: RewardMilestone) => void;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({
  streak,
  claimedRewardIds,
  accentHex,
  onClaimReward,
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

  // Build N-day grid leading up to Today + future days in the cycle
  const calendarCells = useMemo(() => {
    const completedSet = new Set(streak.completedDates);
    const cells: { index: number; dateKey: string; status: 'completed' | 'missed' | 'today' | 'future' }[] = [];
    const today = new Date();
    // Show past 7 days + today + remaining upcoming days up to calendarDays
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
      } else {
        status = 'future';
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

      {/* Top Next Reward Callout */}
      <div
        className="rounded-2xl bg-[#0B0D12] border-2 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{
          borderColor: accentHex,
          boxShadow: `0 12px 36px -14px rgba(var(--zorb-accent-rgb), 0.35)`,
        }}
      >
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono-tabular uppercase tracking-widest" style={{ color: accentHex }}>
            <Flame className="w-4 h-4" />
            Next Reward In {daysToNext} {daysToNext === 1 ? 'Day' : 'Days'}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight mt-1">
            {nextReward.title}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Listen 10 minutes daily to lock in today&apos;s puzzle piece.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="rounded-xl bg-black/70 border border-white/10 px-3.5 py-2.5 text-center">
            <p className="text-[11px] text-zinc-400">Streak</p>
            <p className="font-display text-2xl font-extrabold tabular-nums" style={{ color: accentHex }}>
              {streak.currentStreak}d
            </p>
          </div>
          <div className="rounded-xl bg-black/70 border border-white/10 px-3.5 py-2.5 text-center">
            <p className="text-[11px] text-zinc-400">Best</p>
            <p className="font-display text-2xl font-extrabold tabular-nums text-white">
              {streak.bestStreak}d
            </p>
          </div>
          <div className="rounded-xl bg-black/70 border border-white/10 px-3.5 py-2.5 text-center">
            <p className="text-[11px] text-zinc-400">Total</p>
            <p className="font-display text-2xl font-extrabold tabular-nums text-white">
              {streak.totalDays}d
            </p>
          </div>
        </div>
      </div>

      {/* Daily 10-Min Habit Progress + Calendar Grid */}
      <section className="rounded-2xl bg-[#0B0D12] border border-white/10 p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide">
              Streak Calendar
            </h2>
            <p className="text-xs text-zinc-400 font-mono-tabular mt-0.5">
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

        {/* Today's 10-minute progress bar */}
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${todayProgressPct}%`, backgroundColor: accentHex }}
          />
        </div>

        {/* Calendar Grid */}
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
                className={`aspect-square rounded-lg flex items-center justify-center border text-[10px] font-mono-tabular ${
                  isToday ? 'animate-zorb-pulse-ring' : ''
                }`}
                style={{
                  backgroundColor: isDone
                    ? accentHex
                    : isMissed
                    ? '#18181b'
                    : '#05070B',
                  borderColor: isToday
                    ? accentHex
                    : isDone
                    ? accentHex
                    : 'rgba(255,255,255,0.08)',
                  color: isDone ? '#000000' : isMissed ? '#52525b' : '#71717a',
                }}
              >
                {isDone ? (
                  <PuzzlePieceIcon className="w-3.5 h-3.5" color="#000000" />
                ) : (
                  <span>{cell.index}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 pt-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: accentHex }} />
            Completed (10m+)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block border" style={{ borderColor: accentHex }} />
            Today (Active)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block bg-zinc-800" />
            Missed
          </span>
        </div>
      </section>

      {/* Reward Milestones */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide">
            Streak Rewards
          </h2>
          <span className="text-xs font-mono-tabular text-zinc-400">
            {claimedRewardIds.length} / {REWARD_MILESTONES.length} Claimed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {REWARD_MILESTONES.map((reward) => {
            const unlocked = streak.currentStreak >= reward.day || streak.bestStreak >= reward.day;
            const claimed = claimedRewardIds.includes(reward.id);
            const progressDays = Math.min(reward.day, streak.currentStreak);
            const pct = Math.min(100, (progressDays / reward.day) * 100);
            const isBigMerch = Boolean(reward.image);

            return (
              <div
                key={reward.id}
                className={`rounded-2xl bg-[#0B0D12] border p-4 flex flex-col justify-between gap-3 ${
                  reward.day === 200 ? 'md:col-span-2' : ''
                }`}
                style={{
                  borderColor: unlocked ? accentHex : 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-start gap-4">
                  {isBigMerch && reward.image ? (
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0">
                      <img
                        src={reward.image}
                        alt={reward.title}
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition-all ${
                          unlocked ? 'opacity-100' : 'opacity-45 grayscale'
                        }`}
                      />
                      {!unlocked && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-zinc-300" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
                      style={{
                        borderColor: unlocked ? accentHex : 'rgba(255,255,255,0.12)',
                        backgroundColor: unlocked
                          ? 'rgba(var(--zorb-accent-rgb), 0.14)'
                          : '#05070B',
                        color: unlocked ? accentHex : '#71717a',
                      }}
                    >
                      {reward.day >= 200 ? (
                        <Crown className="w-5 h-5" />
                      ) : reward.day >= 50 ? (
                        <Award className="w-5 h-5" />
                      ) : unlocked ? (
                        <Sparkles className="w-5 h-5" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[11px] font-mono-tabular font-semibold uppercase tracking-wider"
                        style={{ color: unlocked ? accentHex : '#71717a' }}
                      >
                        {reward.subtitle}
                      </span>
                      <span className="text-[11px] font-mono-tabular text-zinc-400">
                        {progressDays}/{reward.day} Days
                      </span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-white mt-0.5">
                      {reward.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
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
                    <span className="text-[11px] text-zinc-400">
                      Badge: <strong className="text-zinc-200">{reward.badgeName}</strong>
                    </span>

                    {claimed ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/5"
                        style={{ color: accentHex }}
                      >
                        <Check className="w-3.5 h-3.5" /> Reward Claimed
                      </span>
                    ) : unlocked ? (
                      <button
                        type="button"
                        onClick={() => handleClaim(reward)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-black active:scale-95 transition-transform cursor-pointer"
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
