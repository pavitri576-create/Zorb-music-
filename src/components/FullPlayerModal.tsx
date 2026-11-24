import React, { useState, useRef } from 'react';
import { AnimatePresence, motion, PanInfo } from 'motion/react';
import {
  ArrowDown,
  ArrowUp,
  AudioLines,
  Bookmark,
  Check,
  ChevronDown,
  Download,
  EyeOff,
  Heart,
  ListMusic,
  ListPlus,
  Moon,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Scissors,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { formatTime } from '../data/songs';
import {
  AudioSpeedMode,
  EqPresetId,
  RepeatMode,
  SleepTimerMode,
  Song,
  SongBookmark,
} from '../types/zorb';
import { CoverArt } from './CoverArt';

interface FullPlayerModalProps {
  isOpen: boolean;
  song: Song | null;
  queue: Song[];
  upNextSong: Song | null;
  upNextSongs: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  speedMode: AudioSpeedMode;
  eqPreset: EqPresetId;
  crossfadeSeconds: number;
  sleepTimerMode: SleepTimerMode;
  sleepRemainingSec: number | null;
  loopA: number | null;
  loopB: number | null;
  bookmarks: SongBookmark[];
  excludedShuffleSongIds: string[];
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
  onChangeSpeedMode: (mode: AudioSpeedMode) => void;
  onChangeEqPreset: (preset: EqPresetId) => void;
  onChangeCrossfade: (seconds: number) => void;
  onSelectSleepTimer: (mode: SleepTimerMode) => void;
  onSetLoopA: (time: number | null) => void;
  onSetLoopB: (time: number | null) => void;
  onAddBookmark: (time: number, label: string) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onSaveClipToBeats: (startSec: number, endSec: number) => Promise<void>;
  onSelectQueueSong: (song: Song) => void;
  onMoveQueueItem: (index: number, direction: -1 | 1) => void;
  onRemoveQueueItem: (songId: string) => void;
  onToggleExcludeShuffle: (songId: string) => void;
  onToggleLike: (songId: string) => void;
  onOpenAddToPlaylist: (song: Song) => void;
  onToggleOffline: (song: Song) => void;
  onShare: (song: Song) => void;
}

function formatTimerShort(seconds: number | null, mode: SleepTimerMode): string {
  if (mode === 'end-of-track') return 'Track End';
  if (mode === 'off' || seconds === null) return 'Sleep';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const FullPlayerModal: React.FC<FullPlayerModalProps> = ({
  isOpen,
  song,
  queue,
  upNextSong,
  upNextSongs,
  isPlaying,
  currentTime,
  duration,
  shuffle,
  repeatMode,
  speedMode,
  eqPreset,
  crossfadeSeconds,
  sleepTimerMode,
  sleepRemainingSec,
  loopA,
  loopB,
  bookmarks,
  excludedShuffleSongIds,
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
  onChangeSpeedMode,
  onChangeEqPreset,
  onChangeCrossfade,
  onSelectSleepTimer,
  onSetLoopA,
  onSetLoopB,
  onAddBookmark,
  onDeleteBookmark,
  onSaveClipToBeats,
  onSelectQueueSong,
  onMoveQueueItem,
  onRemoveQueueItem,
  onToggleExcludeShuffle,
  onToggleLike,
  onOpenAddToPlaylist,
  onToggleOffline,
  onShare,
}) => {
  const [heartPopKey, setHeartPopKey] = useState(0);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingBar, setIsDraggingBar] = useState(false);
  const [isSwipingArt, setIsSwipingArt] = useState(false);
  const [activeSheet, setActiveSheet] = useState<'none' | 'fx' | 'tools' | 'sleep' | 'queue'>('none');
  const [bookmarkLabel, setBookmarkLabel] = useState('Drop');
  const [clipping, setClipping] = useState(false);

  const safeDuration = duration > 0 ? duration : song?.duration || 48;
  const pct = Math.min(100, Math.max(0, (currentTime / safeDuration) * 100));

  const loopActive = loopA !== null && loopB !== null && loopB > loopA;
  const loopAPct = loopA !== null ? Math.min(100, Math.max(0, (loopA / safeDuration) * 100)) : null;
  const loopBPct = loopB !== null ? Math.min(100, Math.max(0, (loopB / safeDuration) * 100)) : null;

  const seekFromClientX = (clientX: number) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(ratio * safeDuration);
  };

  const handleSwipeClose = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isDraggingBar || isSwipingArt || activeSheet !== 'none') return;
    if (info.offset.y > 95 || info.velocity.y > 420) {
      onClose();
    }
  };

  const handleArtSwipe = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsSwipingArt(false);
    if (info.offset.x < -60 || info.velocity.x < -340) {
      onNext();
    } else if (info.offset.x > 60 || info.velocity.x > 340) {
      onPrev();
    }
  };

  const handleClipHighlight = async () => {
    if (clipping) return;
    setClipping(true);
    try {
      const start = loopActive && loopA !== null ? loopA : currentTime;
      const end =
        loopActive && loopB !== null
          ? Math.min(loopB, start + 45)
          : Math.min(safeDuration, start + 15);
      await onSaveClipToBeats(start, end);
    } finally {
      setClipping(false);
    }
  };

  const fxSummary =
    speedMode !== 'normal'
      ? speedMode === 'slowed'
        ? 'Slowed'
        : 'Sped Up'
      : eqPreset === 'sub-bass'
      ? 'Sub-Bass'
      : eqPreset === 'vocal-crisp'
      ? 'Vocal EQ'
      : crossfadeSeconds > 0
      ? `Fade ${crossfadeSeconds}s`
      : 'Sound FX';

  const toolsSummary = loopActive
    ? `A–B Loop`
    : bookmarks.length > 0
    ? `${bookmarks.length} Pin${bookmarks.length === 1 ? '' : 's'}`
    : 'Loop & Clip';

  return (
    <AnimatePresence>
      {isOpen && song && (
        <motion.div
          key="full-player"
          initial={{ y: '100%', opacity: 0.75 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0.75 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          drag={isDraggingBar || isSwipingArt || activeSheet !== 'none' ? false : 'y'}
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
                <p className="text-xs font-bold text-white mt-0.5 truncate max-w-[190px]">
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

          {/* Big Centered Swipeable Album Art (Swipe Left = Next, Swipe Right = Prev) */}
          <div className="flex flex-col items-center justify-center my-3 max-w-md w-full mx-auto">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.28}
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsSwipingArt(true);
              }}
              onPointerUp={() => setIsSwipingArt(false)}
              onPointerCancel={() => setIsSwipingArt(false)}
              onDragEnd={handleArtSwipe}
              whileDrag={{ scale: 0.97 }}
              className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10 cursor-grab active:cursor-grabbing touch-pan-y"
              style={{
                boxShadow: `0 18px 50px -16px rgba(var(--zorb-accent-rgb), 0.35)`,
              }}
            >
              <CoverArt src={song.cover} alt={song.title} className="w-full h-full pointer-events-none" />
            </motion.div>
            <p className="text-[10px] text-zinc-500 mt-2 tracking-wide">
              Swipe art left or right to skip track
            </p>
          </div>

          {/* Bottom Thumb Zone */}
          <div className="max-w-md w-full mx-auto flex flex-col gap-4 pb-2">
            {/* Title + Artist + Quick Bookmark Pin + Offline Save */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                  {song.title}
                </h2>
                <p className="text-sm text-[#B3B3B3] truncate mt-0.5">{song.artist}</p>
              </div>
              <button
                type="button"
                onClick={() => onAddBookmark(currentTime, 'Drop')}
                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center shrink-0 text-[#B3B3B3] hover:text-white active:scale-[0.95] cursor-pointer"
                title="Pin current timestamp"
                aria-label="Pin timestamp bookmark"
              >
                <Bookmark className="w-4 h-4" />
              </button>
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

            {/* Thin Progress Bar with A-B Loop Highlight + Bookmark Dots */}
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
                className="relative h-7 flex items-center cursor-pointer touch-none group"
              >
                <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden relative">
                  {/* A-B Loop Zone */}
                  {loopActive && loopAPct !== null && loopBPct !== null && (
                    <div
                      className="absolute inset-y-0 opacity-45"
                      style={{
                        left: `${loopAPct}%`,
                        width: `${Math.max(1, loopBPct - loopAPct)}%`,
                        backgroundColor: accentHex,
                      }}
                    />
                  )}
                  <div
                    className="h-full rounded-full relative z-10"
                    style={{ width: `${pct}%`, backgroundColor: accentHex }}
                  />
                </div>

                {/* Bookmark Pins along Track */}
                {bookmarks.map((bm) => {
                  const bmPct = Math.min(99, Math.max(1, (bm.time / safeDuration) * 100));
                  return (
                    <button
                      key={bm.id}
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeek(bm.time);
                      }}
                      title={`${bm.label} (${formatTime(bm.time)})`}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black z-20 hover:scale-125 transition-transform cursor-pointer"
                      style={{ left: `${bmPct}%` }}
                      aria-label={`Jump to ${bm.label} at ${formatTime(bm.time)}`}
                    />
                  );
                })}

                {/* Loop A / B Markers */}
                {loopAPct !== null && (
                  <div
                    className="absolute -top-0.5 -translate-x-1/2 text-[8px] font-mono-tabular font-bold px-1 rounded bg-white text-black z-20 pointer-events-none"
                    style={{ left: `${loopAPct}%` }}
                  >
                    A
                  </div>
                )}
                {loopBPct !== null && (
                  <div
                    className="absolute -top-0.5 -translate-x-1/2 text-[8px] font-mono-tabular font-bold px-1 rounded text-black z-20 pointer-events-none"
                    style={{ left: `${loopBPct}%`, backgroundColor: accentHex }}
                  >
                    B
                  </div>
                )}

                {/* Playhead */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md z-30 pointer-events-none"
                  style={{ left: `${pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#B3B3B3]">
                <span>{formatTime(currentTime)}</span>
                {loopActive && loopA !== null && loopB !== null && (
                  <span style={{ color: accentHex }}>
                    Loop {formatTime(loopA)}–{formatTime(loopB)}
                  </span>
                )}
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

            {/* Up Next Quick Preview Bar (Tap to open full Up Next list) */}
            <button
              type="button"
              onClick={() => setActiveSheet('queue')}
              className="w-full px-3 py-2 rounded-xl bg-[#121212] hover:bg-[#181818] border border-white/10 flex items-center justify-between gap-2.5 text-left active:scale-[0.99] transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-black shrink-0"
                  style={{ backgroundColor: accentHex }}
                >
                  {repeatMode === 'one' ? 'Repeat 1' : 'Up Next'}
                </span>
                {repeatMode === 'one' ? (
                  <p className="text-xs font-semibold text-white truncate">
                    Replaying: {song.title}
                  </p>
                ) : upNextSong ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={upNextSong.cover}
                      alt={upNextSong.title}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded object-cover shrink-0"
                    />
                    <p className="text-xs font-semibold text-white truncate">
                      {upNextSong.title}{' '}
                      <span className="text-[#B3B3B3] font-normal">· {upNextSong.artist}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#B3B3B3] truncate">
                    End of Queue (Repeat Off)
                  </p>
                )}
              </div>
              <ListMusic className="w-4 h-4 text-[#B3B3B3] shrink-0" />
            </button>

            {/* 4-Button Studio Strip: Sound FX, Loop & Clip, Sleep, Queue */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveSheet((s) => (s === 'fx' ? 'none' : 'fx'))}
                className="min-h-[42px] px-2 rounded-xl bg-[#121212] hover:bg-[#181818] border border-white/10 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold cursor-pointer active:scale-95 transition-transform"
                style={
                  speedMode !== 'normal' || eqPreset !== 'flat' || crossfadeSeconds > 0
                    ? { borderColor: accentHex, color: accentHex }
                    : { color: '#d4d4d8' }
                }
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="truncate max-w-full">{fxSummary}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSheet((s) => (s === 'tools' ? 'none' : 'tools'))}
                className="min-h-[42px] px-2 rounded-xl bg-[#121212] hover:bg-[#181818] border border-white/10 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold cursor-pointer active:scale-95 transition-transform"
                style={
                  loopActive || bookmarks.length > 0
                    ? { borderColor: accentHex, color: accentHex }
                    : { color: '#d4d4d8' }
                }
              >
                <Scissors className="w-3.5 h-3.5" />
                <span className="truncate max-w-full">{toolsSummary}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSheet((s) => (s === 'sleep' ? 'none' : 'sleep'))}
                className="min-h-[42px] px-2 rounded-xl bg-[#121212] hover:bg-[#181818] border border-white/10 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold cursor-pointer active:scale-95 transition-transform"
                style={sleepTimerMode !== 'off' ? { borderColor: accentHex, color: accentHex } : { color: '#d4d4d8' }}
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="truncate max-w-full font-mono-tabular">
                  {formatTimerShort(sleepRemainingSec, sleepTimerMode)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSheet((s) => (s === 'queue' ? 'none' : 'queue'))}
                className="min-h-[42px] px-2 rounded-xl bg-[#121212] hover:bg-[#181818] border border-white/10 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-zinc-300 cursor-pointer active:scale-95 transition-transform"
              >
                <ListMusic className="w-3.5 h-3.5" style={{ color: accentHex }} />
                <span>Queue ({queue.length})</span>
              </button>
            </div>

            {/* Bottom Thumb Reach: Like + Add to Playlist */}
            <div className="grid grid-cols-2 gap-3">
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

          {/* Slide-Up Sub-Sheet: FX & Crossfade / A-B Loop & Bookmarks & Clip / Sleep / Queue */}
          <AnimatePresence>
            {activeSheet !== 'none' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveSheet('none')}
                className="fixed inset-0 z-[55] bg-black/75 backdrop-blur-sm flex items-end justify-center p-3 sm:p-6"
              >
                <motion.div
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 80, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md rounded-2xl bg-[#121212] border border-white/15 p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                      {activeSheet === 'fx'
                        ? 'Phonk Sound & Crossfade'
                        : activeSheet === 'tools'
                        ? 'A–B Loop, Pins & Clipper'
                        : activeSheet === 'sleep'
                        ? 'Sleep Timer'
                        : `Up Next (${queue.length})`}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveSheet('none')}
                      className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 cursor-pointer"
                      aria-label="Close panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sheet: Sound FX + Crossfade */}
                  {activeSheet === 'fx' && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-xs font-semibold text-[#B3B3B3] mb-2">Playback Speed</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              { id: 'normal', label: 'Normal', sub: '1.0× Pitch' },
                              { id: 'slowed', label: 'Slowed', sub: '0.85× Deep' },
                              { id: 'sped', label: 'Sped Up', sub: '1.15× Fast' },
                            ] as const
                          ).map((item) => {
                            const active = speedMode === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onChangeSpeedMode(item.id)}
                                className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                                  active
                                    ? 'text-black border-transparent'
                                    : 'bg-black text-white border-white/10 hover:border-white/25'
                                }`}
                                style={active ? { backgroundColor: accentHex } : undefined}
                              >
                                <p className="text-xs font-bold">{item.label}</p>
                                <p className={`text-[10px] ${active ? 'text-black/75' : 'text-zinc-400'}`}>
                                  {item.sub}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[#B3B3B3] mb-2">Equalizer Preset</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              { id: 'flat', label: 'Flat', sub: 'Original' },
                              { id: 'sub-bass', label: 'Sub-Bass', sub: '+9dB 808s' },
                              { id: 'vocal-crisp', label: 'Vocal Crisp', sub: 'Clear Highs' },
                            ] as const
                          ).map((item) => {
                            const active = eqPreset === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onChangeEqPreset(item.id)}
                                className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                                  active
                                    ? 'text-black border-transparent'
                                    : 'bg-black text-white border-white/10 hover:border-white/25'
                                }`}
                                style={active ? { backgroundColor: accentHex } : undefined}
                              >
                                <p className="text-xs font-bold">{item.label}</p>
                                <p className={`text-[10px] ${active ? 'text-black/75' : 'text-zinc-400'}`}>
                                  {item.sub}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-xl bg-black border border-white/10 p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-white">Smooth Crossfade</span>
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
                          className="w-full accent-white cursor-pointer"
                          style={{ accentColor: accentHex }}
                          aria-label="Crossfade seconds"
                        />
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Smoothly blends the end of a track into the next song without dead air.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sheet: A-B Drop Looper + Timestamp Bookmarks + Audio Clipper */}
                  {activeSheet === 'tools' && (
                    <div className="flex flex-col gap-4">
                      {/* A-B Looper */}
                      <div className="rounded-xl bg-black border border-white/10 p-3.5 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">A–B Drop Looper</p>
                          <span className="text-[11px] font-mono-tabular text-zinc-400">
                            {loopA !== null ? `A ${formatTime(loopA)}` : 'A --'} ·{' '}
                            {loopB !== null ? `B ${formatTime(loopB)}` : 'B --'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => onSetLoopA(currentTime)}
                            className="h-10 rounded-xl bg-[#181818] hover:bg-white/10 border border-white/10 text-xs font-bold text-white cursor-pointer"
                          >
                            Set A ({formatTime(currentTime)})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const targetA = loopA ?? Math.max(0, currentTime - 10);
                              if (loopA === null) onSetLoopA(targetA);
                              const targetB = Math.max(targetA + 2, currentTime);
                              onSetLoopB(targetB);
                            }}
                            className="h-10 rounded-xl text-xs font-bold text-black cursor-pointer"
                            style={{ backgroundColor: accentHex }}
                          >
                            Set B ({formatTime(currentTime)})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSetLoopA(null);
                              onSetLoopB(null);
                            }}
                            className="h-10 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 cursor-pointer"
                          >
                            Clear Loop
                          </button>
                        </div>
                      </div>

                      {/* Audio Clipper */}
                      <div className="rounded-xl bg-black border border-white/10 p-3.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white">Clip &amp; Save Highlight</p>
                          <p className="text-[11px] text-[#B3B3B3] mt-0.5">
                            {loopActive && loopA !== null && loopB !== null
                              ? `Save your A–B loop (${formatTime(loopA)}–${formatTime(loopB)}) into My Beats`
                              : `Save a 15s highlight from ${formatTime(currentTime)} into My Beats`}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={clipping}
                          onClick={handleClipHighlight}
                          className="h-10 px-3.5 rounded-full text-xs font-bold text-black shrink-0 inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          style={{ backgroundColor: accentHex }}
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          {clipping ? 'Saving...' : 'Save Clip'}
                        </button>
                      </div>

                      {/* Timestamp Bookmarks */}
                      <div className="rounded-xl bg-black border border-white/10 p-3.5 flex flex-col gap-2.5">
                        <p className="text-xs font-bold text-white">Timestamp Bookmarks</p>
                        <div className="flex flex-wrap gap-1.5">
                          {['Drop', 'Beat Switch', 'Max Lift', 'Hook'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setBookmarkLabel(preset)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                                bookmarkLabel === preset
                                  ? 'text-black border-transparent'
                                  : 'bg-[#121212] text-zinc-300 border-white/10'
                              }`}
                              style={bookmarkLabel === preset ? { backgroundColor: accentHex } : undefined}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={bookmarkLabel}
                            onChange={(e) => setBookmarkLabel(e.target.value)}
                            maxLength={24}
                            placeholder="Label (e.g. Drop)"
                            className="flex-1 h-10 px-3 rounded-xl bg-[#121212] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
                          />
                          <button
                            type="button"
                            onClick={() => onAddBookmark(currentTime, bookmarkLabel || 'Drop')}
                            className="h-10 px-3.5 rounded-xl text-xs font-bold text-black shrink-0 cursor-pointer"
                            style={{ backgroundColor: accentHex }}
                          >
                            Pin {formatTime(currentTime)}
                          </button>
                        </div>

                        {bookmarks.length > 0 && (
                          <div className="flex flex-col gap-1.5 pt-1">
                            {bookmarks.map((bm) => (
                              <div
                                key={bm.id}
                                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#121212]"
                              >
                                <button
                                  type="button"
                                  onClick={() => onSeek(bm.time)}
                                  className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                                >
                                  <span
                                    className="text-xs font-mono-tabular font-bold"
                                    style={{ color: accentHex }}
                                  >
                                    {formatTime(bm.time)}
                                  </span>
                                  <span className="text-xs text-white truncate">{bm.label}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteBookmark(bm.id)}
                                  className="w-7 h-7 rounded-md hover:bg-rose-500/15 flex items-center justify-center text-zinc-400 hover:text-rose-400 cursor-pointer"
                                  aria-label="Delete bookmark"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sheet: Sleep Timer */}
                  {activeSheet === 'sleep' && (
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { id: 'off', label: 'Timer Off' },
                          { id: '15m', label: '15 Minutes' },
                          { id: '30m', label: '30 Minutes' },
                          { id: '60m', label: '60 Minutes' },
                          { id: 'end-of-track', label: 'End of Current Track' },
                        ] as const
                      ).map((item) => {
                        const active = sleepTimerMode === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              onSelectSleepTimer(item.id);
                              setActiveSheet('none');
                            }}
                            className={`h-11 px-3.5 rounded-xl border text-xs font-bold text-left flex items-center justify-between cursor-pointer ${
                              item.id === 'end-of-track' ? 'col-span-2' : ''
                            } ${
                              active
                                ? 'text-black border-transparent'
                                : 'bg-black text-white border-white/10 hover:border-white/25'
                            }`}
                            style={active ? { backgroundColor: accentHex } : undefined}
                          >
                            <span>{item.label}</span>
                            {active && <Check className="w-4 h-4" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Sheet: True Queue Control with Up Next */}
                  {activeSheet === 'queue' && (
                    <div className="flex flex-col gap-3">
                      {/* Now Playing */}
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                          Now Playing
                        </p>
                        <div className="p-2.5 rounded-xl bg-white/10 flex items-center gap-2.5">
                          <img
                            src={song.cover}
                            alt={song.title}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate" style={{ color: accentHex }}>
                              {song.title}
                            </p>
                            <p className="text-[11px] text-[#B3B3B3] truncate">{song.artist}</p>
                          </div>
                          <AudioLines className="w-4 h-4 shrink-0" style={{ color: accentHex }} />
                        </div>
                      </div>

                      {/* Up Next Ordered List */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#B3B3B3]">
                            Up Next ({upNextSongs.length})
                          </p>
                          <span className="text-[10px] font-mono-tabular text-zinc-400">
                            {repeatMode === 'one'
                              ? 'Repeat One'
                              : shuffle
                              ? 'Shuffle On'
                              : repeatMode === 'all'
                              ? 'Repeat All'
                              : 'In Order'}
                          </span>
                        </div>

                        {upNextSongs.length === 0 ? (
                          <div className="rounded-xl bg-black/50 border border-white/10 p-4 text-center text-xs text-[#B3B3B3]">
                            End of Queue. Turn on Repeat All or Shuffle to keep looping.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {upNextSongs.map((qSong, upIdx) => {
                              const queueIdx = queue.findIndex((s) => s.id === qSong.id);
                              const excludedShuffle = excludedShuffleSongIds.includes(qSong.id);
                              const isImmediateNext = upIdx === 0;
                              return (
                                <div
                                  key={`upnext-${qSong.id}-${upIdx}`}
                                  className={`p-2 rounded-xl flex items-center gap-2 transition-colors ${
                                    isImmediateNext
                                      ? 'bg-white/[0.07] border border-white/10'
                                      : 'bg-black/40 hover:bg-white/5'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onSelectQueueSong(qSong);
                                      setActiveSheet('none');
                                    }}
                                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                                  >
                                    <img
                                      src={qSong.cover}
                                      alt={qSong.title}
                                      referrerPolicy="no-referrer"
                                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        {isImmediateNext && (
                                          <span
                                            className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase text-black shrink-0"
                                            style={{ backgroundColor: accentHex }}
                                          >
                                            Next
                                          </span>
                                        )}
                                        <p className="text-xs font-bold text-white truncate">
                                          {qSong.title}
                                        </p>
                                      </div>
                                      <p className="text-[11px] text-[#B3B3B3] truncate">
                                        {qSong.artist}
                                        {excludedShuffle ? ' · Hidden in Shuffle' : ''}
                                      </p>
                                    </div>
                                  </button>

                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => onToggleExcludeShuffle(qSong.id)}
                                      title={excludedShuffle ? 'Allow in Shuffle' : 'Skip in Shuffle'}
                                      className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer"
                                      style={{ color: excludedShuffle ? accentHex : '#71717a' }}
                                      aria-label="Toggle skip in shuffle"
                                    >
                                      <EyeOff className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={queueIdx <= 0}
                                      onClick={() => queueIdx >= 0 && onMoveQueueItem(queueIdx, -1)}
                                      className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-400 disabled:opacity-25 cursor-pointer"
                                      aria-label="Move up"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={queueIdx === -1 || queueIdx >= queue.length - 1}
                                      onClick={() => queueIdx >= 0 && onMoveQueueItem(queueIdx, 1)}
                                      className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-400 disabled:opacity-25 cursor-pointer"
                                      aria-label="Move down"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    {queue.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => onRemoveQueueItem(qSong.id)}
                                        className="w-7 h-7 rounded-lg hover:bg-rose-500/15 flex items-center justify-center text-zinc-500 hover:text-rose-400 cursor-pointer"
                                        aria-label="Remove from queue"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
