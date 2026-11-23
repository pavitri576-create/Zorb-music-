import React, { useMemo, useRef, useState } from 'react';
import { Check, Heart, Plus, Search, Upload, X } from 'lucide-react';
import { COVER_ART } from '../data/songs';
import { Playlist, Song } from '../types/zorb';

const DEFAULT_COVERS = [
  COVER_ART.neonBlade,
  COVER_ART.drift,
  COVER_ART.brazilian,
  COVER_ART.obsidian,
  COVER_ART.gym,
];

interface AddToPlaylistModalProps {
  isOpen: boolean;
  song: Song | null;
  playlists: Playlist[];
  accentHex: string;
  onClose: () => void;
  onToggleSongInPlaylist: (playlistId: string, songId: string) => void;
  onOpenCreateNew: (initialSongId?: string) => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  song,
  playlists,
  accentHex,
  onClose,
  onToggleSongInPlaylist,
  onOpenCreateNew,
}) => {
  if (!isOpen || !song) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#0B0D12] border border-white/15 p-5 flex flex-col gap-4 max-h-[82vh]">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-display text-2xl font-bold uppercase tracking-wide">
              Add To Playlist
            </h3>
            <p className="text-xs text-zinc-400 truncate">
              {song.title} · {song.artist}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenCreateNew(song.id);
          }}
          className="w-full h-12 rounded-xl font-semibold text-sm text-black flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer"
          style={{ backgroundColor: accentHex }}
        >
          <Plus className="w-4 h-4" />
          Create New Playlist
        </button>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
          {playlists.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              No playlists yet. Create your first playlist above.
            </div>
          ) : (
            playlists.map((pl) => {
              const hasSong = pl.songIds.includes(song.id);
              return (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => onToggleSongInPlaylist(pl.id, song.id)}
                  className="w-full p-2.5 rounded-xl bg-black/60 hover:bg-white/5 border border-white/10 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={pl.cover}
                      alt={pl.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-lg object-cover shrink-0"
                    />
                    <div className="text-left min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{pl.name}</p>
                      <p className="text-xs text-zinc-400 font-mono-tabular">
                        {pl.songIds.length} {pl.songIds.length === 1 ? 'track' : 'tracks'}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
                      hasSong ? 'text-black border-transparent' : 'border-white/20 text-zinc-400'
                    }`}
                    style={hasSong ? { backgroundColor: accentHex } : undefined}
                  >
                    {hasSong ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

interface CreatePlaylistModalProps {
  isOpen: boolean;
  allSongs: Song[];
  likedSongIds: string[];
  initialSongId?: string;
  accentHex: string;
  onClose: () => void;
  onCreatePlaylist: (name: string, cover: string, songIds: string[]) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  allSongs,
  likedSongIds,
  initialSongId,
  accentHex,
  onClose,
  onCreatePlaylist,
}) => {
  const [step, setStep] = useState<'details' | 'songs'>('details');
  const [name, setName] = useState('');
  const [cover, setCover] = useState(DEFAULT_COVERS[0]);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>(
    initialSongId ? [initialSongId] : []
  );
  const [sourceTab, setSourceTab] = useState<'search' | 'liked'>('search');
  const [query, setQuery] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setStep('details');
      setName('');
      setCover(DEFAULT_COVERS[0]);
      setSelectedSongIds(initialSongId ? [initialSongId] : []);
      setQuery('');
    }
  }, [isOpen, initialSongId]);

  const filteredSongs = useMemo(() => {
    const base =
      sourceTab === 'liked'
        ? allSongs.filter((s) => likedSongIds.includes(s.id))
        : allSongs;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q)
    );
  }, [allSongs, likedSongIds, sourceTab, query]);

  if (!isOpen) return null;

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const toggleSong = (id: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    const cleanName = name.trim() || 'My ZORB Mix';
    onCreatePlaylist(cleanName, cover, selectedSongIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#0B0D12] border border-white/15 p-5 flex flex-col gap-4 max-h-[88vh]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold uppercase tracking-wide">
              {step === 'details' ? 'Create Playlist' : 'Add Songs'}
            </h3>
            <p className="text-xs text-zinc-400">
              {step === 'details'
                ? 'Name your playlist & choose cover art'
                : 'Add via Search or from Liked Songs'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'details' ? (
          <>
            <div className="flex items-center gap-4">
              <img
                src={cover}
                alt="Playlist cover"
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl object-cover border border-white/15 shrink-0"
              />
              <div className="flex flex-col gap-2 flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white inline-flex items-center gap-2 self-start cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Gallery Cover
                </button>
                <div className="flex items-center gap-1.5">
                  {DEFAULT_COVERS.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCover(c)}
                      className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-transform cursor-pointer ${
                        cover === c ? 'scale-105' : 'border-transparent opacity-65 hover:opacity-100'
                      }`}
                      style={cover === c ? { borderColor: accentHex } : undefined}
                    >
                      <img src={c} alt={`Cover ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="playlist-name-input" className="text-xs font-semibold text-zinc-300">
                Playlist Name
              </label>
              <input
                id="playlist-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Midnight Drift Flow"
                maxLength={40}
                className="h-12 px-4 rounded-xl bg-black border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/45"
              />
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setStep('songs')}
                className="flex-1 h-12 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold text-white cursor-pointer"
              >
                Add Songs ({selectedSongIds.length})
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="flex-1 h-12 rounded-xl text-sm font-bold text-black active:scale-[0.98] transition-transform cursor-pointer"
                style={{ backgroundColor: accentHex }}
              >
                Create
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black border border-white/10">
              <button
                type="button"
                onClick={() => setSourceTab('search')}
                className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  sourceTab === 'search' ? 'text-black' : 'text-zinc-400 hover:text-white'
                }`}
                style={sourceTab === 'search' ? { backgroundColor: accentHex } : undefined}
              >
                <Search className="w-3.5 h-3.5" /> Via Search
              </button>
              <button
                type="button"
                onClick={() => setSourceTab('liked')}
                className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  sourceTab === 'liked' ? 'text-black' : 'text-zinc-400 hover:text-white'
                }`}
                style={sourceTab === 'liked' ? { backgroundColor: accentHex } : undefined}
              >
                <Heart className="w-3.5 h-3.5" /> Liked Songs ({likedSongIds.length})
              </button>
            </div>

            {sourceTab === 'search' && (
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search songs or artists..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-black border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 max-h-64">
              {filteredSongs.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  {sourceTab === 'liked'
                    ? 'No liked songs yet. Switch to Via Search to pick tracks.'
                    : 'No matching tracks found.'}
                </div>
              ) : (
                filteredSongs.map((s) => {
                  const selected = selectedSongIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSong(s.id)}
                      className="w-full p-2 rounded-xl bg-black/60 hover:bg-white/5 border border-white/10 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={s.cover}
                          alt={s.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="text-left min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{s.title}</p>
                          <p className="text-xs text-zinc-400 truncate">{s.artist}</p>
                        </div>
                      </div>
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                          selected ? 'text-black border-transparent' : 'border-white/20 text-zinc-400'
                        }`}
                        style={selected ? { backgroundColor: accentHex } : undefined}
                      >
                        {selected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="h-12 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold text-white cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="flex-1 h-12 rounded-xl text-sm font-bold text-black active:scale-[0.98] transition-transform cursor-pointer"
                style={{ backgroundColor: accentHex }}
              >
                Create Playlist ({selectedSongIds.length})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
