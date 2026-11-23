import React, { useMemo, useState } from 'react';
import { Clock, Download, Heart, ListPlus, MoreVertical, Pause, Play, Search, Trash2, X } from 'lucide-react';
import { formatTime } from '../data/songs';
import { MusicPreference, Playlist, Song } from '../types/zorb';
import { CoverArt, LiveEqualizerBars } from './CoverArt';

interface SearchScreenProps {
  songs: Song[];
  playlists: Playlist[];
  searchHistory: string[];
  likedSongIds: string[];
  offlineSongIds: string[];
  currentSong: Song | null;
  isPlaying: boolean;
  accentHex: string;
  onPlaySong: (song: Song) => void;
  onTogglePlay: () => void;
  onAddSearchHistory: (term: string) => void;
  onClearSearchHistory: () => void;
  onOpenAddToPlaylist: (song: Song) => void;
  onToggleLike: (songId: string) => void;
  onToggleOffline: (song: Song) => void;
  onOpenPlaylistFromSearch: (playlistId: string) => void;
}

type SearchGenreChip = 'All' | 'Phonk' | 'Chill' | 'Rap' | 'Lo-fi';

const GENRE_MATCH: Record<Exclude<SearchGenreChip, 'All'>, MusicPreference[]> = {
  Phonk: ['Phonk', 'Drift Phonk'],
  Chill: ['Chill Phonk', 'Night Drive'],
  Rap: ['Aggressive Phonk', 'Gym Phonk'],
  'Lo-fi': ['Study', 'Focus'],
};

export const SearchScreen: React.FC<SearchScreenProps> = ({
  songs,
  playlists,
  searchHistory,
  likedSongIds,
  offlineSongIds,
  currentSong,
  isPlaying,
  accentHex,
  onPlaySong,
  onTogglePlay,
  onAddSearchHistory,
  onClearSearchHistory,
  onOpenAddToPlaylist,
  onToggleLike,
  onToggleOffline,
  onOpenPlaylistFromSearch,
}) => {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<SearchGenreChip>('All');
  const [menuSongId, setMenuSongId] = useState<string | null>(null);

  const matchingSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs.filter((s) => {
      if (selectedGenre !== 'All') {
        const targets = GENRE_MATCH[selectedGenre];
        if (!s.tags.some((t) => targets.includes(t))) return false;
      }
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [songs, query, selectedGenre]);

  const matchingPlaylists = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return playlists;
    return playlists.filter((p) => p.name.toLowerCase().includes(q));
  }, [playlists, query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onAddSearchHistory(query.trim());
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
        Search
      </h1>

      {/* Top Rounded Spotify-style Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="w-4 h-4 text-[#B3B3B3] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to listen to?"
          className="w-full h-12 pl-11 pr-11 rounded-full bg-[#121212] border border-white/10 text-sm text-white placeholder:text-[#B3B3B3] focus:outline-none focus:border-white/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-[#B3B3B3] absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Genre Chips: All, Phonk, Chill, Rap, Lo-fi */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {(['All', 'Phonk', 'Chill', 'Rap', 'Lo-fi'] as const).map((chip) => {
          const active = selectedGenre === chip;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => setSelectedGenre(chip)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-[0.97] cursor-pointer ${
                active ? 'text-black' : 'bg-[#121212] text-white hover:bg-[#181818]'
              }`}
              style={active ? { backgroundColor: accentHex } : undefined}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Search History (Last 5) */}
      {searchHistory.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#B3B3B3] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Recent Searches
            </span>
            <button
              type="button"
              onClick={onClearSearchHistory}
              className="text-xs text-[#B3B3B3] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(0, 5).map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="px-3.5 py-1.5 rounded-full bg-[#121212] hover:bg-[#181818] text-xs text-zinc-200 active:scale-[0.97] transition-transform cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Matching Playlists */}
      {matchingPlaylists.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-sm font-bold text-white">Playlists</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {matchingPlaylists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={() => onOpenPlaylistFromSearch(pl.id)}
                className="p-2.5 rounded-xl bg-[#121212] hover:bg-[#181818] flex items-center gap-3 text-left active:scale-[0.97] transition-all cursor-pointer"
              >
                <CoverArt src={pl.cover} alt={pl.name} className="w-12 h-12 rounded-lg shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{pl.name}</p>
                  <p className="text-xs text-[#B3B3B3] font-mono-tabular">
                    {pl.songIds.length} tracks
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Live Song Results (Spotify List Style) */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-white">
          Songs ({matchingSongs.length})
        </h2>

        {matchingSongs.length === 0 ? (
          <div className="rounded-2xl bg-[#121212] p-8 text-center text-sm text-[#B3B3B3]">
            No matching songs found for "{query}".
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {matchingSongs.map((song) => {
              const active = currentSong?.id === song.id;
              const liked = likedSongIds.includes(song.id);
              const offline = offlineSongIds.includes(song.id);
              const menuOpen = menuSongId === song.id;

              return (
                <div
                  key={song.id}
                  className="relative rounded-xl bg-[#121212] hover:bg-[#181818] px-3 py-2 flex items-center justify-between gap-3 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (query.trim()) onAddSearchHistory(query.trim());
                      if (active) {
                        onTogglePlay();
                      } else {
                        onPlaySong(song);
                      }
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <CoverArt src={song.cover} alt={song.title} className="w-full h-full" />
                      {active && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          {isPlaying ? (
                            <Pause className="w-4 h-4 fill-current" style={{ color: accentHex }} />
                          ) : (
                            <Play className="w-4 h-4 fill-current" style={{ color: accentHex }} />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {active && <LiveEqualizerBars color={accentHex} isPlaying={isPlaying} />}
                        <p
                          className="text-sm font-bold truncate"
                          style={{ color: active ? accentHex : '#ffffff' }}
                        >
                          {song.title}
                        </p>
                      </div>
                      <p className="text-xs text-[#B3B3B3] truncate mt-0.5">
                        {song.artist} · {formatTime(song.duration)}
                      </p>
                    </div>
                  </button>

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setMenuSongId(menuOpen ? null : song.id)}
                      className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-[#B3B3B3] hover:text-white cursor-pointer"
                      aria-label={`More options for ${song.title}`}
                    >
                      <MoreVertical className="w-5 h-5" />
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
                          <ListPlus className="w-4 h-4" style={{ color: accentHex }} />
                          Add to Playlist
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
                          {liked ? 'Remove from Liked' : 'Save to Liked Songs'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuSongId(null);
                            onToggleOffline(song);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 text-left text-xs font-semibold text-white flex items-center gap-2.5 cursor-pointer"
                        >
                          <Download className="w-4 h-4" style={{ color: accentHex }} />
                          {offline ? 'Remove Offline Copy' : 'Download Offline'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
