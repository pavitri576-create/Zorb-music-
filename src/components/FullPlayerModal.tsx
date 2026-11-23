import React, { useRef, useState } from 'react';
import { AnimatePresence, motion, PanInfo } from 'motion/react';
import {
  Check,
  ChevronDown,
  Download,
  Heart,
  ListPlus,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { formatTime } from '../data/songs';
import { RepeatMode, Song } from '../types/zorb';
import { CoverArt } from './CoverArt';

interface FullPlayerModalProps {
  isOpen: boolean;
  song: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  isLiked: boolean;
  isOffline: boolean;
  accentHex: string;
  dopamineGainToast: number | null;
  onClose: () => void;
  onMinimizeToSystemBar: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToggleLike: (songId: string) => void;
  onOpenAddToPlaylist: (song: Song) => void;
  onToggleOffline: (song: Song) => void;
  onShare: (song: Song) => void;
}

export const FullPlayerModal: React.FC<FullPlayerModalProps> = ({
  isOpen,
  song,
  isPlaying,
  currentTime,
  duration,
  shuffle,
  repeatMode,
  isLiked,
  isOffline,
  accentHex,
  dopamineGainToast,
  onClose,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onToggleShuffle,
  onCycleRepeat,
  onToggleLike,
  onOpenAddToPlaylist,
  onToggleOffline,
  onShare,
}) => {
  const [heartPopKey, setHeartPopKey] = useState(0);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingBar, setIsDraggingBar] = useState(false);

  const safeDuration = duration > 0 ? duration : song?.duration || 48;
  const pct = Math.min(100, Math.max(0, (currentTime / safeDuration) * 100));

  const seekFromClientX = (clientX: number) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(ratio * safeDuration);
  };

  const handleSwipeClose = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isDraggingBar) return;
    if (info.offset.y > 95 || info.velocity.y > 420) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && song && (
        <motion.div
          key="full-player"
          initial={{ y: '100%', opacity: 0.75 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0.75 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          drag={isDraggingBar ? false : 'y'}
          dragConstraints={{ top: 0, bottom: 260 }}
          dragElastic={{ top: 0, bottom: 0.35 }}
          onDragEnd={handleSwipeClose}
          className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-y-auto px-6 py-5 sm:py-8"
        >
          {/* Dopamine +10 Toast */}
          <AnimatePresence>
            {dopamineGainToast !== null && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#121212] border font-mono-tabular text-xs font-bold shadow-xl pointer-events-none"
                style={{ borderColor: accentHex, color: accentHex }}
              >
                +{dopamineGainToast} Dopamine
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Bar + Swipe Down Handle */}
          <div className="flex flex-col items-center gap-2 max-w-md w-full mx-auto">
            <div className="w-10 h-1 rounded-full bg-white/25" aria-hidden="true" />
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 rounded-full hover:bg-white/10 flex items-center justify-center text-white active:scale-[0.97] transition-transform cursor-pointer"
                aria-label="Close player"
              >
                <ChevronDown className="w-6 h-6" />
              </button>

              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#B3B3B3]">
                  Playing Offline
                </p>
                <p className="text-xs font-bold text-white mt-0.5 truncate max-w-[180px]">
                  {song.genre} · {song.bpm} BPM
                </p>
              </div>

              <button
                type="button"
                onClick={() => onShare(song)}
                className="w-11 h-11 rounded-full hover:bg-white/10 flex items-center justify-center text-[#B3B3B3] hover:text-white active:scale-[0.97] transition-transform cursor-pointer"
                aria-label="Share track"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Big Centered Spotify-Style Album Art */}
          <div className="flex items-center justify-center my-4 max-w-md w-full mx-auto">
            <div
              className="w-72 h-72 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              style={{
                boxShadow: `0 18px 50px -16px rgba(var(--zorb-accent-rgb), 0.35)`,
              }}
            >
              <CoverArt src={song.cover} alt={song.title} className="w-full h-full" />
            </div>
          </div>

          {/* Bottom Thumb Zone: Title + Thin Progress Bar + Controls + Like / Playlist */}
          <div className="max-w-md w-full mx-auto flex flex-col gap-5 pb-2">
            {/* Title + Artist */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                  {song.title}
                </h2>
                <p className="text-sm text-[#B3B3B3] truncate mt-0.5">{song.artist}</p>
              </div>
              <button
                type="button"
                onClick={() => onToggleOffline(song)}
                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center shrink-0 active:scale-[0.97] cursor-pointer"
                style={{ color: isOffline ? accentHex : '#B3B3B3' }}
                aria-label={isOffline ? 'Saved offline' : 'Download offline'}
              >
                {isOffline ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
              </button>
            </div>

            {/* Thin Progress Bar */}
            <div className="flex flex-col gap-1.5">
              <div
                ref={barRef}
                role="slider"
                aria-label="Seek audio position"
                aria-valuemin={0}
                aria-valuemax={Math.round(safeDuration)}
                aria-valuenow={Math.round(currentTime)}
                tabIndex={0}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingBar(true);
                  e.currentTarget.setPointerCapture(e.pointerId);
                  seekFromClientX(e.clientX);
                }}
                onPointerMove={(e) => {
                  if (isDraggingBar) seekFromClientX(e.clientX);
                }}
                onPointerUp={() => setIsDraggingBar(false)}
                className="relative h-6 flex items-center cursor-pointer touch-none group"
              >
                <div className="w-full h-1 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: accentHex }}
                  />
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md"
                  style={{ left: `${pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#B3B3B3]">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(safeDuration)}</span>
              </div>
            </div>

            {/* Controls: Shuffle, Prev, Big Play/Pause, Next, Repeat */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={onToggleShuffle}
                className="w-11 h-11 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform cursor-pointer"
                style={{ color: shuffle ? accentHex : '#B3B3B3' }}
                aria-label="Toggle shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onPrev}
                className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-white active:scale-[0.97] transition-transform cursor-pointer"
                aria-label="Previous track"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>

              <button
                type="button"
                onClick={onTogglePlay}
                className="w-16 h-16 rounded-full flex items-center justify-center text-black active:scale-[0.97] transition-transform cursor-pointer shadow-xl"
                style={{ backgroundColor: accentHex }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current translate-x-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={onNext}
                className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-white active:scale-[0.97] transition-transform cursor-pointer"
                aria-label="Next track"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>

              <button
                type="button"
                onClick={onCycleRepeat}
                className="w-11 h-11 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform cursor-pointer"
                style={{ color: repeatMode !== 'off' ? accentHex : '#B3B3B3' }}
                aria-label="Cycle repeat mode"
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-5 h-5" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Bottom Thumb Reach: Like + Add to Playlist */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setHeartPopKey((k) => k + 1);
                  onToggleLike(song.id);
                }}
                className="h-12 rounded-full bg-[#121212] hover:bg-[#181818] border border-white/10 flex items-center justify-center gap-2 text-xs font-semibold active:scale-[0.97] transition-transform cursor-pointer"
                style={isLiked ? { borderColor: accentHex, color: accentHex } : { color: '#ffffff' }}
              >
                <Heart
                  key={heartPopKey}
                  className={`w-4 h-4 ${isLiked ? 'fill-current animate-zorb-heart-pop' : ''}`}
                />
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAddToPlaylist(song)}
                className="h-12 rounded-full bg-[#121212] hover:bg-[#181818] border border-white/10 flex items-center justify-center gap-2 text-xs font-semibold text-white active:scale-[0.97] transition-transform cursor-pointer"
              >
                <ListPlus className="w-4 h-4" style={{ color: accentHex }} />
                <span>Add to Playlist</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
