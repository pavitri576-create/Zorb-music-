import { Song } from '../types/zorb';

const artworkCache = new Map<string, MediaImage[]>();

function toAbsoluteUrl(url: string): string {
  if (!url) return `${window.location.origin}/pwa-512x512.png`;
  if (url.startsWith('data:') || url.startsWith('blob:') || /^https?:\/\//i.test(url)) {
    return url;
  }
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return `${window.location.origin}/pwa-512x512.png`;
  }
}

function detectMimeType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.startsWith('data:image/png') || lower.endsWith('.png')) return 'image/png';
  if (lower.startsWith('data:image/webp') || lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function rasterizeTo512Png(srcUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = window.setTimeout(() => resolve(null), 2500);

    img.onload = () => {
      window.clearTimeout(timer);
      try {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, size, size);

        // Cover-crop center square at 512x512 for crisp lock-screen & notification art
        const sw = img.naturalWidth || size;
        const sh = img.naturalHeight || size;
        const scale = Math.max(size / sw, size / sh);
        const dw = sw * scale;
        const dh = sh * scale;
        const dx = (size - dw) / 2;
        const dy = (size - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);

        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };

    img.src = srcUrl;
  });
}

export async function resolveMediaArtwork(coverUrl: string): Promise<MediaImage[]> {
  if (typeof window === 'undefined') return [];

  const cached = artworkCache.get(coverUrl);
  if (cached) return cached;

  const absUrl = toAbsoluteUrl(coverUrl);
  const isSvgOrBlob =
    absUrl.startsWith('data:image/svg+xml') || absUrl.startsWith('blob:');

  // Android System Media Notification requires raster PNG/JPG artwork (ignores SVG data URLs)
  const rasterUrl = isSvgOrBlob ? await rasterizeTo512Png(absUrl) : null;
  const finalSrc = rasterUrl || (absUrl.startsWith('data:image/svg+xml')
    ? `${window.location.origin}/pwa-512x512.png`
    : absUrl);
  const mimeType = rasterUrl ? 'image/png' : detectMimeType(finalSrc);

  const images: MediaImage[] = [
    { src: finalSrc, sizes: '512x512', type: mimeType },
    { src: finalSrc, sizes: '192x192', type: mimeType },
  ];

  artworkCache.set(coverUrl, images);
  return images;
}

export async function updateMediaSessionMetadata(song: Song): Promise<void> {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  const absCover = toAbsoluteUrl(song.cover);
  const isSvg = absCover.startsWith('data:image/svg+xml');
  const immediateSrc = isSvg ? `${window.location.origin}/pwa-512x512.png` : absCover;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: 'ZORB — Z = M × D²',
      artwork: [
        { src: immediateSrc, sizes: '512x512', type: detectMimeType(immediateSrc) },
      ],
    });
  } catch {
    // Ignore unsupported MediaMetadata
  }

  const resolvedArtwork = await resolveMediaArtwork(song.cover);
  try {
    if (navigator.mediaSession.metadata?.title === song.title) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: 'ZORB — Z = M × D²',
        artwork: resolvedArtwork,
      });
    }
  } catch {
    // Ignore
  }
}

export function updateMediaSessionPositionAndState(
  isPlaying: boolean,
  duration: number,
  currentTime: number,
  playbackRate = 1
): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    if (
      typeof navigator.mediaSession.setPositionState === 'function' &&
      Number.isFinite(duration) &&
      duration > 0
    ) {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: playbackRate > 0 ? playbackRate : 1,
        position: Math.min(duration, Math.max(0, currentTime)),
      });
    }
  } catch {
    // Ignore unsupported setPositionState
  }
}
