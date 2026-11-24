import { MusicPreference, Song } from '../types/zorb';

export const COVER_ART = {
  neonBlade: '/src/assets/images/phonk_cover_neon_blade_1795441176315.jpg',
  drift: '/src/assets/images/phonk_cover_drift_1795441176786.jpg',
  brazilian: '/src/assets/images/phonk_cover_brazilian_1795441176308.jpg',
  obsidian: '/src/assets/images/phonk_cover_obsidian_1795441176563.jpg',
  gym: '/src/assets/images/phonk_cover_gym_1795441176529.jpg',
};

export interface AddSongInput {
  id: string;
  title: string;
  artist: string;
  cover: string;
  fileName: string;
  duration: number;
  tags: MusicPreference[];
  bpm: number;
}

/**
 * Registers built-in Phonk tracks mapped to their audio files in /public/songs/
 */
export function addSong(input: AddSongInput): Song {
  return {
    id: input.id,
    title: input.title,
    artist: input.artist,
    cover: input.cover,
    audioUrl: `/songs/${input.fileName}`,
    duration: input.duration,
    genre: 'Phonk',
    tags: input.tags,
    bpm: input.bpm,
  };
}

export const INITIAL_SONGS: Song[] = [
  addSong({
    id: 'neon-blade',
    title: 'NEON BLADE',
    artist: 'MoonDeity',
    cover: COVER_ART.neonBlade,
    fileName: 'neon-blade.mp3',
    duration: 46,
    tags: ['Phonk', 'Drift Phonk', 'Gym Phonk'],
    bpm: 95,
  }),
  addSong({
    id: 'close-eyes',
    title: 'CLOSE EYES',
    artist: 'DVRST',
    cover: COVER_ART.obsidian,
    fileName: 'close-eyes.mp3',
    duration: 48,
    tags: ['Chill Phonk', 'Night Drive', 'Phonk'],
    bpm: 96,
  }),
  addSong({
    id: 'rave',
    title: 'RAVE',
    artist: 'Dxrk ダーク',
    cover: COVER_ART.gym,
    fileName: 'rave.mp3',
    duration: 46,
    tags: ['Aggressive Phonk', 'Gym Phonk', 'Phonk'],
    bpm: 120,
  }),
  addSong({
    id: 'metamorphosis',
    title: 'METAMORPHOSIS',
    artist: 'INTERWORLD',
    cover: COVER_ART.drift,
    fileName: 'metamorphosis.mp3',
    duration: 48,
    tags: ['Night Drive', 'Chill Phonk', 'Focus'],
    bpm: 88,
  }),
  addSong({
    id: 'murder-in-my-mind',
    title: 'MURDER IN MY MIND',
    artist: 'KORDHELL',
    cover: COVER_ART.neonBlade,
    fileName: 'murder-in-my-mind.mp3',
    duration: 46,
    tags: ['Aggressive Phonk', 'Drift Phonk', 'Phonk'],
    bpm: 120,
  }),
  addSong({
    id: 'sahara',
    title: 'SAHARA',
    artist: 'Hensonn',
    cover: COVER_ART.obsidian,
    fileName: 'sahara.mp3',
    duration: 46,
    tags: ['Drift Phonk', 'Study', 'Focus'],
    bpm: 115,
  }),
  addSong({
    id: 'lua-na-praca',
    title: 'LUA NA PRAÇA',
    artist: 'DJ Samir, DJ ZareK, DJ DUDA, LUNxdiE',
    cover: COVER_ART.brazilian,
    fileName: 'lua-na-praca.mp3',
    duration: 46,
    tags: ['Phonk', 'Gym Phonk', 'Aggressive Phonk'],
    bpm: 130,
  }),
  addSong({
    id: 'montagem-pegadora',
    title: 'MONTAGEM PEGADORA',
    artist: 'Rubikdice, Chilx, WAA',
    cover: COVER_ART.gym,
    fileName: 'montagem-pegadora.mp3',
    duration: 46,
    tags: ['Gym Phonk', 'Aggressive Phonk', 'Phonk'],
    bpm: 136,
  }),
  addSong({
    id: 'heavenly-jumpstyle',
    title: 'HEAVENLY JUMPSTYLE',
    artist: 'TWXNY, Sxilwix, INNXCENCE',
    cover: COVER_ART.drift,
    fileName: 'heavenly-jumpstyle.mp3',
    duration: 46,
    tags: ['Drift Phonk', 'Night Drive', 'Gym Phonk'],
    bpm: 154,
  }),
  addSong({
    id: 'luz-roja',
    title: 'LUZ ROJA',
    artist: 'bxkq',
    cover: COVER_ART.brazilian,
    fileName: 'luz-roja.mp3',
    duration: 48,
    tags: ['Night Drive', 'Chill Phonk', 'Study', 'Focus'],
    bpm: 106,
  }),
];

export const ALL_MUSIC_PREFERENCES: MusicPreference[] = [
  'Phonk',
  'Chill Phonk',
  'Aggressive Phonk',
  'Drift Phonk',
  'Gym Phonk',
  'Night Drive',
  'Study',
  'Focus',
];

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
