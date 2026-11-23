import React, { useRef, useState } from 'react';
import { Check, Music, Upload, X } from 'lucide-react';
import { ALL_MUSIC_PREFERENCES, COVER_ART, formatTime } from '../data/songs';
import { MusicPreference } from '../types/zorb';
import { detectAudioDuration, StoredCustomTrack } from '../utils/customTracksDb';

const DEFAULT_COVERS = [
  COVER_ART.neonBlade,
  COVER_ART.drift,
  COVER_ART.brazilian,
  COVER_ART.obsidian,
  COVER_ART.gym,
];

interface ImportSongModalProps {
  isOpen: boolean;
  accentHex: string;
  onClose: () => void;
  onImported: (track: StoredCustomTrack) => Promise<void>;
}

export const ImportSongModal: React.FC<ImportSongModalProps> = ({
  isOpen,
  accentHex,
  onClose,
  onImported,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [cover, setCover] = useState(DEFAULT_COVERS[0]);
  const [tags, setTags] = useState<MusicPreference[]>(['Phonk']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleAudioPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSelectedFile(file);

    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
    if (!title) setTitle(baseName.toUpperCase());
    if (!artist) setArtist('Local Import');

    const detected = await detectAudioDuration(file);
    setDuration(detected);
  };

  const handleCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCover(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleTag = (tag: MusicPreference) => {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.length > 1
          ? prev.filter((t) => t !== tag)
          : prev
        : [...prev, tag]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Select an MP3, WAV, M4A, or audio file from your device.');
      return;
    }
    if (!title.trim()) {
      setError('Enter a song name.');
      return;
    }

    setSaving(true);
    try {
      const track: StoredCustomTrack = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: title.trim().toUpperCase(),
        artist: artist.trim() || 'Local Import',
        cover,
        duration: duration || 60,
        tags,
        bpm: 130,
        audioBlob: selectedFile,
        createdAt: new Date().toISOString(),
      };
      await onImported(track);
      setSelectedFile(null);
      setTitle('');
      setArtist('');
      setDuration(0);
      onClose();
    } catch {
      setError('Could not save audio file to local storage.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={handleSave}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#0B0D12] border border-white/15 p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold uppercase tracking-wide">
              Import From Device
            </h3>
            <p className="text-xs text-zinc-400">
              Add MP3, WAV, or M4A directly from phone/PC storage
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 cursor-pointer"
            aria-label="Close import dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac"
          onChange={handleAudioPick}
          className="hidden"
        />
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverPick}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => audioInputRef.current?.click()}
          className="w-full p-4 rounded-2xl border border-dashed border-white/25 bg-black/70 hover:border-white/45 flex items-center gap-3.5 text-left transition-colors cursor-pointer"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(var(--zorb-accent-rgb), 0.16)', color: accentHex }}
          >
            {selectedFile ? <Music className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {selectedFile ? selectedFile.name : 'Select Audio File From Storage'}
            </p>
            <p className="text-xs text-zinc-400 font-mono-tabular mt-0.5">
              {selectedFile
                ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · ${formatTime(duration)}`
                : 'MP3, M4A, WAV, OGG supported'}
            </p>
          </div>
        </button>

        {/* Cover Picker */}
        <div className="flex items-center gap-3.5">
          <img
            src={cover}
            alt="Track cover"
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-xl object-cover border border-white/15 shrink-0"
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white self-start cursor-pointer"
            >
              Gallery Cover
            </button>
            <div className="flex items-center gap-1.5">
              {DEFAULT_COVERS.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCover(c)}
                  className={`w-7 h-7 rounded-lg overflow-hidden border-2 cursor-pointer ${
                    cover === c ? 'scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  style={cover === c ? { borderColor: accentHex } : undefined}
                >
                  <img src={c} alt={`Default cover ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="import-title" className="text-xs font-semibold text-zinc-300">
              Song Name
            </label>
            <input
              id="import-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Track title"
              maxLength={48}
              className="h-11 px-3.5 rounded-xl bg-black border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="import-artist" className="text-xs font-semibold text-zinc-300">
              Artist
            </label>
            <input
              id="import-artist"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
              maxLength={48}
              className="h-11 px-3.5 rounded-xl bg-black border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-zinc-300">Vibe Tags</span>
          <div className="flex flex-wrap gap-1.5">
            {ALL_MUSIC_PREFERENCES.map((tag) => {
              const active = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 cursor-pointer ${
                    active ? 'text-black border-transparent' : 'bg-black text-zinc-400 border-white/10'
                  }`}
                  style={active ? { backgroundColor: accentHex } : undefined}
                >
                  {active && <Check className="w-3 h-3" />}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 rounded-xl font-bold text-sm text-black disabled:opacity-50 active:scale-[0.98] transition-transform cursor-pointer"
          style={{ backgroundColor: accentHex }}
        >
          {saving ? 'Saving to ZORB...' : 'Import & Add to Library'}
        </button>
      </form>
    </div>
  );
};
