import React from 'react';
import { motion } from 'motion/react';
import { Maximize2, Pause, Play, SkipForward, X } from 'lucide-react';
import { Song } from '../types/zorb';

interface MiniPlayerProps {
  song: Song;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  accentHex: string;
  onOpenFull: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  song,
  isPlaying,
  currentTime,
  duration,
  accentHex,
  onOpenFull,
  onTogglePlay,
  onNext,
}) => {
  const safeDuration = duration > 0 ? duration : song.duration || 65;
  const pct = Math.min(100, Math.max(0, (currentTime / safeDuration) * 100));

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="rounded-2xl bg-[#0E1118]/95 backdrop-blur-lg border border-white/15 overflow-hidden shadow-2xl"
    >
      <div className="h-[2px] w-full bg-white/10">
        <div
          className="h-full transition-[width] duration-150"
          style={{ width: `${pct}%`, backgroundColor: accentHex }}
        />
      </div>

      <div className="px-3 py-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenFull}
          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
        >
          <img
            src={song.cover}
            alt={song.title}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-xl object-cover shrink-0 border"
            style={{ borderColor: accentHex }}
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate uppercase tracking-wide">
              {song.title}
            </p>
            <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-black active:scale-90 transition-transform cursor-pointer"
            style={{ backgroundColor: accentHex }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onNext}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
            aria-label="Next song"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

interface SystemMiniPlayerBarProps {
  song: Song;
  isPlaying: boolean;
  accentHex: string;
  onOpenFull: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onDismiss: () => void;
}

export const SystemMiniPlayerBar: React.FC<SystemMiniPlayerBarProps> = ({
  song,
  isPlaying,
  accentHex,
  onOpenFull,
  onTogglePlay,
  onNext,
  onDismiss,
}) => (
  <motion.div
    initial={{ y: -60, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: -60, opacity: 0 }}
    transition={{ duration: 0.25 }}
    className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md rounded-2xl bg-[#0B0D12]/95 backdrop-blur-xl border px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-2xl"
    style={{
      borderColor: accentHex,
      boxShadow: `0 8px 30px rgba(var(--zorb-accent-rgb), 0.25)`,
    }}
  >
    <button
      type="button"
      onClick={onOpenFull}
      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
    >
      <img
        src={song.cover}
        alt={song.title}
        referrerPolicy="no-referrer"
        className="w-9 h-9 rounded-lg object-cover shrink-0"
      />
      <div className="min-w-0">
        <p className="text-[10px] font-mono-tabular uppercase tracking-wider" style={{ color: accentHex }}>
          ZORB System Bar
        </p>
        <p className="text-xs font-bold text-white truncate">
          {song.title} · <span className="font-normal text-zinc-400">{song.artist}</span>
        </p>
      </div>
    </button>

    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={onTogglePlay}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-black cursor-pointer"
        style={{ backgroundColor: accentHex }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
      </button>
      <button
        type="button"
        onClick={onNext}
        className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
        aria-label="Next track"
      >
        <SkipForward className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onOpenFull}
        className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 cursor-pointer"
        aria-label="Expand player"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="w-8 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-400 cursor-pointer"
        aria-label="Dismiss notification bar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
);
