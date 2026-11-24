import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Award, Check, Clock, Flame, Headphones, Share2, Sparkles, X } from 'lucide-react';
import { formatTime } from '../data/songs';
import { getUserRank } from '../utils/storage';
import { HistoryEntry, Song, StreakState, UserProfile } from '../types/zorb';
import { CoverArt } from './CoverArt';

interface LiveWrappedModalProps {
  isOpen: boolean;
  profile: UserProfile;
  songs: Song[];
  history: HistoryEntry[];
  songPlayCounts: Record<string, number>;
  listeningHours: Record<number, number>;
  totalListenSeconds: number;
  dopamineScore: number;
  streak: StreakState;
  accentHex: string;
  onPlaySong: (song: Song) => void;
  onClose: () => void;
}

function formatHourWindow(hour: number): { label: string; range: string } {
  if (hour >= 22 || hour < 5) return { label: 'Late Night Drift', range: '10 PM – 4 AM' };
  if (hour >= 5 && hour < 12) return { label: 'Morning Grind', range: '5 AM – 11 AM' };
  if (hour >= 12 && hour < 17) return { label: 'Afternoon Flow', range: '12 PM – 4 PM' };
  return { label: 'Evening Overdrive', range: '5 PM – 9 PM' };
}

export const LiveWrappedModal: React.FC<LiveWrappedModalProps> = ({
  isOpen,
  profile,
  songs,
  history,
  songPlayCounts,
  listeningHours,
  totalListenSeconds,
  dopamineScore,
  streak,
  accentHex,
  onPlaySong,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const entries = Object.entries(songPlayCounts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const topTracks: { song: Song; plays: number }[] = [];
    for (const [id, count] of entries) {
      const match = songs.find((s) => s.id === id);
      if (match) topTracks.push({ song: match, plays: count });
      if (topTracks.length >= 5) break;
    }

    // Fallback to recent history or catalog if counts are empty
    if (topTracks.length === 0) {
      for (const h of history) {
        const match = songs.find((s) => s.id === h.songId);
        if (match && !topTracks.some((t) => t.song.id === match.id)) {
          topTracks.push({ song: match, plays: 1 });
        }
      }
      for (const s of songs.slice(0, 3)) {
        if (topTracks.length >= 3) break;
        if (!topTracks.some((t) => t.song.id === s.id)) {
          topTracks.push({ song: s, plays: 0 });
        }
      }
    }

    // Top mood calculation
    const tagCounts: Record<string, number> = {};
    for (const { song, plays } of topTracks) {
      const weight = Math.max(1, plays);
      for (const tag of song.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + weight;
      }
    }
    const topMood =
      Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      profile.preferences[0] ||
      'Phonk';

    // Peak listening hour
    const peakHourEntry = Object.entries(listeningHours).sort((a, b) => b[1] - a[1])[0];
    const peakHour = peakHourEntry ? Number(peakHourEntry[0]) : new Date().getHours();
    const peakWindow = formatHourWindow(peakHour);

    const totalMinutes = Math.max(1, Math.round(totalListenSeconds / 60));
    const totalPlays = Object.values(songPlayCounts).reduce((sum, n) => sum + n, 0);
    const rank = getUserRank(streak.currentStreak, dopamineScore);

    return { topTracks, topMood, peakWindow, totalMinutes, totalPlays, rank };
  }, [songPlayCounts, songs, history, profile.preferences, listeningHours, totalListenSeconds, streak.currentStreak, dopamineScore]);

  const handleShareWrapped = async () => {
    const topTitle = stats.topTracks[0]?.song.title || 'ZORB Phonk';
    const text = `My ZORB Live Wrapped — ${stats.totalMinutes} mins listened · Top Track: ${topTitle} · Top Vibe: ${stats.topMood} · Streak: ${streak.currentStreak}d (${stats.rank}) · Z = M × D²`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ZORB Live Wrapped', text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[65] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="ZORB Live Wrapped"
        >
          <motion.div
            initial={{ scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-3xl bg-[#121212] border-2 p-5 sm:p-6 flex flex-col gap-5 shadow-2xl"
            style={{
              borderColor: accentHex,
              boxShadow: `0 24px 70px -16px rgba(var(--zorb-accent-rgb), 0.45)`,
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono-tabular font-bold uppercase tracking-widest"
                  style={{ color: accentHex }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Anytime Recap
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white mt-0.5">
                  {profile.name}&apos;s Wrapped
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 cursor-pointer shrink-0"
                aria-label="Close Live Wrapped"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hero 3-Stat Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl bg-black border border-white/10 p-3 text-center">
                <p className="text-[10px] text-[#B3B3B3]">Flow Time</p>
                <p className="font-display text-2xl font-extrabold tabular-nums text-white mt-0.5">
                  {stats.totalMinutes}m
                </p>
              </div>
              <div className="rounded-2xl bg-black border border-white/10 p-3 text-center">
                <p className="text-[10px] text-[#B3B3B3]">Streak</p>
                <p
                  className="font-display text-2xl font-extrabold tabular-nums mt-0.5 inline-flex items-center gap-1"
                  style={{ color: accentHex }}
                >
                  <Flame className="w-4 h-4" />
                  {streak.currentStreak}d
                </p>
              </div>
              <div className="rounded-2xl bg-black border border-white/10 p-3 text-center">
                <p className="text-[10px] text-[#B3B3B3]">Tracks Played</p>
                <p className="font-display text-2xl font-extrabold tabular-nums text-white mt-0.5">
                  {stats.totalPlays}
                </p>
              </div>
            </div>

            {/* Vibe & Peak Hour Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-black border border-white/10 p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[#B3B3B3]">
                  <Headphones className="w-3.5 h-3.5" style={{ color: accentHex }} />
                  Top Sound Vibe
                </div>
                <p className="font-display text-xl font-extrabold uppercase text-white mt-1 truncate">
                  {stats.topMood}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Rank: {stats.rank}</p>
              </div>

              <div className="rounded-2xl bg-black border border-white/10 p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[#B3B3B3]">
                  <Clock className="w-3.5 h-3.5" style={{ color: accentHex }} />
                  Peak Listening
                </div>
                <p className="font-display text-xl font-extrabold uppercase text-white mt-1 truncate">
                  {stats.peakWindow.label}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{stats.peakWindow.range}</p>
              </div>
            </div>

            {/* Top Tracks List */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4" style={{ color: accentHex }} />
                  Your Top Tracks
                </h3>
                <span className="text-[11px] font-mono-tabular text-zinc-500">
                  {dopamineScore.toLocaleString()} DP
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {stats.topTracks.map((entry, idx) => (
                  <button
                    key={entry.song.id}
                    type="button"
                    onClick={() => {
                      onPlaySong(entry.song);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-black border border-white/10 hover:border-white/25 flex items-center gap-3 text-left cursor-pointer"
                  >
                    <span
                      className="w-5 text-center font-display text-lg font-extrabold tabular-nums"
                      style={{ color: idx === 0 ? accentHex : '#71717a' }}
                    >
                      {idx + 1}
                    </span>
                    <CoverArt src={entry.song.cover} alt={entry.song.title} className="w-10 h-10 rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{entry.song.title}</p>
                      <p className="text-[11px] text-[#B3B3B3] truncate">{entry.song.artist}</p>
                    </div>
                    <span className="text-[11px] font-mono-tabular text-zinc-400 shrink-0">
                      {entry.plays > 0 ? `${entry.plays}×` : formatTime(entry.song.duration)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Share CTA */}
            <button
              type="button"
              onClick={handleShareWrapped}
              className="w-full h-12 rounded-full text-sm font-bold text-black inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer"
              style={{ backgroundColor: accentHex }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Wrapped Stats Copied!' : 'Share My ZORB Wrapped'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
