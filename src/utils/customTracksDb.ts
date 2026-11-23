import { BeatMood, BeatPattern, MusicPreference, Song } from '../types/zorb';

const DB_NAME = 'zorb_custom_tracks_db';
const STORE_NAME = 'tracks';
const DB_VERSION = 1;

export interface StoredCustomTrack {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration: number;
  tags: MusicPreference[];
  bpm: number;
  audioBlob: Blob;
  createdAt: string;
  sourceType?: 'import' | 'beat';
  mood?: BeatMood;
  steps?: BeatPattern;
  isPublishedToCommunity?: boolean;
}

export interface CustomSongWithFlag extends Song {
  isCustomImported: true;
  sourceType: 'import' | 'beat';
  mood?: BeatMood;
  steps?: BeatPattern;
  isPublishedToCommunity?: boolean;
  createdAt?: string;
}

function openTracksDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCustomTrack(track: StoredCustomTrack): Promise<void> {
  const db = await openTracksDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(track);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function markBeatPublishedInDb(id: string): Promise<void> {
  try {
    const db = await openTracksDb();
    const record = await new Promise<StoredCustomTrack | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result as StoredCustomTrack | undefined);
      req.onerror = () => reject(req.error);
    });
    if (record) {
      await saveCustomTrack({ ...record, isPublishedToCommunity: true });
    }
  } catch {
    // Ignore
  }
}

export async function loadCustomTracks(): Promise<CustomSongWithFlag[]> {
  try {
    const db = await openTracksDb();
    const items = await new Promise<StoredCustomTrack[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve((req.result as StoredCustomTrack[]) || []);
      req.onerror = () => reject(req.error);
    });

    return items
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        cover: item.cover,
        audioUrl: URL.createObjectURL(item.audioBlob),
        duration: item.duration,
        genre: 'Phonk',
        tags: item.tags,
        bpm: item.bpm,
        isCustomImported: true,
        sourceType: item.sourceType ?? (item.id.startsWith('beat-') ? 'beat' : 'import'),
        mood: item.mood,
        steps: item.steps,
        isPublishedToCommunity: item.isPublishedToCommunity,
        createdAt: item.createdAt,
      }));
  } catch {
    return [];
  }
}

export async function deleteCustomTrack(id: string): Promise<void> {
  const db = await openTracksDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function detectAudioDuration(file: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      const dur = Number.isFinite(audio.duration) ? Math.round(audio.duration) : 60;
      URL.revokeObjectURL(url);
      resolve(Math.max(1, dur));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(60);
    };
    audio.src = url;
  });
}
