import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Download,
  ImagePlus,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import {
  BeatLengthSeconds,
  BeatMood,
  BeatPadId,
  BeatPattern,
} from '../types/zorb';
import {
  ALL_PADS,
  BEAT_ROWS,
  createAutoPhonkPattern,
  createEmptyPattern,
  generateBeatCoverDataUrl,
  getBeatAudioContext,
  isPadActiveInPattern,
  LiveRecordedHit,
  renderBeatToWavBlob,
  triggerPadSound,
} from '../utils/beatSynth';
import { PuzzlePieceIcon } from './ZorbLogo';

interface SoloBeatMakerProps {
  accentHex: string;
  creatorName: string;
  onBack: () => void;
  onPauseMainPlayer: () => void;
  onSaveOrUploadBeat: (payload: {
    title: string;
    cover: string;
    bpm: number;
    mood: BeatMood;
    duration: number;
    steps: BeatPattern;
    wavBlob: Blob;
    publishToCommunity: boolean;
  }) => Promise<void>;
  onOpenMyBeatsLibrary: () => void;
}

const LENGTH_OPTIONS: { label: string; seconds: BeatLengthSeconds }[] = [
  { label: '30 Sec', seconds: 30 },
  { label: '60 Sec', seconds: 60 },
  { label: '2 Min', seconds: 120 },
];

const MOOD_OPTIONS: BeatMood[] = ['DARK', 'AGGRESSIVE', 'CHILL'];

