function encodeAudioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataByteLength = numFrames * blockAlign;
  const totalBytes = 44 + dataByteLength;

  const arrayBuffer = new ArrayBuffer(totalBytes);
  const view = new DataView(arrayBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataByteLength, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export async function clipSongSegmentToWav(
  audioUrl: string,
  startSec: number,
  endSec: number
): Promise<{ blob: Blob; duration: number }> {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error('Could not read audio file offline.');
  }
  const arrayBuffer = await response.arrayBuffer();

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();

  try {
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    const safeStart = Math.max(0, Math.min(startSec, Math.max(0, decoded.duration - 2)));
    const safeEnd = Math.min(decoded.duration, Math.max(safeStart + 2, endSec));
    const clipDuration = safeEnd - safeStart;

    const sampleRate = decoded.sampleRate;
    const startFrame = Math.floor(safeStart * sampleRate);
    const frameCount = Math.max(1, Math.floor(clipDuration * sampleRate));
    const numChannels = Math.min(2, decoded.numberOfChannels);

    const clipped = ctx.createBuffer(numChannels, frameCount, sampleRate);
    const fadeFrames = Math.min(Math.floor(sampleRate * 0.04), Math.floor(frameCount / 4));

    for (let ch = 0; ch < numChannels; ch++) {
      const src = decoded.getChannelData(ch);
      const dst = clipped.getChannelData(ch);
      for (let i = 0; i < frameCount; i++) {
        let sample = src[startFrame + i] ?? 0;
        if (i < fadeFrames) {
          sample *= i / fadeFrames;
        } else if (i > frameCount - fadeFrames) {
          sample *= (frameCount - i) / fadeFrames;
        }
        dst[i] = sample;
      }
    }

    const blob = encodeAudioBufferToWav(clipped);
    return { blob, duration: Math.max(2, Math.round(clipDuration)) };
  } finally {
    ctx.close().catch(() => undefined);
  }
}
