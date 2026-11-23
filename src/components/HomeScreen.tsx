import React from 'react';
import { Flame, Heart, ListPlus, Music2, Pause, Play, Plus, Sliders, Upload } from 'lucide-react';
import { formatTime } from '../data/songs';
import { REWARD_MILESTONES } from '../data/rewards';
import { getLocalDateKey, getTimeGreeting, STREAK_DAILY_THRESHOLD_SECONDS } from '../utils/storage';
import { HistoryEntry, Playlist, Song, StreakState, UserProfile } from '../types/zorb';
import { CustomSongWithFlag } from '../utils/customTracksDb';
import { CoverArt, LiveEqualizerBars } from './CoverArt';

interface HomeScreenProps {
  profile: UserProfile;
  accentHex: string;
  songs: Song[];
  playlists: Playlist[];
  history: HistoryEntry[];
  currentSong: Song | null;
  isPlaying: boolean;
  likedSongIds: string[];
  dopamineScore: number;
  streak: StreakState;
  songsPlayedSinceAd: number;
  onPlaySong: (song: Song, queue?: Song[]) => void;
  onTogglePlay: () => void;
  onToggleLike: (songId: string) => void;
  onOpenAddToPlaylist: (song: Song) => void;
  onOpenPlaylist: (playlistId: string) => void;
  onOpenRewards: () => void;
  onOpenBeatMaker: () => void;
  onOpenProfile: () => void;
  onOpenImportSong: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  accentHex,
  songs,
  playlists,
  history,
  currentSong,
  isPlaying,
  likedSongIds,
  dopamineScore,
  streak,
  songsPlayedSinceAd,
  onPlaySong,
  onTogglePlay,
  onToggleLike,
  onOpenAddToPlaylist,
  onOpenPlaylist,
  onOpenRewards,
  onOpenBeatMaker,
  onOpenProfile,
  onOpenImportSong,
}) => {
  const greeting = getTimeGreeting();
  const todayKey = getLocalDateKey();
  const todaySeconds = streak.dailyListenSeconds[todayKey] || 0;
  const streakPct = Math.min(100, (todaySeconds / STREAK_DAILY_THRESHOLD_SECONDS) * 100);

  const nextMilestone =
    REWARD_MILESTONES.find((m) => m.day > streak.currentStreak) ||
    REWARD_MILESTONES[REWARD_MILESTONES.length - 1];
  const daysLeft = Math.max(0, nextMilestone.day - streak.currentStreak);

  // Recently Played (Last 5 songs)
  const recentlyPlayedSongs = React.useMemo(() => {
    return history
      .slice(0, 5)
      .map((entry) => songs.find((s) => s.id === entry.songId))
      .filter((s): s is Song => Boolean(s));
  }, [history, songs]);

  // User's Beats created in Beat Maker
  const myBeats = React.useMemo(
    () =>
      songs.filter(
        (s) => s.id.startsWith('beat-') || (s as CustomSongWithFlag).sourceType === 'beat'
      ),
    [songs]
  );

  // Curated "Made For You" auto mixes alongside user playlists
  const madeForYouMixes = React.useMemo(() => {
    const mixes: { id: string; title: string; subtitle: string; cover: string; tracks: Song[]; playlistId?: string }[] = [];

    playlists.forEach((pl) => {
      const plTracks = pl.songIds
        .map((id) => songs.find((s) => s.id === id))
        .filter((s): s is Song => Boolean(s));
      mixes.push({
        id: pl.id,
        playlistId: pl.id,
        title: pl.name,
        subtitle: `${plTracks.length} Tracks`,
        cover: pl.cover,
        tracks: plTracks.length > 0 ? plTracks : songs.slice(0, 4),
      });
    });

    const prefs = new Set(profile.preferences);
    const dailyFlow = [...songs].sort(
      (a, b) =>
        b.tags.filter((t) => prefs.has(t)).length - a.tags.filter((t) => prefs.has(t)).length
    );
    if (dailyFlow[0]) {
      mixes.push({
        id: 'mix-daily',
        title: 'Your Flow Mix',
        subtitle: profile.preferences.slice(0, 2).join(' · ') || 'Phonk & Chill',
        cover: dailyFlow[0].cover,
        tracks: dailyFlow.slice(0, 5),
      });
    }

    const nightTracks = songs.filter(
      (s) => s.tags.includes('Chill Phonk') || s.tags.includes('Night Drive')
    );
    if (nightTracks.length > 0) {
      mixes.push({
        id: 'mix-night',
        title: 'Late Night Drive',
        subtitle: `${nightTracks.length} Tracks · Chill`,
        cover: nightTracks[0].cover,
        tracks: nightTracks,
      });
    }

    const hardTracks = songs.filter(
      (s) => s.tags.includes('Aggressive Phonk') || s.tags.includes('Gym Phonk')
    );
    if (hardTracks.length > 0) {
      mixes.push({
        id: 'mix-overdrive',
        title: 'Red Overdrive Mix',
        subtitle: `${hardTracks.length} Tracks · Heavy`,
        cover: hardTracks[0].cover,
        tracks: hardTracks,
      });
    }

    return mixes;
  }, [playlists, songs, profile.preferences]);

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Top Spotify-Style Header: Greeting + Profile Icon */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
            {greeting}
          </h1>
          <p className="text-xs text-[#B3B3B3] mt-0.5 font-mono-tabular">
            {profile.name} · Songs until Ad: {Math.min(6, songsPlayedSinceAd)}/6
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenProfile}
          className="w-11 h-11 rounded-full overflow-hidden border-2 shrink-0 active:scale-[0.97] transition-transform cursor-pointer"
          style={{ borderColor: accentHex }}
          aria-label="Open profile"
        >
          <CoverArt src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full" />
        </button>
      </div>

      {/* Quick Action Cards: Make Your Beat + Streak & Rewards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
        <button
          type="button"
          onClick={onOpenBeatMaker}
          className="rounded-2xl bg-[#121212] hover:bg-[#181818] border border-white/10 p-4 flex items-center justify-between gap-4 text-left active:scale-[0.97] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-black shrink-0"
              style={{ backgroundColor: accentHex }}
            >
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">Make Your Beat</p>
              <p className="text-xs text-[#B3B3B3] truncate">
                Solo Beat Maker · Tap pads &amp; build your flow
              </p>
            </div>
          </div>
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full text-black shrink-0"
            style={{ backgroundColor: accentHex }}
          >
            Open
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenRewards}
          className="rounded-2xl bg-[#121212] hover:bg-[#181818] border border-white/10 p-4 flex items-center justify-between gap-4 text-left active:scale-[0.97] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" style={{ color: accentHex }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {streak.currentStreak} Days Streak · {dopamineScore.toLocaleString()} DP
              </p>
              <p className="text-xs text-[#B3B3B3] truncate font-mono-tabular">
                {Math.round(streakPct)}% today · {daysLeft} days to {nextMilestone.badgeName}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-zinc-300 shrink-0">Rewards</span>
        </button>
      </div>

      {/* Recently Played (Last 5) — Horizontal Spotify Cards */}
      {recentlyPlayedSongs.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Recently Played
            </h2>
            <span className="text-xs text-[#B3B3B3] font-mono-tabular">
              Last {recentlyPlayedSongs.length}/5
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
            {recentlyPlayedSongs.map((song) => {
              const active = currentSong?.id === song.id;
              return (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => (active ? onTogglePlay() : onPlaySong(song, recentlyPlayedSongs))}
                  className="w-36 sm:w-40 shrink-0 snap-start rounded-2xl bg-[#121212] hover:bg-[#181818] p-3 flex flex-col gap-2.5 text-left active:scale-[0.97] transition-all cursor-pointer"
                >
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                    <CoverArt src={song.cover} alt={song.title} className="w-full h-full" />
                    <span
                      className="absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center text-black shadow-lg"
                      style={{ backgroundColor: accentHex }}
                    >
                      {active && isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                      )}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-bold truncate"
                      style={{ color: active ? accentHex : '#ffffff' }}
                    >
                      {song.title}
                    </p>
                    <p className="text-xs text-[#B3B3B3] truncate mt-0.5">{song.artist}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Made For You — Playlists */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
          Made For You
        </h2>

        <div className="flex lg:grid lg:grid-cols-4 gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
          {madeForYouMixes.map((mix) => (
            <button
              key={mix.id}
              type="button"
              onClick={() => {
                if (mix.playlistId) {
                  onOpenPlaylist(mix.playlistId);
                } else if (mix.tracks.length > 0) {
                  onPlaySong(mix.tracks[0], mix.tracks);
                }
              }}
              className="w-40 lg:w-auto shrink-0 snap-start rounded-2xl bg-[#121212] hover:bg-[#181818] p-3 flex flex-col gap-2.5 text-left active:scale-[0.97] transition-all cursor-pointer"
            >
              <CoverArt src={mix.cover} alt={mix.title} className="w-full aspect-square rounded-xl" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{mix.title}</p>
                <p className="text-xs text-[#B3B3B3] truncate mt-0.5">{mix.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Your Beats — My Beats */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Your Beats
          </h2>
          <button
            type="button"
            onClick={onOpenBeatMaker}
            className="text-xs font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            style={{ color: accentHex }}
          >
            <Plus className="w-3.5 h-3.5" /> New Beat
          </button>
        </div>

        {myBeats.length === 0 ? (
          <button
            type="button"
            onClick={onOpenBeatMaker}
            className="rounded-2xl bg-[#121212] hover:bg-[#181818] border border-white/10 p-5 flex items-center gap-4 text-left active:scale-[0.97] transition-all cursor-pointer"
          >
            <div className="w-14 h-14 rounded-xl bg-black border border-white/10 flex items-center justify-center shrink-0">
              <Music2 className="w-6 h-6" style={{ color: accentHex }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Create Your First Beat</p>
              <p className="text-xs text-[#B3B3B3] mt-0.5">
                Tap easy Phonk drum &amp; cowbell pads in Beat Maker and save directly to your library.
              </p>
            </div>
          </button>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
            {myBeats.map((beat) => {
              const active = currentSong?.id === beat.id;
              return (
                <button
                  key={beat.id}
                  type="button"
                  onClick={() => (active ? onTogglePlay() : onPlaySong(beat, myBeats))}
                  className="w-36 sm:w-40 shrink-0 snap-start rounded-2xl bg-[#121212] hover:bg-[#181818] p-3 flex flex-col gap-2.5 text-left active:scale-[0.97] transition-all cursor-pointer"
                >
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                    <CoverArt src={beat.cover} alt={beat.title} className="w-full h-full" />
                    <span
                      className="absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center text-black shadow-lg"
                      style={{ backgroundColor: accentHex }}
                    >
                      {active && isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                      )}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-bold truncate"
                      style={{ color: active ? accentHex : '#ffffff' }}
                    >
                      {beat.title}
                    </p>
                    <p className="text-xs text-[#B3B3B3] truncate mt-0.5 font-mono-tabular">
                      {beat.bpm} BPM · {formatTime(beat.duration)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Songs List (Spotify-style rows + Import MP3) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            All Songs
          </h2>

          <button
            type="button"
            onClick={onOpenImportSong}
            className="h-9 px-3.5 rounded-full bg-[#121212] hover:bg-[#181818] border border-white/10 text-xs font-semibold text-white inline-flex items-center gap-1.5 active:scale-[0.97] transition-transform cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" style={{ color: accentHex }} />
            <span>Import Audio</span>
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {songs.map((song) => {
            const active = currentSong?.id === song.id;
            const liked = likedSongIds.includes(song.id);
            return (
              <div
                key={song.id}
                className="rounded-xl bg-[#121212] hover:bg-[#181818] px-3 py-2 flex items-center justify-between gap-3 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => (active ? onTogglePlay() : onPlaySong(song, songs))}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                >
                  <CoverArt src={song.cover} alt={song.title} className="w-12 h-12 rounded-lg shrink-0" />
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

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleLike(song.id)}
                    className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center active:scale-[0.97] transition-transform cursor-pointer"
                    style={{ color: liked ? accentHex : '#B3B3B3' }}
                    aria-label={liked ? 'Unlike track' : 'Like track'}
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-current animate-zorb-heart-pop' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAddToPlaylist(song)}
                    className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-[#B3B3B3] hover:text-white active:scale-[0.97] transition-transform cursor-pointer"
                    aria-label="Add to playlist"
                  >
                    <ListPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
