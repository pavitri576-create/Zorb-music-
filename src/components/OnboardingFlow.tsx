import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Flame, FolderPlus, TrendingUp, WifiOff } from 'lucide-react';
import { FloatingPuzzlePieces, ZorbLogo } from './ZorbLogo';

interface OnboardingFlowProps {
  accentHex: string;
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ accentHex, onComplete }) => {
  const [slide, setSlide] = useState(0);

  const handleNext = () => {
    if (slide < 2) {
      setSlide((s) => s + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black text-white flex flex-col justify-between overflow-hidden">
      <FloatingPuzzlePieces count={16} accentColor={accentHex} />

      <div className="relative z-10 flex items-center justify-between px-6 pt-6 max-w-2xl w-full mx-auto">
        <ZorbLogo size="sm" accentColor={accentHex} />
        <button
          type="button"
          onClick={onComplete}
          className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-2 min-h-[44px] flex items-center transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-4 max-w-2xl w-full mx-auto">
        <AnimatePresence mode="wait">
          {slide === 0 && (
            <motion.div
              key="slide-0"
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -36 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center text-center"
            >
              <div
                className="w-28 h-28 rounded-2xl flex items-center justify-center mb-8 border bg-[#0B0D12]"
                style={{
                  borderColor: accentHex,
                  boxShadow: `0 0 36px rgba(var(--zorb-accent-rgb), 0.25)`,
                }}
              >
                <ZorbLogo size="md" accentColor={accentHex} />
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight uppercase text-balance">
                Welcome to ZORB
              </h1>
              <p
                className="font-mono-tabular text-base sm:text-lg font-semibold mt-3 tracking-widest"
                style={{ color: accentHex }}
              >
                Z = M × D²
              </p>
              <p className="text-sm sm:text-base text-zinc-400 max-w-md mt-4 leading-relaxed">
                Your minimal luxury phonk sanctuary. Every track locks you deeper into flow, turning pure music into measurable momentum.
              </p>
            </motion.div>
          )}

          {slide === 1 && (
            <motion.div
              key="slide-1"
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -36 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center text-center"
            >
              <div className="w-full max-w-sm rounded-2xl bg-[#0B0D12] border border-white/10 p-5 mb-7">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
                  <span className="font-mono-tabular">D = M × T²</span>
                  <span className="flex items-center gap-1 font-medium" style={{ color: accentHex }}>
                    <TrendingUp className="w-3.5 h-3.5" /> Quadratic Flow
                  </span>
                </div>
                <svg viewBox="0 0 280 120" className="w-full h-28 overflow-visible">
                  <defs>
                    <linearGradient id="onboardCurveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accentHex} stopOpacity="0.38" />
                      <stop offset="100%" stopColor={accentHex} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="108" x2="280" y2="108" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <path
                    d="M 8 106 Q 120 100 272 12 L 272 108 L 8 108 Z"
                    fill="url(#onboardCurveGrad)"
                  />
                  <motion.path
                    d="M 8 106 Q 120 100 272 12"
                    fill="none"
                    stroke={accentHex}
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                  />
                  <circle cx="272" cy="12" r="4.5" fill={accentHex} />
                </svg>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-[11px] text-zinc-400 font-mono-tabular">
                  <div>Z = ZORB</div>
                  <div>M = Music</div>
                  <div>D² = Time²</div>
                </div>
              </div>

              <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight uppercase text-balance">
                Music = Dopamine
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 max-w-md mt-3 leading-relaxed">
                Dopamine grows in square with time. The longer you stay locked in your daily Phonk session, the faster your ZORB score accelerates.
              </p>
            </motion.div>
          )}

          {slide === 2 && (
            <motion.div
              key="slide-2"
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -36 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center text-center"
            >
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-7">
                <div className="rounded-2xl bg-[#121212] border border-white/10 p-4 flex flex-col items-center text-center gap-2">
                  <div
                    className="w-12 h-12 rounded-xl bg-black border border-white/15 flex items-center justify-center"
                    style={{ color: accentHex }}
                  >
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-white">Day 15 · 25+ Songs</span>
                  <span className="text-[11px] text-zinc-400">Unlimited Vault Unlock</span>
                </div>
                <div
                  className="rounded-2xl bg-[#121212] border p-4 flex flex-col items-center text-center gap-2"
                  style={{ borderColor: accentHex }}
                >
                  <div
                    className="w-12 h-12 rounded-xl bg-black border flex items-center justify-center"
                    style={{ borderColor: accentHex, color: accentHex }}
                  >
                    <WifiOff className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-white">Day 30 · Full Offline</span>
                  <span className="text-[11px]" style={{ color: accentHex }}>
                    Zero Ads Forever
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: accentHex }}>
                <Flame className="w-4 h-4" /> 10 Min Daily Streak
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight uppercase text-balance">
                30 Days = Full Offline
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 max-w-md mt-3 leading-relaxed">
                Unlock Coins, Themes &amp; Extra Song Space as you build your streak. Hit Day 15 to import 25+ songs and Day 30 for permanent ad-free Offline Mode.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 px-6 pb-8 pt-2 max-w-2xl w-full mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setSlide(i)}
              className="h-1.5 rounded-full transition-all duration-200"
              style={{
                width: slide === i ? 28 : 8,
                backgroundColor: slide === i ? accentHex : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="w-full h-13 rounded-2xl font-semibold text-sm text-black flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer"
          style={{
            backgroundColor: accentHex,
            boxShadow: `0 0 24px rgba(var(--zorb-accent-rgb), 0.35)`,
          }}
        >
          <span>{slide < 2 ? 'Next' : "Let's Start"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
