import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Crown, SkipForward, X } from 'lucide-react';
import { ZorbLogo } from './ZorbLogo';

interface AdInterstitialModalProps {
  isOpen: boolean;
  accentHex: string;
  onCloseAd: () => void;
  onLearnMorePremium?: () => void;
}

export const AdInterstitialModal: React.FC<AdInterstitialModalProps> = ({
  isOpen,
  accentHex,
  onCloseAd,
  onLearnMorePremium,
}) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      return;
    }
    setCountdown(5);
    const id = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [isOpen]);

  const canSkip = countdown <= 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col justify-between p-5 sm:p-8"
        >
          {/* Top Ad Header Bar */}
          <div className="flex items-center justify-between max-w-xl w-full mx-auto">
            <span className="text-xs font-mono-tabular uppercase tracking-widest text-zinc-400">
              Sponsored Break · Offline Ad
            </span>

            <button
              type="button"
              disabled={!canSkip}
              onClick={onCloseAd}
              className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[#0B0D12] border border-white/15 flex items-center justify-center gap-1.5 text-xs font-bold text-white disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Close ad"
            >
              {canSkip ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </>
              ) : (
                <span className="font-mono-tabular">{countdown}s</span>
              )}
            </button>
          </div>

          {/* Center Interstitial Promo Card */}
          <motion.div
            initial={{ scale: 0.94, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md mx-auto rounded-3xl bg-[#0B0D12] border-2 p-6 sm:p-8 text-center flex flex-col items-center gap-5"
            style={{
              borderColor: accentHex,
              boxShadow: `0 0 42px rgba(var(--zorb-accent-rgb), 0.28)`,
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl bg-black border flex items-center justify-center"
              style={{ borderColor: accentHex, color: accentHex }}
            >
              <Crown className="w-8 h-8" />
            </div>

            <ZorbLogo size="md" accentColor={accentHex} showFormula />

            <div>
              <p className="text-xs font-mono-tabular uppercase tracking-widest" style={{ color: accentHex }}>
                AD — ZORB Premium — Remove Ads
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-wide text-white mt-2 text-balance">
                Uninterrupted Phonk &amp; Beat Flow
              </h2>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Zero breaks every 6 tracks. Unlock ZORB Premium to keep pure black focus sessions rolling 100% offline.
              </p>
            </div>

            {onLearnMorePremium && (
              <button
                type="button"
                onClick={onLearnMorePremium}
                className="w-full h-12 rounded-xl text-xs font-bold text-black cursor-pointer active:scale-95 transition-transform"
                style={{ backgroundColor: accentHex }}
              >
                ZORB Premium — Coming Soon
              </button>
            )}
          </motion.div>

          {/* Bottom Skip Button */}
          <div className="max-w-xl w-full mx-auto flex items-center justify-between gap-3">
            <span className="text-[11px] font-mono-tabular text-zinc-500">
              Next 6 tracks unlock free after this break
            </span>
            <button
              type="button"
              disabled={!canSkip}
              onClick={onCloseAd}
              className="h-11 px-5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              style={{
                backgroundColor: canSkip ? accentHex : '#18181b',
                color: canSkip ? '#000000' : '#a1a1aa',
              }}
            >
              <SkipForward className="w-4 h-4" />
              {canSkip ? 'Skip Ad' : `Skip in ${countdown}s`}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
