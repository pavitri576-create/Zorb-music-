import React, { useRef } from 'react';
import { motion, PanInfo } from 'motion/react';
import { Maximize2, Music2, Pause, Play, SkipForward, X } from 'lucide-react';
import { Song } from '../types/zorb';

interface MiniPlayerProps {
  song: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  accentHex: string;
  onOpenFull: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
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
  onPrev,
  onNext,
}) => {
  const swipedRef = useRef(false);
  const safeDuration = song ? (duration > 0 ? duration : song.duration || 65) : 1;
  const pct = song ? Math.min(100, Math.max(0, (currentTime / safeDuration) * 100)) : 0;

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -50 || info.velocity.x < -300) {
      swipedRef.current = true;
      onNext();
      setTimeout(() => {
        swipedRef.current = false;
      }, 150);
    } else if (info.offset.x > 50 || info.velocity.x > 300) {
      swipedRef.current = true;
      onPrev();
      setTimeout(() => {
        swipedRef.current = false;
      }, 150);
    }
  };

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.22}
      onDragEnd={handleDragEnd}
      className="rounded-2xl bg-[#121212]/95 backdrop-blur-lg border border-white/15 overflow-hidden shadow-2xl touch-pan-y"
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
          onClick={() => {
            if (swipedRef.current) return;
            if (song) onOpenFull();
            else onTogglePlay();
          }}
          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
        >
          {song ? (
            <img
              src={song.cover}
              alt={song.title}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover shrink-0 border pointer-events-none"
              style={{ borderColor: accentHex }}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl bg-black border flex items-center justify-center shrink-0"
              style={{ borderColor: accentHex, color: accentHex }}
            >
              <Music2 className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate uppercase tracking-wide">
              {song ? song.title : 'ZORB Ready'}
            </p>
            <p className="text-[11px] text-[#B3B3B3] truncate">
              {song ? song.artist : 'Tap Play to start your Phonk flow'}
            </p>
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
  currentTime?: number;
  duration?: number;
  accentHex: string;
  onOpenFull: () => void;
  onTogglePlay: () => void;
  onPrev?: () => void;
  onNext: () => void;
  onDismiss: () => void;
}

export const SystemMiniPlayerBar: React.FC<SystemMiniPlayerBarProps> = ({
  song,
  isPlaying,
  currentTime = 0,
  duration = 0,
  accentHex,
  onOpenFull,
  onTogglePlay,
  onPrev,
  onNext,
  onDismiss,
}) => {
  const safeDuration = duration > 0 ? duration : song.duration || 65;
  const pct = Math.min(100, Math.max(0, (currentTime / safeDuration) * 100));

  return (
    <motion.div
      initial={{ y: -64, opacity: 0, scale: 0.94 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -64, opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] max-w-md rounded-full bg-[#070709]/95 backdrop-blur-xl border overflow-hidden shadow-2xl"
      style={{
        borderColor: accentHex,
        boxShadow: `0 10px 32px rgba(0, 0, 0, 0.85), 0 0 22px rgba(var(--zorb-accent-rgb), 0.28)`,
      }}
    >
      <div className="px-2.5 py-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenFull}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
        >
          {/* Cover art + ZORB app icon badge */}
          <div className="relative shrink-0">
            <img
              src={song.cover}
              alt={song.title}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-white/15"
            />
            <img
              src="/zorb-icon.svg"
              alt="ZORB"
              className="w-4 h-4 rounded-[5px] absolute -bottom-0.5 -right-0.5 border border-black shadow-md"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                  isPlaying ? 'animate-pulse' : 'opacity-40'
                }`}
                style={{ backgroundColor: accentHex }}
              />
              <p className="text-xs font-bold text-white truncate leading-tight">
                {song.title}
              </p>
            </div>
            <p className="text-[11px] text-[#B3B3B3] truncate mt-0.5 leading-tight">
              {song.artist}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
              aria-label="Previous track"
            >
              <SkipForward className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}
          <button
            type="button"
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full flex items-center justify-center text-black active:scale-90 transition-transform cursor-pointer"
            style={{ backgroundColor: accentHex }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
          </button>
          <button
            type="button"
            onClick={onNext}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
            aria-label="Next track"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onOpenFull}
            className="hidden sm:flex w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-zinc-300 cursor-pointer"
            aria-label="Expand player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="w-7 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 cursor-pointer"
            aria-label="Dismiss live pill"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Progress Hairline */}
      <div className="h-[2px] w-full bg-white/10">
        <div
          className="h-full transition-[width] duration-200"
          style={{ width: `${pct}%`, backgroundColor: accentHex }}
        />
      </div>
    </motion.div>
  );
};
