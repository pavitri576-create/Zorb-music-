import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FolderSearch, Lock, Music, Plus, Upload, X } from 'lucide-react';
import { pickAndScanDirectory, supportsDirectoryPicker } from '../utils/musicScanner';

interface MusicScanModalProps {
  isOpen: boolean;
  accentHex: string;
  usedSlots: number;
  maxSlots: number;
  isUnlimited: boolean;
  canExpandMoreSpace: boolean;
  onAddMoreSpace: () => void;
  onScanFiles: (files: File[]) => Promise<{ added: number; duplicates: number; blockedByLimit: number }>;
  onOpenManualImport: () => void;
  onClose: () => void;
}

export const MusicScanModal: React.FC<MusicScanModalProps> = ({
  isOpen,
  accentHex,
  usedSlots,
  maxSlots,
  isUnlimited,
  canExpandMoreSpace,
  onAddMoreSpace,
  onScanFiles,
  onOpenManualImport,
  onClose,
}) => {
  const [scanning, setScanning] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleScanFilesList = async (files: File[]) => {
    if (files.length === 0) {
      setStatusMsg('No audio files found in that selection.');
      return;
    }
    setScanning(true);
    setStatusMsg(null);
    try {
      const res = await onScanFiles(files);
      if (res.blockedByLimit > 0) {
        setStatusMsg(
          `Added ${res.added} track(s). ${res.blockedByLimit} skipped due to storage slot limit — tap Add +5 More Space below!`
        );
      } else if (res.added === 0 && res.duplicates > 0) {
        setStatusMsg(`All ${res.duplicates} song(s) are already in your Library.`);
      } else {
        setStatusMsg(
          `Scanned ${res.added} new song(s)${res.duplicates > 0 ? ` · ${res.duplicates} duplicate(s) skipped` : ''}.`
        );
        if (res.added > 0) {
          setTimeout(() => onClose(), 900);
        }
      }
    } finally {
      setScanning(false);
    }
  };

  const handleAutoScanClick = async () => {
    setStatusMsg(null);
    if (supportsDirectoryPicker()) {
      try {
        setScanning(true);
        const files = await pickAndScanDirectory();
        setScanning(false);
        if (files) {
          await handleScanFilesList(files);
          return;
        }
      } catch (err) {
        setScanning(false);
        // User cancelled directory picker or iframe blocked showDirectoryPicker -> fallback to file input
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
      }
    }
    multiFileInputRef.current?.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: 24, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 24, scale: 0.97 }}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#121212] border border-white/15 p-5 sm:p-6 flex flex-col gap-4"
          >
            <input
              ref={multiFileInputRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac,.flac"
              onChange={(e) => {
                const list = e.target.files ? Array.from(e.target.files) : [];
                e.target.value = '';
                if (list.length > 0) {
                  void handleScanFilesList(list);
                }
              }}
              className="hidden"
            />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-black shrink-0"
                  style={{ backgroundColor: accentHex }}
                >
                  <FolderSearch className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">
                    Allow ZORB to find your music
                  </h2>
                  <p className="text-xs text-[#B3B3B3] mt-0.5">
                    Auto-imports title, artist, cover &amp; duration with zero duplicates
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white shrink-0 cursor-pointer"
                aria-label="Close music scan dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Import Space Meter */}
            <div className="rounded-xl bg-black border border-white/10 p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">
                  {isUnlimited ? 'Unlimited Song Space (Day 15+ Unlocked)' : `Import Space: ${usedSlots} / ${maxSlots} Songs`}
                </p>
                <p className="text-[11px] text-[#B3B3B3] mt-0.5">
                  {isUnlimited
                    ? 'Import 25+ songs anytime'
                    : 'Reach Day 15 to unlock 25+ unlimited song imports'}
                </p>
              </div>
              {!isUnlimited && canExpandMoreSpace && (
                <button
                  type="button"
                  onClick={onAddMoreSpace}
                  className="h-9 px-3 rounded-full text-xs font-bold text-black shrink-0 inline-flex items-center gap-1 active:scale-[0.97] cursor-pointer"
                  style={{ backgroundColor: accentHex }}
                >
                  <Plus className="w-3.5 h-3.5" /> +5 Space
                </button>
              )}
              {!isUnlimited && !canExpandMoreSpace && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono-tabular text-amber-400 shrink-0">
                  <Lock className="w-3.5 h-3.5" /> Day 15
                </span>
              )}
            </div>

            {statusMsg && (
              <div className="rounded-xl bg-black border border-white/15 px-3.5 py-2.5 text-xs text-zinc-200 flex items-center gap-2">
                <Music className="w-4 h-4 shrink-0" style={{ color: accentHex }} />
                <span>{statusMsg}</span>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                disabled={scanning}
                onClick={handleAutoScanClick}
                className="w-full h-12 rounded-full font-bold text-sm text-black flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-55 cursor-pointer"
                style={{ backgroundColor: accentHex }}
              >
                <FolderSearch className="w-4 h-4" />
                {scanning ? 'Scanning Your Music...' : 'Scan My Music'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenManualImport();
                  }}
                  className="flex-1 h-11 rounded-full bg-[#181818] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" style={{ color: accentHex }} />
                  Manual Import
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 px-5 rounded-full bg-black border border-white/10 text-xs font-semibold text-[#B3B3B3] hover:text-white cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