const CONFETTI_PIECES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${5 + ((i * 19) % 90)}%`,
  delay: (i % 6) * 0.08,
  duration: 1.4 + (i % 4) * 0.25,
  size: 14 + (i % 3) * 5,
  rotate: (i % 2 === 0 ? 1 : -1) * (25 + (i * 17) % 140),
}));

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const SoloBeatMaker: React.FC<SoloBeatMakerProps> = ({
  accentHex,
  creatorName,
  onBack,
  onPauseMainPlayer,
  onSaveOrUploadBeat,
  onOpenMyBeatsLibrary,
}) => {
  // Top Beat Controls State
  const [bpm, setBpm] = useState<number>(140);
  const [mood, setMood] = useState<BeatMood>('DARK');
  const [lengthSec, setLengthSec] = useState<BeatLengthSeconds>(60);
  const [volume, setVolume] = useState<number>(0.85);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Middle Pad & Sequencer State
  const [pattern, setPattern] = useState<BeatPattern>(() => createEmptyPattern());
  const [selectedPadId, setSelectedPadId] = useState<BeatPadId>('cowbell');
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [flashingPadId, setFlashingPadId] = useState<BeatPadId | null>(null);
  const [autoVariant, setAutoVariant] = useState<number>(0);
  const [statusHint, setStatusHint] = useState<string>(
    'Tap a pad to hear it. Tap again to add to loop. Hold to remove.'
  );

  // Recording & Post-Record Modal State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordElapsedSec, setRecordElapsedSec] = useState<number>(0);
  const [isRenderingModal, setIsRenderingModal] = useState<boolean>(false);

  const [recordedModalOpen, setRecordedModalOpen] = useState<boolean>(false);
  const [beatName, setBeatName] = useState<string>('My First Phonk');
  const [customCover, setCustomCover] = useState<string | null>(null);
  const [renderedWavBlob, setRenderedWavBlob] = useState<Blob | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [isSavingBeat, setIsSavingBeat] = useState<boolean>(false);

  // Reward Celebration Modal State
  const [rewardPopupOpen, setRewardPopupOpen] = useState<boolean>(false);
  const [lastSavedMode, setLastSavedMode] = useState<'save' | 'upload'>('save');

  // Audio scheduler refs (stay fresh inside lookahead interval)
  const patternRef = useRef<BeatPattern>(pattern);
  const bpmRef = useRef<number>(bpm);
  const moodRef = useRef<BeatMood>(mood);
  const volumeRef = useRef<number>(volume);
  const masterGainRef = useRef<GainNode | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const recordStartMsRef = useRef<number>(0);
  const liveHitsRef = useRef<LiveRecordedHit[]>([]);
  const nextStepTimeRef = useRef<number>(0);
  const stepCursorRef = useRef<number>(0);
  const schedulerIdRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    volumeRef.current = volume;
    if (masterGainRef.current) {
      const ctx = getBeatAudioContext();
      masterGainRef.current.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
    }
  }, [volume]);

  const ensureMasterGain = useCallback(() => {
    const ctx = getBeatAudioContext();
    if (!masterGainRef.current) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volumeRef.current, ctx.currentTime);
      gain.connect(ctx.destination);
      masterGainRef.current = gain;
    }
    return { ctx, master: masterGainRef.current };
  }, []);

  // Auto-generated ZORB cover synchronized with beat title, mood, BPM, and active theme
  const generatedCover = useMemo(
    () => generateBeatCoverDataUrl(beatName, mood, bpm, accentHex),
    [beatName, mood, bpm, accentHex]
  );

  const activeCover = customCover || generatedCover;

  const selectedPadSpec = useMemo(
    () => ALL_PADS.find((p) => p.id === selectedPadId) || ALL_PADS[0],
    [selectedPadId]
  );

  const activePadCount = useMemo(
    () => ALL_PADS.filter((p) => isPadActiveInPattern(pattern, p.id)).length,
    [pattern]
  );

  const stopLoop = useCallback(() => {
    if (schedulerIdRef.current !== null) {
      window.clearInterval(schedulerIdRef.current);
      schedulerIdRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(-1);
  }, []);

  const startLoop = useCallback(() => {
    onPauseMainPlayer();
    const { ctx, master } = ensureMasterGain();
    if (schedulerIdRef.current !== null) {
      window.clearInterval(schedulerIdRef.current);
    }

    stepCursorRef.current = 0;
    nextStepTimeRef.current = ctx.currentTime + 0.04;
    setIsPlaying(true);

    schedulerIdRef.current = window.setInterval(() => {
      const stepSec = 60 / bpmRef.current / 2;
      while (nextStepTimeRef.current < ctx.currentTime + 0.11) {
        const sIdx = stepCursorRef.current;
        const when = nextStepTimeRef.current;

        for (const pad of ALL_PADS) {
          if (patternRef.current[pad.id]?.[sIdx]) {
            triggerPadSound(ctx, master, pad.id, moodRef.current, when, sIdx, stepSec);
          }
        }

        const uiDelayMs = Math.max(0, (when - ctx.currentTime) * 1000);
        window.setTimeout(() => {
          setCurrentStep(sIdx);
        }, uiDelayMs);

        nextStepTimeRef.current += stepSec;
        stepCursorRef.current = (stepCursorRef.current + 1) % 8;
      }
    }, 25);
  }, [ensureMasterGain, onPauseMainPlayer]);

  // Clean up audio & object URLs on unmount
  useEffect(() => {
    return () => {
      if (schedulerIdRef.current !== null) {
        window.clearInterval(schedulerIdRef.current);
      }
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      if (previewAudioUrl) {
        URL.revokeObjectURL(previewAudioUrl);
      }
    };
  }, [previewAudioUrl]);

  const stopRecordingAndPrepareModal = useCallback(async () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    stopLoop();
    setIsRenderingModal(true);

    // Ensure at least a valid Phonk groove exists if user pressed REC before toggling any loop steps
    const hasAnyStep = ALL_PADS.some((p) => isPadActiveInPattern(patternRef.current, p.id));
    const finalPattern = hasAnyStep ? patternRef.current : createAutoPhonkPattern(moodRef.current, 0);
    if (!hasAnyStep) {
      setPattern(finalPattern);
    }

    try {
      const wavBlob = await renderBeatToWavBlob(
        finalPattern,
        bpmRef.current,
        moodRef.current,
        lengthSec,
        volumeRef.current,
        liveHitsRef.current
      );
      if (previewAudioUrl) {
        URL.revokeObjectURL(previewAudioUrl);
      }
      const nextUrl = URL.createObjectURL(wavBlob);
      setRenderedWavBlob(wavBlob);
      setPreviewAudioUrl(nextUrl);
      setCustomCover(null);
      setRecordedModalOpen(true);
    } finally {
      setIsRenderingModal(false);
    }
  }, [lengthSec, previewAudioUrl, stopLoop]);

  // Recording elapsed timer
  useEffect(() => {
    if (!isRecording) return;
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordStartMsRef.current) / 1000);
      setRecordElapsedSec(elapsed);
      if (elapsed >= lengthSec) {
        stopRecordingAndPrepareModal();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [isRecording, lengthSec, stopRecordingAndPrepareModal]);

  const handleToggleRecord = () => {
    if (isRecording) {
      stopRecordingAndPrepareModal();
      return;
    }
    // If no pad is in loop yet, pre-load current selected pad's groove or keep empty + play live
    onPauseMainPlayer();
    liveHitsRef.current = [];
    recordStartMsRef.current = Date.now();
    setRecordElapsedSec(0);
    isRecordingRef.current = true;
    setIsRecording(true);
    if (!isPlaying) {
      startLoop();
    }
    setStatusHint('Recording live beat loop... Tap pads to jam or tap STOP when ready.');
  };

  // Pad interaction:
  // Tap 1 (when unselected & inactive) -> Play sound + select pad
  // Tap 2 (tap again while selected & inactive) -> Play sound + add to loop!
  // Tap when already active -> Play sound + focus in sequencer
  // Long press (450ms) -> Remove from loop
  const playSinglePadNow = (padId: BeatPadId) => {
    onPauseMainPlayer();
    const { ctx, master } = ensureMasterGain();
    const stepSec = 60 / bpm / 2;
    triggerPadSound(ctx, master, padId, mood, ctx.currentTime, Math.max(0, currentStep), stepSec);

    if (isRecordingRef.current) {
      const offsetSec = (Date.now() - recordStartMsRef.current) / 1000;
      liveHitsRef.current.push({ padId, offsetSec });
    }

    setFlashingPadId(padId);
    window.setTimeout(() => {
      setFlashingPadId((prev) => (prev === padId ? null : prev));
    }, 150);
  };

  const handlePadPointerDown = (padId: BeatPadId) => {
    longPressTriggeredRef.current = false;
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      if (isPadActiveInPattern(patternRef.current, padId)) {
        setPattern((prev) => ({
          ...prev,
          [padId]: Array(8).fill(false),
        }));
        const spec = ALL_PADS.find((p) => p.id === padId);
        setStatusHint(`Removed ${spec?.label || 'pad'} from loop`);
      }
    }, 450);
  };

  const handlePadPointerUp = (padId: BeatPadId) => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressTriggeredRef.current) {
      return;
    }

    playSinglePadNow(padId);
    const spec = ALL_PADS.find((p) => p.id === padId)!;
    const isActive = isPadActiveInPattern(pattern, padId);

    if (!isActive && selectedPadId === padId) {
      // "Tap again -> Sound adds to Loop"
      setPattern((prev) => ({
        ...prev,
        [padId]: [...spec.defaultSteps],
      }));
      setStatusHint(`${spec.label} added to loop! Edit steps 1–8 below or hold pad to remove.`);
      if (!isPlaying) {
        startLoop();
      }
    } else if (!isActive) {
      setSelectedPadId(padId);
      setStatusHint(`Selected ${spec.label}. Tap again to add it to your loop.`);
    } else {
      setSelectedPadId(padId);
      setStatusHint(`Editing ${spec.label} steps (1–8). Long-press pad to remove from loop.`);
    }
  };

  const handlePadPointerCancel = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleToggleStep = (stepIndex: number) => {
    setPattern((prev) => {
      const currentRow = prev[selectedPadId] || Array(8).fill(false);
      const nextRow = [...currentRow];
      nextRow[stepIndex] = !nextRow[stepIndex];
      if (nextRow[stepIndex]) {
        playSinglePadNow(selectedPadId);
      }
      return {
        ...prev,
        [selectedPadId]: nextRow,
      };
    });
  };

  const handleAutoMake = () => {
    const nextVariant = autoVariant + 1;
    setAutoVariant(nextVariant);
    const generated = createAutoPhonkPattern(mood, autoVariant);
    setPattern(generated);
    setSelectedPadId('cowbell');
    startLoop();
    setStatusHint(`Auto-built ${mood} Phonk beat at ${bpm} BPM. Tap any pad or step to customize!`);
  };

  const handleClearLoop = () => {
    setPattern(createEmptyPattern());
    stopLoop();
    setStatusHint('Loop cleared. Tap pads twice or press Auto Make For Me.');
  };

  const handleMoodSwitch = (nextMood: BeatMood) => {
    setMood(nextMood);
    setStatusHint(`Mood switched to ${nextMood} (${nextMood === 'DARK' ? 'F minor' : nextMood === 'AGGRESSIVE' ? 'D minor grit' : 'G minor warm'})`);
  };

  const handleTogglePreviewModalAudio = () => {
    const audio = previewAudioRef.current;
    if (!audio || !previewAudioUrl) return;
    if (isPreviewPlaying) {
      audio.pause();
      setIsPreviewPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPreviewPlaying(true))
        .catch(() => setIsPreviewPlaying(false));
    }
  };

  const handleUploadGalleryCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomCover(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePersistBeat = async (publishToCommunity: boolean) => {
    if (!renderedWavBlob || isSavingBeat) return;
    setIsSavingBeat(true);
    try {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        setIsPreviewPlaying(false);
      }
      await onSaveOrUploadBeat({
        title: beatName.trim() || 'My First Phonk',
        cover: activeCover,
        bpm,
        mood,
        duration: lengthSec,
        steps: pattern,
        wavBlob: renderedWavBlob,
        publishToCommunity,
      });
      setLastSavedMode(publishToCommunity ? 'upload' : 'save');
      setRecordedModalOpen(false);
      setRewardPopupOpen(true);
    } finally {
      setIsSavingBeat(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Studio Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            stopLoop();
            onBack();
          }}
          className="min-h-[44px] px-3 rounded-xl bg-[#121212] border border-white/10 hover:border-white/25 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-right">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wide leading-none">
            Solo Beat Maker
          </h1>
          <p className="text-[11px] text-zinc-400 font-mono-tabular mt-0.5">
            {activePadCount} active loops · {bpm} BPM · {mood}
          </p>
        </div>
      </div>

      {/* PART 1: TOP — BEAT CONTROLS (Simple) */}
      <section className="rounded-2xl bg-[#121212] border border-white/10 p-4 flex flex-col gap-4">
        {/* Row A: Play/Stop + BPM Slider + Volume */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => (isPlaying ? stopLoop() : startLoop())}
              className="flex-1 h-12 px-4 rounded-xl font-bold text-sm text-black flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: accentHex,
                boxShadow: isPlaying ? `0 0 22px rgba(var(--zorb-accent-rgb), 0.55)` : 'none',
              }}
            >
              {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              {isPlaying ? 'STOP' : 'PLAY'}
            </button>
          </div>

          <div className="md:col-span-5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">BPM Tempo</span>
              <span className="font-mono-tabular font-bold text-sm" style={{ color: accentHex }}>
                {bpm} BPM
              </span>
            </div>
            <input
              type="range"
              min={120}
              max={150}
              step={1}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              aria-label="BPM tempo slider"
              className="w-full accent-current cursor-pointer h-2 rounded-lg bg-zinc-800"
              style={{ color: accentHex }}
            />
            <div className="flex justify-between text-[10px] font-mono-tabular text-zinc-500">
              <span>120</span>
              <span>140 Phonk</span>
              <span>150</span>
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" style={{ color: accentHex }} /> Volume
              </span>
              <span className="font-mono-tabular text-zinc-400">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Master volume slider"
              className="w-full accent-current cursor-pointer h-2 rounded-lg bg-zinc-800"
              style={{ color: accentHex }}
            />
          </div>
        </div>

        {/* Row B: Key / Mood Selector + Length Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Key / Mood
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {MOOD_OPTIONS.map((m) => {
                const active = mood === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMoodSwitch(m)}
                    className={`min-h-[42px] rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer whitespace-nowrap px-2 ${
                      active ? 'text-black border-transparent' : 'bg-black text-zinc-300 border-white/10 hover:border-white/25'
                    }`}
                    style={active ? { backgroundColor: accentHex } : undefined}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Beat Length
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {LENGTH_OPTIONS.map((opt) => {
                const active = lengthSec === opt.seconds;
                return (
                  <button
                    key={opt.seconds}
                    type="button"
                    onClick={() => setLengthSec(opt.seconds)}
                    className={`min-h-[42px] rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer whitespace-nowrap px-2 ${
                      active ? 'text-black border-transparent' : 'bg-black text-zinc-300 border-white/10 hover:border-white/25'
                    }`}
                    style={active ? { backgroundColor: accentHex } : undefined}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* PART 2: MIDDLE — BEAT PADS (Main Game Area) */}
      <section className="rounded-2xl bg-[#121212] border border-white/10 p-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <h2 className="font-display text-xl font-extrabold uppercase tracking-wide">
              Beat Pads
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">{statusHint}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleClearLoop}
              className="min-h-[42px] px-3 rounded-xl bg-black border border-white/15 hover:border-white/30 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </button>
            <button
              type="button"
              onClick={handleAutoMake}
              className="min-h-[42px] px-3.5 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: accentHex,
                boxShadow: `0 0 18px rgba(var(--zorb-accent-rgb), 0.35)`,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto Make For Me
            </button>
          </div>
        </div>

        {/* 4 Rows × 4 Pads */}
        <div className="flex flex-col gap-3.5">
          {BEAT_ROWS.map((row) => (
            <div key={row.category} className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono-tabular font-bold uppercase tracking-widest text-zinc-400">
                {row.category}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {row.pads.map((pad) => {
                  const inLoop = isPadActiveInPattern(pattern, pad.id);
                  const isSelected = selectedPadId === pad.id;
                  const isFlashing = flashingPadId === pad.id;
                  const padSteps = pattern[pad.id] || [];
                  const hitsCurrentStep =
                    currentStep >= 0 && Boolean(padSteps[currentStep]);

                  return (
                    <button
                      key={pad.id}
                      type="button"
                      onPointerDown={() => handlePadPointerDown(pad.id)}
                      onPointerUp={() => handlePadPointerUp(pad.id)}
                      onPointerCancel={handlePadPointerCancel}
                      onPointerLeave={handlePadPointerCancel}
                      onContextMenu={(e) => e.preventDefault()}
                      className="relative min-h-[68px] rounded-xl p-2.5 text-left flex flex-col justify-between transition-all select-none active:scale-95 cursor-pointer border"
                      style={{
                        backgroundColor: inLoop
                          ? `rgba(var(--zorb-accent-rgb), ${hitsCurrentStep ? 0.34 : 0.18})`
                          : isFlashing
                          ? `rgba(var(--zorb-accent-rgb), 0.22)`
                          : '#000000',
                        borderColor: inLoop || isSelected ? accentHex : 'rgba(255,255,255,0.12)',
                        boxShadow:
                          hitsCurrentStep || isFlashing
                            ? `0 0 20px rgba(var(--zorb-accent-rgb), 0.55)`
                            : inLoop
                            ? `0 0 12px rgba(var(--zorb-accent-rgb), 0.22)`
                            : 'none',
                      }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-white leading-tight">
                          {pad.label}
                        </span>
                        <span
                          className="text-[10px] font-mono-tabular font-semibold"
                          style={{ color: inLoop ? accentHex : '#71717a' }}
                        >
                          {inLoop ? 'LOOP' : isSelected ? '+ADD' : pad.subLabel}
                        </span>
                      </div>

                      {/* Mini 8-step preview bar inside pad */}
                      <div className="grid grid-cols-8 gap-1 mt-2">
                        {Array.from({ length: 8 }, (_, idx) => {
                          const stepOn = Boolean(padSteps[idx]);
                          const stepPlayhead = currentStep === idx;
                          return (
                            <span
                              key={idx}
                              className="h-1.5 rounded-sm transition-opacity"
                              style={{
                                backgroundColor: stepOn
                                  ? accentHex
                                  : stepPlayhead
                                  ? '#ffffff'
                                  : 'rgba(255,255,255,0.14)',
                                opacity: stepPlayhead && stepOn ? 1 : stepOn ? 0.85 : 0.55,
                              }}
                            />
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 8-Step Sequencer Below Pads */}
        <div className="rounded-xl bg-black border border-white/10 p-3.5 flex flex-col gap-3 mt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" style={{ color: accentHex }} />
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                {selectedPadSpec.label} — 8-Step Loop
              </span>
            </div>

            {isPadActiveInPattern(pattern, selectedPadId) ? (
              <button
                type="button"
                onClick={() =>
                  setPattern((prev) => ({
                    ...prev,
                    [selectedPadId]: Array(8).fill(false),
                  }))
                }
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                Remove from Loop
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setPattern((prev) => ({
                    ...prev,
                    [selectedPadId]: [...selectedPadSpec.defaultSteps],
                  }))
                }
                className="text-[11px] font-semibold cursor-pointer"
                style={{ color: accentHex }}
              >
                Auto-Fill Steps
              </button>
            )}
          </div>

          <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
            {Array.from({ length: 8 }, (_, idx) => {
              const active = Boolean(pattern[selectedPadId]?.[idx]);
              const isHead = currentStep === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleToggleStep(idx)}
                  className="min-h-[48px] rounded-xl border font-mono-tabular text-xs font-bold flex flex-col items-center justify-center gap-1 active:scale-90 transition-all cursor-pointer"
                  style={{
                    backgroundColor: active ? accentHex : '#121212',
                    color: active ? '#000000' : isHead ? '#ffffff' : '#71717a',
                    borderColor: isHead ? '#ffffff' : active ? accentHex : 'rgba(255,255,255,0.12)',
                    boxShadow: isHead ? `0 0 14px rgba(var(--zorb-accent-rgb), 0.55)` : 'none',
                  }}
                  aria-label={`Step ${idx + 1} for ${selectedPadSpec.label}`}
                >
                  <span>{idx + 1}</span>
                  {isHead && (
                    <span
                      className="w-2 h-0.5 rounded-full"
                      style={{ backgroundColor: active ? '#000000' : accentHex }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* PART 3: BOTTOM — RECORD & SAVE */}
      <section className="rounded-2xl bg-[#121212] border border-white/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="font-display text-xl font-extrabold uppercase tracking-wide text-white">
            Record &amp; Save Beat
          </p>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono-tabular">
            {isRecording
              ? `Recording live · ${formatClock(recordElapsedSec)} / ${formatClock(lengthSec)}`
              : isRenderingModal
              ? 'Mastering stereo WAV mixdown...'
              : `Captures ${lengthSec === 120 ? '2 Min' : `${lengthSec} Sec`} Phonk mixdown · +50 DP reward`}
          </p>
        </div>

        <button
          type="button"
          disabled={isRenderingModal}
          onClick={handleToggleRecord}
          className={`w-full sm:w-auto min-w-[200px] h-14 px-6 rounded-2xl font-display text-xl font-extrabold uppercase tracking-wider text-white flex items-center justify-center gap-2.5 active:scale-95 transition-transform cursor-pointer disabled:opacity-60 ${
            isRecording ? 'animate-pulse' : ''
          }`}
          style={{
            backgroundColor: '#FF1744',
            boxShadow: isRecording
              ? '0 0 28px rgba(255, 23, 68, 0.7)'
              : '0 0 18px rgba(255, 23, 68, 0.38)',
          }}
        >
          {isRecording ? (
            <>
              <Square className="w-5 h-5 fill-current" /> STOP ({formatClock(recordElapsedSec)})
            </>
          ) : isRenderingModal ? (
            'RENDERING...'
          ) : (
            <>● REC</>
          )}
        </button>
      </section>

      {/* POST-RECORD SAVE / UPLOAD POPUP */}
      <AnimatePresence>
        {recordedModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 16 }}
              className="w-full max-w-md rounded-2xl bg-[#121212] border p-5 flex flex-col gap-4 my-auto"
              style={{ borderColor: accentHex }}
            >
              <audio
                ref={previewAudioRef}
                src={previewAudioUrl || undefined}
                onEnded={() => setIsPreviewPlaying(false)}
              />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl font-extrabold uppercase tracking-wide text-white">
                    Beat Ready
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono-tabular">
                    By {creatorName} · {bpm} BPM · {mood}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    previewAudioRef.current?.pause();
                    setIsPreviewPlaying(false);
                    setRecordedModalOpen(false);
                  }}
                  className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                  aria-label="Close popup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Auto-generated ZORB Cover + Gallery option */}
              <div className="flex items-center gap-4">
                <img
                  src={activeCover}
                  alt={beatName || 'Beat Cover'}
                  className="w-24 h-24 rounded-2xl object-cover border shrink-0"
                  style={{ borderColor: accentHex }}
                />
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Beat Name
                  </label>
                  <input
                    type="text"
                    value={beatName}
                    onChange={(e) => setBeatName(e.target.value)}
                    placeholder="My First Phonk"
                    maxLength={32}
                    className="h-11 px-3 rounded-xl bg-black border border-white/15 text-sm font-semibold text-white focus:outline-none focus:border-white/40"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadGalleryCover}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="text-xs font-semibold flex items-center gap-1.5 text-zinc-300 hover:text-white cursor-pointer"
                    >
                      <ImagePlus className="w-3.5 h-3.5" style={{ color: accentHex }} /> Gallery Cover
                    </button>
                    {customCover && (
                      <button
                        type="button"
                        onClick={() => setCustomCover(null)}
                        className="text-[11px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        Reset ZORB Cover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Listen Again | Download WAV | Save Beat */}
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleTogglePreviewModalAudio}
                  className="h-11 rounded-xl bg-black border border-white/15 hover:border-white/30 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPreviewPlaying ? (
                    <>
                      <Pause className="w-4 h-4" style={{ color: accentHex }} /> Pause Preview
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" style={{ color: accentHex }} /> Listen Again
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={previewAudioUrl || '#'}
                    download={`${(beatName || 'my-first-phonk').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.wav`}
                    className="h-12 rounded-xl bg-zinc-900 border border-white/15 hover:border-white/35 text-xs font-bold text-white flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export WAV
                  </a>
                  <button
                    type="button"
                    disabled={isSavingBeat}
                    onClick={() => handlePersistBeat(false)}
                    className="h-12 rounded-xl text-xs font-bold text-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: accentHex }}
                  >
                    <Save className="w-4 h-4" /> Save Beat
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REWARD POPUP + PUZZLE CONFETTI ANIMATION */}
      <AnimatePresence>
        {rewardPopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden"
          >
            {/* Puzzle Confetti Burst */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
              {CONFETTI_PIECES.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ y: -40, opacity: 0, rotate: 0, scale: 0.7 }}
                  animate={{
                    y: ['0vh', '105vh'],
                    opacity: [0, 1, 1, 0],
                    rotate: [0, c.rotate, c.rotate * 2],
                    scale: [0.8, 1.15, 0.9],
                  }}
                  transition={{
                    duration: c.duration,
                    delay: c.delay,
                    ease: 'easeIn',
                  }}
                  style={{
                    position: 'absolute',
                    left: c.left,
                    top: '-24px',
                    width: c.size,
                    height: c.size,
                    color: c.id % 3 === 0 ? '#FFFFFF' : accentHex,
                  }}
                >
                  <PuzzlePieceIcon className="w-full h-full" />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.85, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              className="relative w-full max-w-sm rounded-2xl bg-[#0B0D12] border p-6 text-center flex flex-col items-center gap-4"
              style={{
                borderColor: accentHex,
                boxShadow: `0 0 36px rgba(var(--zorb-accent-rgb), 0.35)`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-black"
                style={{ backgroundColor: accentHex }}
              >
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="font-display text-3xl font-extrabold uppercase tracking-wide text-white">
                  Beat Created!
                </h3>
                <p className="text-sm font-bold mt-2" style={{ color: accentHex }}>
                  +50 Dopamine, +1 Day Streak Progress
                </p>
                <p className="text-xs text-zinc-400 mt-2">
                  {lastSavedMode === 'upload'
                    ? 'Saved offline to My Beats in your Library.'
                    : 'Saved offline to My Beats inside your Library.'}
                </p>
              </div>

              <div className="w-full grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setRewardPopupOpen(false)}
                  className="h-11 rounded-xl bg-black border border-white/15 text-xs font-bold text-white cursor-pointer"
                >
                  Keep Jamming
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRewardPopupOpen(false);
                    onOpenMyBeatsLibrary();
                  }}
                  className="h-11 rounded-xl text-xs font-bold text-black cursor-pointer"
                  style={{ backgroundColor: accentHex }}
                >
                  Open My Beats
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
