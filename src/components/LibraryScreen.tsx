import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Clock,
  Download,
  Heart,
  ListPlus,
  MoreVertical,
  Music2,
  Play,
  Plus,
  Share2,
  Sliders,
  Trash2,
  Upload,
} from 'lucide-react';
import { formatTime } from '../data/songs';
import { HistoryEntry, LibraryTab, Playlist, Song } from '../types/zorb';
import { CustomSongWithFlag } from '../utils/customTracksDb';
import { CoverArt } from './CoverArt';

interface LibraryScreenProps {
  activeTab: LibraryTab;
  selectedPlaylistId: string | null;
  songs: Song[];
  likedSongIds: string[];
  offlineSongIds: string[];
  playlists: Playlist[];
  history: HistoryEntry[];
  currentSong: Song | null;
  accentHex: string;
  onChangeTab: (tab: LibraryTab) => void;
  onSelectPlaylist: (id: string | null) => void;
  onPlaySong: (song: Song) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onToggleLike: (songId: string) => void;
  onToggleOffline: (song: Song) => void;
  onOpenAddToPlaylist: (song: Song) => void;
  onOpenCreatePlaylist: () => void;
  onOpenImportSong: () => void;
  onOpenBeatMaker: () => void;
  onDeleteCustomSong: (songId: string) => void;
  onRemoveSongFromPlaylist: (playlistId: string, songId: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onSharePlaylist: (playlist: Playlist) => void;
  onClearHistory: () => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  activeTab,
  selectedPlaylistId,
  songs,
  likedSongIds,
  offlineSongIds,
  playlists,
  history,
  currentSong,
  accentHex,
  onChangeTab,
  onSelectPlaylist,
  onPlaySong,
  onPlayPlaylist,
  onToggleLike,
  onToggleOffline,
  onOpenAddToPlaylist,
  onOpenCreatePlaylist,
  onOpenImportSong,
  onOpenBeatMaker,
  onDeleteCustomSong,
  onRemoveSongFromPlaylist,
  onDeletePlaylist,
  onSharePlaylist,
  onClearHistory,
}) => {
  const [menuSongId, setMenuSongId] = useState<string | null>(null);
  const likedSongs = songs.filter((s) => likedSongIds.includes(s.id));
  const customImportedSongs = songs.filter(
    (s) => s.id.startsWith('custom-') && (s as CustomSongWithFlag).sourceType !== 'beat'
  );
  const myBeats = songs.filter(
    (s): s is CustomSongWithFlag =>
      s.id.startsWith('beat-') || (s as CustomSongWithFlag).sourceType === 'beat'
  );
  const downloadedSongs = songs.filter(
    (s) => offlineSongIds.includes(s.id) || s.id.startsWith('custom-')
  );

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null;

  // Playlist Detail View
  if (activeTab === 'playlists' && selectedPlaylist) {
    const playlistSongs = selectedPlaylist.songIds
      .map((id) => songs.find((s) => s.id === id))
      .filter((s): s is Song => Boolean(s));

    return (
      <div className="flex flex-col gap-5 pb-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onSelectPlaylist(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#B3B3B3] hover:text-white min-h-[44px] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Playlists
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSharePlaylist(selectedPlaylist)}
              className="w-10 h-10 rounded-full bg-[#121212] hover:bg-[#181818] flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
              aria-label="Share playlist"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onDeletePlaylist(selectedPlaylist.id);
                onSelectPlaylist(null);
              }}
              className="w-10 h-10 rounded-full bg-[#121212] hover:bg-rose-500/10 flex items-center justify-center text-rose-400 cursor-pointer"
              aria-label="Delete playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-[#121212] p-5 flex flex-col sm:flex-row items-center gap-5">
          <CoverArt
            src={selectedPlaylist.cover}
            alt={selectedPlaylist.name}
            className="w-32 h-32 rounded-2xl shrink-0"
          />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: accentHex }}>
              Playlist
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              {selectedPlaylist.name}
            </h1>
            <p className="text-xs text-[#B3B3B3] font-mono-tabular mt-1">
              {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}
            </p>
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2.5">
              <button
                type="button"
                disabled={playlistSongs.length === 0}
                onClick={() => onPlayPlaylist(selectedPlaylist)}
                className="h-11 px-6 rounded-full font-bold text-sm text-black flex items-center gap-2 disabled:opacity-40 active:scale-[0.97] transition-transform cursor-pointer"
                style={{ backgroundColor: accentHex }}
              >
                <Play className="w-4 h-4 fill-current" /> Play
              </button>
            </div>
          </div>
        </div>

        {playlistSongs.length === 0 ? (
          <div className="rounded-2xl bg-[#121212] p-8 text-center text-sm text-[#B3B3B3]">
            This playlist has no songs yet. Use Search or Songs to add tracks.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {playlistSongs.map((song, idx) => {
              const active = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  className="rounded-xl bg-[#121212] hover:bg-[#181818] px-3 py-2 flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => onPlaySong(song)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <span className="w-5 text-xs font-mono-tabular text-[#B3B3B3]">
                      {idx + 1}
                    </span>
                    <CoverArt src={song.cover} alt={song.title} className="w-11 h-11 rounded-lg shrink-0" />
                    <div className="min-w-0">
                      <p
                        className="text-sm font-bold truncate"
                        style={{ color: active ? accentHex : '#ffffff' }}
                      >
                        {song.title}
                      </p>
                      <p className="text-xs text-[#B3B3B3] truncate">
                        {song.artist} · {formatTime(song.duration)}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveSongFromPlaylist(selectedPlaylist.id, song.id)}
                    className="w-10 h-10 rounded-full hover:bg-rose-500/10 flex items-center justify-center text-[#B3B3B3] hover:text-rose-400 cursor-pointer"
                    aria-label={`Remove ${song.title} from playlist`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const filterChips: { id: LibraryTab; label: string }[] = [
    { id: 'playlists', label: 'Playlists' },
    { id: 'liked', label: 'Songs' },
    { id: 'beats', label: 'Beats' },
    { id: 'downloaded', label: 'Downloaded' },
    { id: 'history', label: 'Recent (5)' },
  ];

  const renderSpotifySongRow = (song: Song, keyPrefix: string, options?: { isCustom?: boolean; isBeat?: boolean }) => {
    const active = currentSong?.id === song.id;
    const liked = likedSongIds.includes(song.id);
    const offline = offlineSongIds.includes(song.id);
    const menuKey = `${keyPrefix}-${song.id}`;
    const menuOpen = menuSongId === menuKey;

    return (
      <div
        key={menuKey}
        className="relative rounded-xl bg-[#121212] hover:bg-[#181818] px-3 py-2 flex items-center justify-between gap-3 transition-colors"
      >
        <button
          type="button"
          onClick={() => onPlaySong(song)}
          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
        >
          <CoverArt src={song.cover} alt={song.title} className="w-12 h-12 rounded-lg shrink-0" />
          <div className="min-w-0">
            <p
              className="text-sm font-bold truncate"
              style={{ color: active ? accentHex : '#ffffff' }}
            >
              {song.title}
            </p>
            <p className="text-xs text-[#B3B3B3] truncate mt-0.5">
              {song.artist} · {formatTime(song.duration)}
            </p>
          </div>
        </button>

        <div className="relative flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setMenuSongId(menuOpen ? null : menuKey)}
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-[#B3B3B3] hover:text-white cursor-pointer"
            aria-label={`More options for ${song.title}`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-30 w-52 rounded-2xl bg-[#181818] border border-white/15 p-1.5 shadow-2xl flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setMenuSongId(null);
                  onOpenAddToPlaylist(song);
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 text-left text-xs font-semibold text-white flex items-center gap-2.5 cursor-pointer"
              >
                <ListPlus className="w-4 h-4" style={{ color: accentHex }} /> Add to Playlist
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuSongId(null);
                  onToggleLike(song.id);
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 text-left text-xs font-semibold text-white flex items-center gap-2.5 cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} style={{ color: accentHex }} />
                {liked ? 'Remove from Liked' : 'Save to Liked'}
              </button>
              {!options?.isBeat && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuSongId(null);
                    onToggleOffline(song);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 text-left text-xs font-semibold text-white flex items-center gap-2.5 cursor-pointer"
                >
                  {offline ? (
                    <Check className="w-4 h-4" style={{ color: accentHex }} />
                  ) : (
                    <Download className="w-4 h-4" style={{ color: accentHex }} />
                  )}
                  {offline ? 'Offline Ready' : 'Download Offline'}
                </button>
              )}
              {options?.isBeat && (
                <a
                  href={song.audioUrl}
                  download={`${song.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.wav`}
                  onClick={() => setMenuSongId(null)}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 text-left text-xs font-semibold text-white flex items-center gap-2.5"
                >
                  <Download className="w-4 h-4" style={{ color: accentHex }} /> Export WAV
                </a>
              )}
              {(options?.isCustom || options?.isBeat) && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuSongId(null);
                    onDeleteCustomSong(song.id);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-left text-xs font-semibold text-rose-400 flex items-center gap-2.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Top Bar: "Your Library" + Quick Tool Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Your Library
        </h1>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenBeatMaker}
            className="h-10 px-3.5 rounded-full bg-[#121212] hover:bg-[#181818] border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 active:scale-[0.97] transition-transform cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" style={{ color: accentHex }} /> Beat Maker
          </button>
          <button
            type="button"
            onClick={onOpenImportSong}
            className="h-10 px-3.5 rounded-full bg-[#121212] hover:bg-[#181818] border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 active:scale-[0.97] transition-transform cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" style={{ color: accentHex }} /> Import
          </button>
          <button
            type="button"
            onClick={onOpenCreatePlaylist}
            className="h-10 px-4 rounded-full text-xs font-bold text-black flex items-center gap-1.5 active:scale-[0.97] transition-transform cursor-pointer"
            style={{ backgroundColor: accentHex }}
          >
            <Plus className="w-4 h-4" /> Playlist
          </button>
        </div>
      </div>

      {/* Filter Chips: Playlists, Songs, Beats, Downloaded, Recent (5) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {filterChips.map((chip) => {
          const active = activeTab === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                onSelectPlaylist(null);
                onChangeTab(chip.id);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-[0.97] cursor-pointer ${
                active ? 'text-black' : 'bg-[#121212] text-white hover:bg-[#181818]'
              }`}
              style={active ? { backgroundColor: accentHex } : undefined}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Playlists */}
      {activeTab === 'playlists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {playlists.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl bg-[#121212] p-8 text-center">
              <p className="text-sm font-bold text-white">No Playlists Created</p>
              <p className="text-xs text-[#B3B3B3] mt-1 mb-4">
                Build custom Phonk playlists with your own cover art and track order.
              </p>
              <button
                type="button"
                onClick={onOpenCreatePlaylist}
                className="h-11 px-5 rounded-full text-xs font-bold text-black inline-flex items-center gap-2 active:scale-[0.97] transition-transform cursor-pointer"
                style={{ backgroundColor: accentHex }}
              >
                <Plus className="w-4 h-4" /> Create First Playlist
              </button>
            </div>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={() => onSelectPlaylist(pl.id)}
                className="rounded-xl bg-[#121212] hover:bg-[#181818] p-3 flex items-center gap-3.5 text-left active:scale-[0.97] transition-all cursor-pointer"
              >
                <CoverArt src={pl.cover} alt={pl.name} className="w-16 h-16 rounded-lg shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{pl.name}</p>
                  <p className="text-xs text-[#B3B3B3] font-mono-tabular mt-0.5">
                    Playlist · {pl.songIds.length} {pl.songIds.length === 1 ? 'song' : 'songs'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Tab: Songs (Liked + Imported) */}
      {activeTab === 'liked' && (
        <div className="flex flex-col gap-3">
          {customImportedSongs.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-[#B3B3B3]">
                Imported From Device ({customImportedSongs.length})
              </p>
              {customImportedSongs.map((song) =>
                renderSpotifySongRow(song, 'imp', { isCustom: true })
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-[#B3B3B3]">
              Liked Songs ({likedSongs.length})
            </p>
            {likedSongs.length === 0 ? (
              <div className="rounded-2xl bg-[#121212] p-8 text-center">
                <Heart className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                <p className="text-sm font-bold text-white">No Liked Songs Yet</p>
                <p className="text-xs text-[#B3B3B3] mt-1">
                  Tap the heart on any track to save it here.
                </p>
              </div>
            ) : (
              likedSongs.map((song) => renderSpotifySongRow(song, 'liked'))
            )}
          </div>
        </div>
      )}

      {/* Tab: Beats (Beat Maker Tool + My Beats) */}
      {activeTab === 'beats' && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onOpenBeatMaker}
            className="rounded-2xl bg-[#121212] hover:bg-[#181818] border border-white/10 p-4 flex items-center justify-between gap-3 text-left active:scale-[0.97] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-black shrink-0"
                style={{ backgroundColor: accentHex }}
              >
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Open Beat Maker</p>
                <p className="text-xs text-[#B3B3B3]">
                  Tap easy pads, auto-generate loops, and export WAV offline
                </p>
              </div>
            </div>
            <span className="text-xs font-bold" style={{ color: accentHex }}>
              Create
            </span>
          </button>

          {myBeats.length === 0 ? (
            <div className="rounded-2xl bg-[#121212] p-8 text-center">
              <Music2 className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-bold text-white">No Beats Saved Yet</p>
              <p className="text-xs text-[#B3B3B3] mt-1">
                Create your first beat using Beat Maker above.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {myBeats.map((beat) => renderSpotifySongRow(beat, 'beat', { isBeat: true }))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Downloaded */}
      {activeTab === 'downloaded' && (
        <div className="flex flex-col gap-2">
          {downloadedSongs.length === 0 ? (
            <div className="rounded-2xl bg-[#121212] p-8 text-center">
              <Download className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-bold text-white">No Downloaded Tracks</p>
              <p className="text-xs text-[#B3B3B3] mt-1">
                Import MP3s from your device or mark tracks Offline from the 3-dot menu.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {downloadedSongs.map((song) =>
                renderSpotifySongRow(song, 'dl', { isCustom: song.id.startsWith('custom-') })
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: History (Recently Played — Last 5 Only) */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">Recently Played</h2>
              <p className="text-xs text-[#B3B3B3] font-mono-tabular">
                Last 5 songs stored offline ({Math.min(5, history.length)}/5)
              </p>
            </div>

            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="h-9 px-3.5 rounded-full bg-[#121212] hover:bg-[#181818] text-xs font-semibold text-[#B3B3B3] hover:text-rose-400 flex items-center gap-1.5 active:scale-[0.97] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="rounded-2xl bg-[#121212] p-8 text-center">
              <Clock className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-bold text-white">No Recently Played Songs</p>
              <p className="text-xs text-[#B3B3B3] mt-1">
                Play any track to view your last 5 songs here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {history.slice(0, 5).map((entry) => {
                const song = songs.find((s) => s.id === entry.songId);
                if (!song) return null;
                return renderSpotifySongRow(song, 'hist');
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
