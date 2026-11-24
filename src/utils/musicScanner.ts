import { COVER_ART } from '../data/songs';
import { Song } from '../types/zorb';
import { detectAudioDuration, StoredCustomTrack } from './customTracksDb';

const AUDIO_EXTENSIONS = new Set([
  'mp3',
  'wav',
  'm4a',
  'aac',
  'ogg',
  'flac',
  'opus',
  'weba',
  'webm',
  'mp4',
]);

const COVER_POOL = [
  COVER_ART.neonBlade,
  COVER_ART.drift,
  COVER_ART.brazilian,
  COVER_ART.obsidian,
  COVER_ART.gym,
];

const HANDLE_DB_NAME = 'zorb_music_scan_handles_v1';
const HANDLE_STORE = 'handles';
const HANDLE_KEY = 'primary_music_dir';

interface ParsedId3 {
  title?: string;
  artist?: string;
  coverDataUrl?: string;
}

function isAudioFile(file: File): boolean {
  if (file.type && file.type.startsWith('audio/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return AUDIO_EXTENSIONS.has(ext);
}

function decodeId3Text(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  const encoding = bytes[0];
  const payload = bytes.slice(1);
  try {
    if (encoding === 0) {
      return new TextDecoder('iso-8859-1').decode(payload).replace(/\0/g, '').trim();
    }
    if (encoding === 1 || encoding === 2) {
      return new TextDecoder(encoding === 1 ? 'utf-16' : 'utf-16be')
        .decode(payload)
        .replace(/\0/g, '')
        .trim();
    }
    return new TextDecoder('utf-8').decode(payload).replace(/\0/g, '').trim();
  } catch {
    return '';
  }
}

function uint8ToDataUrl(mime: string, data: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < data.length; i += chunkSize) {
    const slice = data.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return `data:${mime || 'image/jpeg'};base64,${btoa(binary)}`;
}

function parseApicFrame(bytes: Uint8Array): string | undefined {
  if (bytes.length < 10) return undefined;
  const encoding = bytes[0];
  let idx = 1;
  while (idx < bytes.length && bytes[idx] !== 0) idx++;
  const mime = new TextDecoder('ascii').decode(bytes.slice(1, idx)) || 'image/jpeg';
  idx += 2; // skip null + pictureType
  if (encoding === 1 || encoding === 2) {
    while (idx + 1 < bytes.length && !(bytes[idx] === 0 && bytes[idx + 1] === 0)) {
      idx += 2;
    }
    idx += 2;
  } else {
    while (idx < bytes.length && bytes[idx] !== 0) idx++;
    idx += 1;
  }
  if (idx >= bytes.length) return undefined;
  const imgBytes = bytes.slice(idx);
  if (imgBytes.length < 32 || imgBytes.length > 2_000_000) return undefined;
  return uint8ToDataUrl(mime, imgBytes);
}

async function extractId3Tags(file: File): Promise<ParsedId3> {
  try {
    const slice = file.slice(0, 320 * 1024);
    const buf = await slice.arrayBuffer();
    const bytes = new Uint8Array(buf);
    if (bytes.length < 10) return {};
    if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return {}; // "ID3"

    const version = bytes[3];
    const tagSize =
      ((bytes[6] & 0x7f) << 21) |
      ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) |
      (bytes[9] & 0x7f);

    const endOffset = Math.min(bytes.length, 10 + tagSize);
    let offset = 10;
    const result: ParsedId3 = {};

    while (offset + 10 <= endOffset) {
      const frameId = String.fromCharCode(
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3]
      );
      if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

      const frameSize =
        version === 4
          ? ((bytes[offset + 4] & 0x7f) << 21) |
            ((bytes[offset + 5] & 0x7f) << 14) |
            ((bytes[offset + 6] & 0x7f) << 7) |
            (bytes[offset + 7] & 0x7f)
          : (bytes[offset + 4] << 24) |
            (bytes[offset + 5] << 16) |
            (bytes[offset + 6] << 8) |
            bytes[offset + 7];

      offset += 10;
      if (frameSize <= 0 || offset + frameSize > endOffset) break;

      const frameData = bytes.slice(offset, offset + frameSize);
      if (frameId === 'TIT2' && !result.title) {
        result.title = decodeId3Text(frameData);
      } else if (frameId === 'TPE1' && !result.artist) {
        result.artist = decodeId3Text(frameData);
      } else if (frameId === 'APIC' && !result.coverDataUrl) {
        result.coverDataUrl = parseApicFrame(frameData);
      }
      offset += frameSize;
    }

    return result;
  } catch {
    return {};
  }
}

function parseTitleAndArtistFromFilename(fileName: string): { title: string; artist: string } {
  const clean = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').trim();
  const dashSplit = clean.split(' - ');
  if (dashSplit.length >= 2) {
    return {
      artist: dashSplit[0].trim() || 'Local Artist',
      title: dashSplit.slice(1).join(' - ').trim().toUpperCase() || clean.toUpperCase(),
    };
  }
  return {
    title: clean.toUpperCase() || 'LOCAL TRACK',
    artist: 'Local Device',
  };
}

