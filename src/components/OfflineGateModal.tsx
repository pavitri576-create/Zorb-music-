import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Clock, Play, WifiOff } from 'lucide-react';
import { MAX_OFFLINE_CARRY_ONS } from '../utils/storage';

interface OfflineGateModalProps {
  isOpen: boolean;
  mode: 'offline-prompt' | 'forced-reconnect-ad';
  carryOnCount: number;
  accentHex: string;
  onWatchAdNow: () => void;
  onCarryOnLater: () => void;
}

export const OfflineGateModal: React.FC<OfflineGateModalProps> = ({
  isOpen,
  mode,
  carryOnCount,
  accentHex,
  onWatchAdNow,
  onCarryOnLater,
}) => {
  const isForcedReconnect = mode === 'forced-reconnect-ad';
  const canCarryOn = !isForcedReconnect && carryOnCount < MAX_OFFLINE_CARRY_ONS;
  const remainingSkips = Math.max(0, MAX_OFFLINE_CARRY_ONS - carryOnCount);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Offline Mode Ad Gate"
        >
          <motion.div
            initial={{ scale: 0.94, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 12 }}
            className="w-full max-w-sm rounded-3xl bg-[#121212] border-2 p-6 text-center flex flex-col items-center gap-4 shadow-2xl"
            style={{
              borderColor: accentHex,
              boxShadow: `0 0 36px rgba(var(--zorb-accent-rgb), 0.28)`,
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl bg-black border flex items-center justify-center"
              style={{ borderColor: accentHex, color: accentHex }}
            >
              {isForcedReconnect ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <WifiOff className="w-7 h-7" />
              )}
            </div>

            <div>
              <p
                className="text-[11px] font-mono-tabular uppercase tracking-widest"
                style={{ color: accentHex }}
              >
                {isForcedReconnect ? 'Connection Restored · Action Required' : 'Offline - Saved Songs Only'}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5">
                {isForcedReconnect
                  ? 'You skipped Ad. Watch now to continue.'
                  : 'Watch 1 Ad to get 6 Hours Offline Mode'}
              </h2>
              <p className="text-xs text-[#B3B3B3] mt-2 leading-relaxed">
                {isForcedReconnect
                  ? 'You previously tapped Carry On while offline. Complete this 15s ad now to unlock your next 6 hours offline.'
                  : 'Unlock 6 hours of uninterrupted playback for all your downloaded, imported, and cached songs.'}
              </p>
            </div>

            <div className="w-full flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={onWatchAdNow}
                className="w-full h-12 rounded-full font-bold text-sm text-black flex items-center justify-center gap-2 active:scale-[0.97] transition-transform cursor-pointer"
                style={{ backgroundColor: accentHex }}
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Ad Now
              </button>

              {canCarryOn ? (
                <button
                  type="button"
                  onClick={onCarryOnLater}
                  className="w-full h-11 rounded-full bg-[#181818] hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 active:scale-[0.97] transition-transform cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  Carry On / Later ({remainingSkips} left)
                </button>
              ) : !isForcedReconnect ? (
                <p className="text-[11px] font-mono-tabular text-amber-400 pt-1">
                  Carry On limit reached (2/2). Watch Ad to unlock 6 Hours Offline Mode.
                </p>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
