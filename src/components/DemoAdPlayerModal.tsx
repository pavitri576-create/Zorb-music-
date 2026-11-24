import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Clock, SkipForward, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { AdPlacement, ADMOB_UNIT_IDS, getAdAdapter } from '../utils/adService';
import { ZorbLogo } from './ZorbLogo';

interface DemoAdPlayerModalProps {
  isOpen: boolean;
  placement: AdPlacement;
  accentHex: string;
  onRewardCompleted: () => void;
  onCancel?: () => void;
}

export const DemoAdPlayerModal: React.FC<DemoAdPlayerModalProps> = ({
  isOpen,
  placement,
  accentHex,
  onRewardCompleted,
  onCancel,
}) => {
  const config = getAdAdapter().getConfig(placement);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setElapsedSec(0);
      return;
    }
    setElapsedSec(0);
    const id = window.setInterval(() => {
      setElapsedSec((prev) => {
        if (prev >= config.durationSec) return config.durationSec;
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isOpen, config.durationSec]);

  const remainingTotal = Math.max(0, config.durationSec - elapsedSec);
  const skipRemaining = Math.max(0, config.skipAfterSec - elapsedSec);
  const canSkip = skipRemaining <= 0;
  const rewardComplete = remainingTotal <= 0;
  const progressPct = Math.min(100, (elapsedSec / config.durationSec) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black flex flex-col justify-between p-4 sm:p-6 select-none"
          aria-modal="true"
          role="dialog"
          aria-label="Sponsored Ad Player"
        >
          {/* Top Ad HUD: Ad Tag, Reward Timer, Mute, Skip after 5s */}
          <div className="max-w-xl w-full mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded bg-amber-400 text-black text-[10px] font-bold uppercase tracking-wider shrink-0">
                AD
              </span>
              <span className="text-xs font-mono-tabular text-zinc-300 truncate flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: accentHex }} />
                {rewardComplete
                  ? `Reward Ready · ${config.rewardLabel}`
                  : `Reward in ${remainingTotal}s · ${config.rewardLabel}`}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="w-10 h-10 rounded-full bg-[#121212] border border-white/15 flex items-center justify-center text-white hover:bg-[#181818] cursor-pointer"
                aria-label={muted ? 'Unmute ad' : 'Mute ad'}
              >
                {muted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4" style={{ color: accentHex }} />}
              </button>

              <button
                type="button"
                disabled={!canSkip}
                onClick={onRewardCompleted}
                className="h-10 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: canSkip ? accentHex : '#181818',
                  color: canSkip ? '#000000' : '#B3B3B3',
                }}
              >
                <SkipForward className="w-3.5 h-3.5" />
                {canSkip ? 'Skip Ad' : `Skip in ${skipRemaining}s`}
              </button>
            </div>
          </div>

          {/* Center 15s Simulated Video Ad Viewport */}
          <div className="max-w-xl w-full mx-auto my-auto">
            <div
              className="relative rounded-3xl overflow-hidden bg-[#121212] border border-white/15 aspect-video flex flex-col items-center justify-center p-6 text-center shadow-2xl"
              style={{
                boxShadow: `0 0 50px rgba(var(--zorb-accent-rgb), 0.22)`,
              }}
            >
              {/* Animated Video Backdrop Bars */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-35" aria-hidden="true">
                <div
                  className="absolute -inset-12 opacity-60"
                  style={{
                    background: `radial-gradient(circle at ${20 + (elapsedSec * 5) % 60}% 45%, ${accentHex}44, transparent 58%)`,
                    transition: 'background 0.8s ease',
                  }}
                />
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-center gap-1.5 h-12">
                  {Array.from({ length: 18 }, (_, idx) => {
                    const barH = 25 + ((idx * 19 + elapsedSec * 23) % 75);
                    return (
                      <span
                        key={idx}
                        className="flex-1 rounded-full transition-all duration-300"
                        style={{
                          height: `${barH}%`,
                          backgroundColor: accentHex,
                          opacity: muted ? 0.35 : 0.75,
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono-tabular uppercase tracking-widest text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: accentHex }} />
                  Sponsored Video · {elapsedSec}s / {config.durationSec}s
                </span>

                <ZorbLogo size="md" accentColor={accentHex} showFormula />

                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {placement === 'offline_unlock_6h'
                    ? 'Unlock 6 Hours Offline Mode'
                    : 'ZORB Studio — Pure Phonk Flow'}
                </h2>
                <p className="text-xs text-[#B3B3B3] max-w-sm">
                  {placement === 'offline_unlock_6h'
                    ? 'Keep listening to your downloaded & imported tracks with zero internet connection.'
                    : 'Keep your daily streak alive with Beat Maker & uninterrupted offline audio.'}
                </p>

                {rewardComplete && (
                  <button
                    type="button"
                    onClick={onRewardCompleted}
                    className="mt-2 h-11 px-6 rounded-full text-xs font-bold text-black inline-flex items-center gap-2 active:scale-[0.97] transition-transform cursor-pointer"
                    style={{ backgroundColor: accentHex }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Claim {config.rewardLabel}
                  </button>
                )}
              </div>

              {/* Video Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                <div
                  className="h-full transition-all duration-1000 linear"
                  style={{ width: `${progressPct}%`, backgroundColor: accentHex }}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] font-mono-tabular text-zinc-500 px-1">
              <span>
                AdMob Ready ·{' '}
                {placement === 'offline_unlock_6h'
                  ? ADMOB_UNIT_IDS.rewardedOffline6h
                  : ADMOB_UNIT_IDS.interstitialSixTracks}
              </span>
              {onCancel && canSkip && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          </div>

          <div className="max-w-xl w-full mx-auto text-center text-[11px] text-zinc-500">
            {canSkip
              ? `You can now press Skip Ad or Claim to receive ${config.rewardLabel}.`
              : `Reward timer running · Skip unlocks in ${skipRemaining}s`}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
