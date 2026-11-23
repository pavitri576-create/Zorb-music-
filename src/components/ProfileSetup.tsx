import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Check, Sparkles } from 'lucide-react';
import { ALL_MUSIC_PREFERENCES, COVER_ART } from '../data/songs';
import { MusicPreference, UserProfile } from '../types/zorb';
import { AvatarCropperModal } from './AvatarCropperModal';
import { FloatingPuzzlePieces, PuzzlePieceIcon, ZorbLogo } from './ZorbLogo';

interface ProfileSetupProps {
  accentHex: string;
  onFinish: (profile: UserProfile) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ accentHex, onFinish }) => {
  const [avatar, setAvatar] = useState<string>(COVER_ART.obsidian);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [preferences, setPreferences] = useState<MusicPreference[]>(['Phonk', 'Drift Phonk']);
  const [cropOpen, setCropOpen] = useState(false);
  const [createdCelebration, setCreatedCelebration] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const togglePref = (pref: MusicPreference) => {
    setPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your name to continue.');
      return;
    }
    if (preferences.length === 0) {
      setErrorMsg('Select at least one music preference.');
      return;
    }
    setErrorMsg('');
    const profile: UserProfile = {
      name: name.trim(),
      bio: bio.trim() || 'Locked into Z = M × D²',
      avatar,
      preferences,
      createdAt: new Date().toISOString(),
    };
    setCreatedCelebration(true);
    setTimeout(() => {
      onFinish(profile);
    }, 1350);
  };

  if (createdCelebration) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-6 text-center">
        <FloatingPuzzlePieces count={20} accentColor={accentHex} />
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center gap-4"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center border-2"
            style={{
              borderColor: accentHex,
              backgroundColor: 'rgba(var(--zorb-accent-rgb), 0.14)',
              boxShadow: `0 0 36px rgba(var(--zorb-accent-rgb), 0.35)`,
            }}
          >
            <PuzzlePieceIcon className="w-10 h-10" color={accentHex} />
          </div>
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-wide">
            Profile Created
          </h2>
          <p className="text-sm text-zinc-400 font-mono-tabular">
            Z = M × D² · Calibrating your Phonk flow...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-5 py-8 flex flex-col items-center justify-center relative overflow-y-auto">
      <FloatingPuzzlePieces count={12} accentColor={accentHex} />

      <motion.form
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-lg rounded-2xl bg-[#0B0D12] border border-white/10 p-6 sm:p-7 flex flex-col gap-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono-tabular uppercase tracking-widest" style={{ color: accentHex }}>
              Step 1 · Player Card
            </p>
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide mt-0.5">
              Set Up Your Profile
            </h1>
          </div>
          <ZorbLogo size="sm" accentColor={accentHex} />
        </div>

        {/* Step 1: Photo Upload + Crop */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setCropOpen(true)}
            className="relative w-20 h-20 rounded-full shrink-0 overflow-hidden border-2 group cursor-pointer"
            style={{ borderColor: accentHex }}
            aria-label="Upload and crop profile photo"
          >
            <img
              src={avatar}
              alt="Profile preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </button>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setCropOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-black inline-flex items-center gap-2 self-start active:scale-[0.97] transition-transform cursor-pointer"
              style={{ backgroundColor: accentHex }}
            >
              <Camera className="w-4 h-4" />
              Upload & Crop Photo
            </button>
            <p className="text-xs text-zinc-400">
              Circle or square crop, zoom & rotate from Gallery.
            </p>
          </div>
        </div>

        {/* Step 2: Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="zorb-setup-name" className="text-xs font-semibold text-zinc-300">
            Your Name
          </label>
          <input
            id="zorb-setup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Isagi Yoichi"
            maxLength={32}
            className="h-12 px-4 rounded-xl bg-black border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/50"
          />
        </div>

        {/* Step 3: Bio */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="zorb-setup-bio" className="text-xs font-semibold text-zinc-300">
            Bio
          </label>
          <input
            id="zorb-setup-bio"
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="About You..."
            maxLength={90}
            className="h-12 px-4 rounded-xl bg-black border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/50"
          />
        </div>

        {/* Step 4: Music Preferences */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">
              Tumhe Kaisa Music Pasand Hai?
            </span>
            <span className="text-[11px] font-mono-tabular text-zinc-400">
              {preferences.length} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_MUSIC_PREFERENCES.map((pref) => {
              const active = preferences.includes(pref);
              return (
                <button
                  key={pref}
                  type="button"
                  onClick={() => togglePref(pref)}
                  className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold border transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'text-black border-transparent'
                      : 'bg-black/70 text-zinc-300 border-white/15 hover:border-white/30'
                  }`}
                  style={active ? { backgroundColor: accentHex } : undefined}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  {pref}
                </button>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3.5 py-2.5">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          className="w-full h-13 rounded-2xl text-sm font-bold text-black flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer"
          style={{
            backgroundColor: accentHex,
            boxShadow: `0 0 24px rgba(var(--zorb-accent-rgb), 0.35)`,
          }}
        >
          <Sparkles className="w-4 h-4" />
          Finish & Enter Flow
        </button>
      </motion.form>

      <AvatarCropperModal
        isOpen={cropOpen}
        initialImage={avatar}
        accentHex={accentHex}
        onClose={() => setCropOpen(false)}
        onSave={(cropped) => {
          setAvatar(cropped);
          setCropOpen(false);
        }}
      />
    </div>
  );
};