export function buildSongSignature(title: string, artist: string, duration: number): string {
  return `${title.trim().toLowerCase()}|${artist.trim().toLowerCase()}|${Math.round(duration)}`;
}

export function buildFileSignature(file: File): string {
  return `${file.name.toLowerCase()}|${file.size}`;
}

export async function processScannedAudioFiles(
  files: File[],
  existingSongs: Song[],
  remainingSlots: number
): Promise<{
  addedTracks: StoredCustomTrack[];
  skippedDuplicates: number;
  skippedByLimit: number;
}> {
  const audioFiles = files.filter(isAudioFile);
  const existingSignatures = new Set(
    existingSongs.map((s) => buildSongSignature(s.title, s.artist, s.duration))
  );
  const existingTitles = new Set(existingSongs.map((s) => s.title.trim().toLowerCase()));
  const seenFiles = new Set<string>();

  const addedTracks: StoredCustomTrack[] = [];
  let skippedDuplicates = 0;
  let skippedByLimit = 0;

  for (let i = 0; i < audioFiles.length; i++) {
    const file = audioFiles[i];
    const fileKey = buildFileSignature(file);
    if (seenFiles.has(fileKey)) {
      skippedDuplicates++;
      continue;
    }
    seenFiles.add(fileKey);

    const [id3, duration] = await Promise.all([extractId3Tags(file), detectAudioDuration(file)]);
    const fallback = parseTitleAndArtistFromFilename(file.name);
    const title = (id3.title || fallback.title).toUpperCase().slice(0, 60);
    const artist = (id3.artist || fallback.artist).slice(0, 60);
    const sig = buildSongSignature(title, artist, duration);

    if (existingSignatures.has(sig) || existingTitles.has(title.toLowerCase())) {
      skippedDuplicates++;
      continue;
    }

    if (addedTracks.length >= remainingSlots) {
      skippedByLimit++;
      continue;
    }

    existingSignatures.add(sig);
    existingTitles.add(title.toLowerCase());

    const cover = id3.coverDataUrl || COVER_POOL[(existingSongs.length + addedTracks.length) % COVER_POOL.length];
    addedTracks.push({
      id: `custom-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      artist,
      cover,
      duration,
      tags: ['Phonk'],
      bpm: 130,
      audioBlob: file,
      createdAt: new Date().toISOString(),
      sourceType: 'import',
    });
  }

  return { addedTracks, skippedDuplicates, skippedByLimit };
}

interface DirectoryHandleLike {
  values: () => AsyncIterable<FileSystemHandleLike>;
  queryPermission?: (opts: { mode: 'read' }) => Promise<'granted' | 'denied' | 'prompt'>;
}

interface FileSystemHandleLike {
  kind: 'file' | 'directory';
  getFile?: () => Promise<File>;
  values?: () => AsyncIterable<FileSystemHandleLike>;
}

async function collectFilesRecursively(
  dirHandle: DirectoryHandleLike,
  depth: number = 0
): Promise<File[]> {
  if (depth > 5) return [];
  const files: File[] = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file' && entry.getFile) {
      try {
        const f = await entry.getFile();
        if (isAudioFile(f)) files.push(f);
      } catch {
        // Ignore unreadable file entry
      }
    } else if (entry.kind === 'directory' && entry.values) {
      const nested = await collectFilesRecursively(entry as unknown as DirectoryHandleLike, depth + 1);
      files.push(...nested);
    }
  }
  return files;
}

function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(HANDLE_STORE)) {
        req.result.createObjectStore(HANDLE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveMusicDirectoryHandle(handle: unknown): Promise<void> {
  try {
    const db = await openHandleDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readwrite');
      tx.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore unsupported handle cloning
  }
}

export async function scanSavedMusicDirectorySilently(): Promise<File[] | null> {
  try {
    const db = await openHandleDb();
    const handle = await new Promise<DirectoryHandleLike | undefined>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readonly');
      const req = tx.objectStore(HANDLE_STORE).get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result as DirectoryHandleLike | undefined);
      req.onerror = () => reject(req.error);
    });
    if (!handle || !handle.values) return null;
    if (handle.queryPermission) {
      const perm = await handle.queryPermission({ mode: 'read' });
      if (perm !== 'granted') return null;
    }
    return await collectFilesRecursively(handle);
  } catch {
    return null;
  }
}

export function supportsDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function pickAndScanDirectory(): Promise<File[] | null> {
  const picker = (window as unknown as {
    showDirectoryPicker?: (opts?: { mode?: 'read'; startIn?: string }) => Promise<DirectoryHandleLike>;
  }).showDirectoryPicker;
  if (!picker) return null;

  const handle = await picker({ mode: 'read', startIn: 'music' });
  await saveMusicDirectoryHandle(handle);
  return collectFilesRecursively(handle);
}
